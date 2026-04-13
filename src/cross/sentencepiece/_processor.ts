/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure TypeScript implementation of SentencePiece tokenizer.
 * Translated from github.com/eliben/go-sentencepiece
 */

import {ModelProto, ModelType, SentencePieceType} from './_model.js';
import {PrefixMatcher} from './_prefix_matcher.js';
import {PriorityQueue} from './_priority_queue.js';
import {sentencepiece} from './sentencepiece_model.pb.js';

const WHITESPACE_SEPARATOR = '▁';

/** Token represents a single token from the input text */
export interface Token {
  id: number;
  text: string;
}

/** Model information */
export interface ModelInfo {
  vocabularySize: number;
  beginningOfSentenceID: number;
  endOfSentenceID: number;
  unknownID: number;
  padID: number;
}

const SYMBOL_BOS = '<bos>';
const SYMBOL_EOS = '<eos>';
const SYMBOL_PAD = '<pad>';

/**
 * Processor represents a SentencePiece processor (tokenizer).
 * It converts input text into a sequence of tokens and back.
 */
export class SentencePieceProcessor {
  private model: ModelProto;
  private pieces: Map<string, number>;
  private reserved: Map<string, number>;
  private unknownID: number;
  private userDefinedMatcher: PrefixMatcher;
  private byte2Token: Map<number, Token>;
  private idToByte: Map<number, number>;
  private maxPieceLength: number;

  /**
   * Creates a new Processor from model proto bytes.
   */
  constructor(modelProtoBytes: Uint8Array) {
    this.model = this.parseModelProto(modelProtoBytes);

    const tspec = this.model.trainerSpec;
    if (!tspec || tspec.modelType !== ModelType.BPE) {
      throw new Error(
        `Model type ${tspec?.modelType} not supported, only BPE is supported`,
      );
    }

    const nspec = this.model.normalizerSpec;
    if (nspec?.addDummyPrefix || nspec?.removeExtraWhitespaces) {
      throw new Error(
        `Normalizer spec options not supported: ${JSON.stringify(nspec)}`,
      );
    }

    const userDefined = new Set<string>();
    this.pieces = new Map();
    this.reserved = new Map();
    this.byte2Token = new Map();
    this.idToByte = new Map();
    this.unknownID = -1;
    this.maxPieceLength = 0;

    if (!this.model.pieces) {
      throw new Error('Model has no pieces');
    }

    for (let i = 0; i < this.model.pieces.length; i++) {
      const piece = this.model.pieces[i];
      const pieceText = piece.piece ?? '';
      const pieceType = piece.type ?? SentencePieceType.NORMAL;

      const isNormalPiece =
        pieceType === SentencePieceType.NORMAL ||
        pieceType === SentencePieceType.USER_DEFINED ||
        pieceType === SentencePieceType.UNUSED;

      if (isNormalPiece) {
        this.pieces.set(pieceText, i);
        this.maxPieceLength = Math.max(this.maxPieceLength, pieceText.length);
      } else {
        this.reserved.set(pieceText, i);
      }

      if (pieceType === SentencePieceType.USER_DEFINED) {
        userDefined.add(pieceText);
      } else if (pieceType === SentencePieceType.UNKNOWN) {
        if (this.unknownID >= 0) {
          throw new Error('unk redefined');
        }
        this.unknownID = i;
      } else if (pieceType === SentencePieceType.BYTE) {
        if (!tspec.byteFallback) {
          throw new Error(
            `byte piece "${pieceText}" found although byte_fallback=false`,
          );
        }
        const bv = convertHexValue(pieceText);
        if (bv >= 0 && bv < 256) {
          this.byte2Token.set(bv, {id: i, text: pieceText});
          this.idToByte.set(i, bv);
        }
      }
    }

    if (this.unknownID < 0) {
      throw new Error('unk symbol is not defined');
    }

    // If byte_fallback is specified, ensure all 256 byte values are present
    if (tspec.byteFallback) {
      for (let i = 0; i < 256; i++) {
        if (!this.byte2Token.has(i)) {
          throw new Error(
            `byte value 0x${i.toString(16).padStart(2, '0')} not found`,
          );
        }
      }
    }

    this.userDefinedMatcher = new PrefixMatcher(userDefined);
  }

