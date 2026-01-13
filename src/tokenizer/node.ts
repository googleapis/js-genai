/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Public API for LocalTokenizer (Node.js).
 *
 * This module provides local tokenization capabilities for Gemini models without
 * requiring API calls. The tokenizer uses SentencePiece BPE algorithm and supports
 * text-only token counting and computation.
 *
 * @example Node.js Usage
 * ```typescript
 * import {LocalTokenizer} from '@google/genai/tokenizer/node';
 *
 * const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
 * const result = await tokenizer.countTokens("What is your name?");
 * console.log(result.totalTokens); // 5
 * ```
 *
 * @experimental This API is experimental and may change in future versions.
 */

// Re-export from node-specific local_tokenizer
export {LocalTokenizer} from '../node/local_tokenizer.js';

// Re-export types that users might need
export type {
  ComputeTokensResult,
  CountTokensResult,
  TokensInfo,
} from '../types.js';
