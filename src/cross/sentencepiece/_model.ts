/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TypeScript representation of the SentencePiece model protobuf.
 * Translated from sentencepiece_model.proto
 */

export enum ModelType {
  UNIGRAM = 1,
  BPE = 2,
  WORD = 3,
  CHAR = 4,
}

export enum SentencePieceType {
  NORMAL = 1,
  UNKNOWN = 2,
  CONTROL = 3,
  USER_DEFINED = 4,
  BYTE = 6,
  UNUSED = 5,
}

export interface TrainerSpec {
  modelType?: ModelType;
  vocabSize?: number;
  characterCoverage?: number;
  byteFallback?: boolean;
  unkSurface?: string;
  // Add other fields as needed
}

export interface NormalizerSpec {
  name?: string;
  precompiledCharsmap?: Uint8Array;
  addDummyPrefix?: boolean;
  removeExtraWhitespaces?: boolean;
  escapeWhitespaces?: boolean;
  normalizationRuleTsv?: string;
}

export interface SentencePiece {
  piece?: string;
  score?: number;
  type?: SentencePieceType;
}

export interface ModelProto {
  pieces?: SentencePiece[];
  trainerSpec?: TrainerSpec;
  normalizerSpec?: NormalizerSpec;
}