  /**
   * Encodes text into a list of tokens.
   */
  encode(text: string): Token[] {
    text = this.normalize(text);

    // Symbol list element type
    interface SymListElem {
      prev: number;
      next: number;
      noMerge: boolean;
      symbol: string;
    }

    const symList: SymListElem[] = [];

    while (text.length > 0) {
      const [slen, found] = this.symbolMatch(text);

      const sym: SymListElem = {
        noMerge: found,
        symbol: text.substring(0, slen),
        prev: symList.length - 1,
        next: symList.length + 1,
      };
      symList.push(sym);

      text = text.substring(slen);
    }

    if (symList.length === 0) {
      return [];
    }

    symList[symList.length - 1].next = -1;
    let _nTokens = symList.length;

    interface MergeCandidate {
      left: number;
      right: number;
      length: number;
      score: number;
    }

    const mergeQueue = new PriorityQueue<MergeCandidate>(
      symList.length,
      (a, b) => {
        if (a.score > b.score || (a.score === b.score && a.left < b.left)) {
          return 1;
        }
        return -1;
      },
    );

    const findMerged = (
      x: SymListElem,
      y: SymListElem,
    ): [string, number, boolean] => {
      const merged = x.symbol + y.symbol;
      const id = this.pieces.get(merged);
      if (id !== undefined && this.model.pieces) {
        return [this.model.pieces[id].piece ?? '', id, true];
      }
      return ['', 0, false];
    };

    const suggestNewMergePair = (left: number, right: number) => {
      if (
        left === -1 ||
        right === -1 ||
        symList[left].noMerge ||
        symList[right].noMerge
      ) {
        return;
      }

      const [mergedSymbol, id, ok] = findMerged(symList[left], symList[right]);
      if (ok && this.model.pieces) {
        mergeQueue.insert({
          left,
          right,
          length: mergedSymbol.length,
          score: this.model.pieces[id].score ?? 0,
        });
      }
    };

    for (let i = 1; i < symList.length; i++) {
      suggestNewMergePair(i - 1, i);
    }

    const candidateIsDead = (candidate: MergeCandidate): boolean => {
      const leftSymbol = symList[candidate.left].symbol;
      const rightSymbol = symList[candidate.right].symbol;
      return (
        leftSymbol === '' ||
        rightSymbol === '' ||
        leftSymbol.length + rightSymbol.length !== candidate.length
      );
    };

    let mergeQueueDead = 0;
    while (mergeQueue.len() > 0) {
      const candidate = mergeQueue.popMax();
      const leftSymbol = symList[candidate.left];
      const rightSymbol = symList[candidate.right];

      if (candidateIsDead(candidate)) {
        mergeQueueDead--;
        continue;
      }

      if (mergeQueueDead * 3 > mergeQueue.len()) {
        mergeQueue.removeFunc(candidateIsDead);
        mergeQueueDead = 0;
      }

      const [mergedSymbol, , ok] = findMerged(leftSymbol, rightSymbol);
      if (!ok) {
        throw new Error('failed to merge symbols');
      }
      symList[candidate.left].symbol = mergedSymbol;
      _nTokens--;

      symList[candidate.left].next = rightSymbol.next;
      if (rightSymbol.next >= 0) {
        symList[rightSymbol.next].prev = candidate.left;
      }

      symList[candidate.right].symbol = '';
      mergeQueueDead++;

      suggestNewMergePair(leftSymbol.prev, candidate.left);
      suggestNewMergePair(candidate.left, rightSymbol.next);
    }

    const tokens: Token[] = [];
    for (let i = 0; i >= 0; i = symList[i].next) {
      const symbol = symList[i].symbol;
      const id = this.symbolToID(symbol);
      if (id === this.unknownID && this.model.trainerSpec?.byteFallback) {
        // Need to convert byte to token at UTF-8 bytes level
        const bytes = new TextEncoder().encode(symbol);
        for (let j = 0; j < bytes.length; j++) {
          const byteToken = this.byte2Token.get(bytes[j]);
          if (byteToken) {
            tokens.push(byteToken);
          }
        }
      } else {
        tokens.push({id, text: symbol});
      }
    }

    return tokens;
  }

  /**
   * Decodes a list of token IDs back into text.
   */
  decode(ids: number[]): string {
    const parts: string[] = [];

    let i = 0;
    while (i < ids.length) {
      let nextNonByte = i;
      while (nextNonByte < ids.length && this.isByteID(ids[nextNonByte])) {
        nextNonByte++;
      }
      const numBytes = nextNonByte - i;

      if (numBytes > 0) {
        const bytes: number[] = [];
        for (let bi = i; bi < nextNonByte; bi++) {
          const byte = this.idToByte.get(ids[bi]);
          if (byte !== undefined) {
            bytes.push(byte);
          }
        }

        const textDecoder = new TextDecoder('utf-8', {fatal: false});
        const text = textDecoder.decode(new Uint8Array(bytes));
        parts.push(text);
      }

      if (nextNonByte >= ids.length) {
        break;
      }

      const id = ids[nextNonByte];
      // eslint-disable-next-line no-empty
      if (this.isControlID(id)) {
      } else if (id === this.unknownID) {
        parts.push(this.model.trainerSpec?.unkSurface ?? '');
      } else if (this.model.pieces && this.model.pieces[id]) {
        const piece = this.model.pieces[id].piece ?? '';
        parts.push(this.replaceSeparatorsBySpace(piece));
      }
      i = nextNonByte + 1;
    }

    return parts.join('');
  }

