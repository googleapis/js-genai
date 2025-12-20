/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web-specific LocalTokenizer implementation.
 *
 * This wrapper automatically uses the Web platform (IndexedDB caching, SubtleCrypto hashing)
 * without requiring users to manually create a platform instance.
 *
 * NOTE: Web implementation is not yet complete. Use Node.js environment for now.
 */

import {LocalTokenizer as BaseLocalTokenizer} from '../cross/tokenizer/_local_tokenizer_impl.js';
import type {
  ComputeTokensResult,
  ContentListUnion,
  CountTokensConfig,
  CountTokensResult,
} from '../types.js';
import {WebTokenizerPlatform} from './_web_tokenizer_platform.js';

/**
 * LocalTokenizer for Web environment.
 *
 * Provides local tokenization for Gemini models without requiring API calls.
 * Automatically uses Web platform (IndexedDB caching, SubtleCrypto hashing).
 *
 * @example
 * ```typescript
 * import {LocalTokenizer} from '@google/genai/web';
 *
 * const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
 * const result = await tokenizer.countTokens("What is your name?");
 * console.log(result.totalTokens); // 5
 * ```
 *
 * @experimental This API is experimental and not yet fully implemented.
 * Use Node.js environment for now.
 */
export class LocalTokenizer {
  private baseTokenizer: BaseLocalTokenizer;

  /**
   * Creates a new LocalTokenizer for Web.
   *
   * @param modelName Gemini model name (e.g., 'gemini-2.0-flash-001')
   */
  constructor(modelName: string) {
    const platform = new WebTokenizerPlatform();
    this.baseTokenizer = new BaseLocalTokenizer(modelName, platform);
  }

  /**
   * Counts the number of tokens in the given content.
   *
   * @param contents The contents to tokenize
   * @param config Optional configuration for counting tokens
   * @return A CountTokensResult containing the total number of tokens
   */
  async countTokens(
    contents: ContentListUnion,
    config?: CountTokensConfig,
  ): Promise<CountTokensResult> {
    return this.baseTokenizer.countTokens(contents, config);
  }

  /**
   * Computes detailed token information for the given content.
   *
   * @param contents The contents to tokenize
   * @return A ComputeTokensResult containing token IDs, bytes, and roles
   */
  async computeTokens(
    contents: ContentListUnion,
  ): Promise<ComputeTokensResult> {
    return this.baseTokenizer.computeTokens(contents);
  }
}
