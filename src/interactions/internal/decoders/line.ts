/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { concatBytes, decodeUTF8, encodeUTF8 } from '../utils/bytes.js';

export type Bytes = string | ArrayBuffer | Uint8Array | null | undefined;

/**
 * A re-implementation of httpx's `LineDecoder` in Python that handles incrementally
 * reading lines from text.
 *
 * https://github.com/encode/httpx/blob/920333ea98118e9cf617f246905d7b202510941c/httpx/_decoders.py#L258
 */
export class LineDecoder {
  // prettier-ignore
  static NEWLINE_CHARS = new Set(['\n', '\r']);
  static NEWLINE_REGEXP = /\r\n|[\n\r]/g;

  private buffer: Uint8Array;
  private carriageReturnIndex: number | null;
  private searchIndex: number;

  constructor() {
    this.buffer = new Uint8Array();
    this.carriageReturnIndex = null;
    this.searchIndex = 0;
  }

  decode(chunk: Bytes): string[] {
    if (chunk == null) {
      return [];
    }

    const binaryChunk =
      chunk instanceof ArrayBuffer ? new Uint8Array(chunk)
      : typeof chunk === 'string' ? encodeUTF8(chunk)
      : chunk;

    this.buffer = concatBytes([this.buffer, binaryChunk]);

    const lines: string[] = [];
    let patternIndex;
    while (
      (patternIndex = findNewlineIndex(this.buffer, this.carriageReturnIndex ?? this.searchIndex)) != null
    ) {
      if (patternIndex.carriage && this.carriageReturnIndex == null) {
        // skip until we either get a corresponding `\n`, a new `\r` or nothing
        this.carriageReturnIndex = patternIndex.index;
        continue;
      }

      // we got double \r or \rtext\n
      if (
        this.carriageReturnIndex != null &&
        (patternIndex.index !== this.carriageReturnIndex + 1 || patternIndex.carriage)
      ) {
        lines.push(decodeUTF8(this.buffer.subarray(0, this.carriageReturnIndex - 1)));
        this.buffer = this.buffer.subarray(this.carriageReturnIndex);
        this.carriageReturnIndex = null;
        this.searchIndex = 0;
        continue;
      }

      const endIndex =
        this.carriageReturnIndex !== null ? patternIndex.preceding - 1 : patternIndex.preceding;

      const line = decodeUTF8(this.buffer.subarray(0, endIndex));
      lines.push(line);

      this.buffer = this.buffer.subarray(patternIndex.index);
      this.carriageReturnIndex = null;
      this.searchIndex = 0;
    }

    this.searchIndex = Math.max(0, this.buffer.length - 1);

    return lines;
  }

  flush(): string[] {
    if (!this.buffer.length) {
      return [];
    }
    return this.decode('\n');
  }
}

/**
 * This function searches the buffer for the end patterns, (\r or \n)
 * and returns an object with the index preceding the matched newline and the
 * index after the newline char. `null` is returned if no new line is found.
 *
 * ```ts
 * findNewLineIndex('abc\ndef') -> { preceding: 2, index: 3 }
 * ```
 */
function findNewlineIndex(
  buffer: Uint8Array,
  startIndex: number | null,
): { preceding: number; index: number; carriage: boolean } | null {
  const newline = 0x0a; // \n
  const carriage = 0x0d; // \r

  const start = startIndex ?? 0;
  const nextNewline = buffer.indexOf(newline, start);
  const nextCarriage = buffer.indexOf(carriage, start);

  if (nextNewline === -1 && nextCarriage === -1) {
    return null;
  }

  let i: number;
  if (nextNewline !== -1 && nextCarriage !== -1) {
    i = Math.min(nextNewline, nextCarriage);
  } else {
    i = nextNewline !== -1 ? nextNewline : nextCarriage;
  }

  if (buffer[i] === newline) {
    return { preceding: i, index: i + 1, carriage: false };
  }

  return { preceding: i, index: i + 1, carriage: true };
}

export function findDoubleNewlineIndex(buffer: Uint8Array, startIndex: number = 0): number {
  // This function searches the buffer for the end patterns (\r\r, \n\n, \r\n\r\n)
  // and returns the index right after the first occurrence of any pattern,
  // or -1 if none of the patterns are found.
  const newline = 0x0a; // \n
  const carriage = 0x0d; // \r

  let i = startIndex;
  while (i < buffer.length - 1) {
    const nextNewline = buffer.indexOf(newline, i);
    const nextCarriage = buffer.indexOf(carriage, i);

    if (nextNewline === -1 && nextCarriage === -1) {
      return -1;
    }

    let index: number;
    if (nextNewline !== -1 && nextCarriage !== -1) {
      index = Math.min(nextNewline, nextCarriage);
    } else {
      index = nextNewline !== -1 ? nextNewline : nextCarriage;
    }

    if (index >= buffer.length - 1) {
      return -1;
    }

    if (buffer[index] === newline && buffer[index + 1] === newline) {
      // \n\n
      return index + 2;
    }
    if (buffer[index] === carriage && buffer[index + 1] === carriage) {
      // \r\r
      return index + 2;
    }
    if (
      buffer[index] === carriage &&
      buffer[index + 1] === newline &&
      index + 3 < buffer.length &&
      buffer[index + 2] === carriage &&
      buffer[index + 3] === newline
    ) {
      // \r\n\r\n
      return index + 4;
    }
    i = index + 1;
  }

  return -1;
}