  /**
   * Decodes a list of tokens back into text.
   */
  decodeTokens(tokens: Token[]): string {
    return this.decode(tokens.map((t) => t.id));
  }

  /**
   * Returns information about the loaded model.
   */
  modelInfo(): ModelInfo {
    const getControlID = (symbol: string): number => {
      const id = this.symbolToID(symbol);
      return this.isControlID(id) ? id : -1;
    };

    return {
      vocabularySize: this.model.pieces?.length ?? 0,
      beginningOfSentenceID: getControlID(SYMBOL_BOS),
      endOfSentenceID: getControlID(SYMBOL_EOS),
      padID: getControlID(SYMBOL_PAD),
      unknownID: this.unknownID,
    };
  }

  private normalize(text: string): string {
    return text.replace(/ /g, WHITESPACE_SEPARATOR);
  }

  private replaceSeparatorsBySpace(text: string): string {
    return text.replace(new RegExp(WHITESPACE_SEPARATOR, 'g'), ' ');
  }

  private symbolMatch(text: string): [number, boolean] {
    const prefixLen = this.userDefinedMatcher.findPrefixLen(text);
    if (prefixLen > 0) {
      return [prefixLen, true];
    }

    // Return character length (1), not byte length
    // This matches the Java implementation where i++ advances by 1 character
    return [1, false];
  }

  private symbolToID(symbol: string): number {
    const reservedID = this.reserved.get(symbol);
    if (reservedID !== undefined) {
      return reservedID;
    }
    const pieceID = this.pieces.get(symbol);
    if (pieceID !== undefined) {
      return pieceID;
    }
    return this.unknownID;
  }

  private isByteID(id: number): boolean {
    if (!this.model.pieces || id >= this.model.pieces.length) {
      return false;
    }
    return this.model.pieces[id].type === SentencePieceType.BYTE;
  }

  private isControlID(id: number): boolean {
    if (!this.model.pieces || id >= this.model.pieces.length) {
      return false;
    }
    return this.model.pieces[id].type === SentencePieceType.CONTROL;
  }

  private parseModelProto(data: Uint8Array): ModelProto {
    const decoded = sentencepiece.ModelProto.decode(data);

    const model: ModelProto = {
      pieces: decoded.pieces?.map(
        (p: sentencepiece.ModelProto.ISentencePiece) => ({
          piece: p.piece ?? undefined,
          score: p.score ?? undefined,
          type: (p.type as unknown as SentencePieceType) ?? undefined,
        }),
      ),
      trainerSpec: decoded.trainerSpec
        ? {
            modelType:
              (decoded.trainerSpec.modelType as unknown as ModelType) ??
              undefined,
            vocabSize: decoded.trainerSpec.vocabSize ?? undefined,
            characterCoverage:
              decoded.trainerSpec.characterCoverage ?? undefined,
            byteFallback: decoded.trainerSpec.byteFallback ?? undefined,
            unkSurface: decoded.trainerSpec.unkSurface ?? undefined,
          }
        : undefined,
      normalizerSpec: decoded.normalizerSpec
        ? {
            name: decoded.normalizerSpec.name ?? undefined,
            precompiledCharsmap: decoded.normalizerSpec.precompiledCharsmap
              ? new Uint8Array(decoded.normalizerSpec.precompiledCharsmap)
              : undefined,
            addDummyPrefix: decoded.normalizerSpec.addDummyPrefix ?? undefined,
            removeExtraWhitespaces:
              decoded.normalizerSpec.removeExtraWhitespaces ?? undefined,
            escapeWhitespaces:
              decoded.normalizerSpec.escapeWhitespaces ?? undefined,
            normalizationRuleTsv:
              decoded.normalizerSpec.normalizationRuleTsv ?? undefined,
          }
        : undefined,
    };

    return model;
  }
}

function convertHexValue(bv: string): number {
  const match = bv.match(/^<0x([0-9A-Fa-f]{2})>$/);
  if (!match) {
    return -1;
  }
  return parseInt(match[1], 16);
}
