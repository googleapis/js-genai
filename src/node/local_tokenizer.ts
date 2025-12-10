/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Node.js-specific LocalTokenizer implementation.
 *
 * This wrapper automatically uses the Node.js platform (filesystem caching, crypto hashing)
 * without requiring users to manually create a platform instance.
 */

import {LocalTokenizer as BaseLocalTokenizer} from '../cross/tokenizer/_local_tokenizer_impl.js';
import type {
  ComputeTokensResult,
  ContentListUnion,
  CountTokensConfig,
  CountTokensResult,
} from '../types.js';
import {NodeTokenizerPlatform} from './_node_tokenizer_platform.js';

/**
 * LocalTokenizer for Node.js environment.
 *
 * Provides local tokenization for Gemini models without requiring API calls.
 * Automatically uses Node.js platform (filesystem caching in temp directory).
 *
 * @example
 * ```typescript
 * import {LocalTokenizer} from '@google/genai/node';
 *
 * const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
 * const result = await tokenizer.countTokens("What is your name?");
 * console.log(result.totalTokens); // 5
 * ```
 *
 * @experimental This API is experimental and may change in future versions.
 */
export class LocalTokenizer {
  private baseTokenizer: BaseLocalTokenizer;

  /**
   * Creates a new LocalTokenizer for Node.js.
   *
   * @param modelName Gemini model name (e.g., 'gemini-2.0-flash-001')
   */
  constructor(modelName: string) {
    const platform = new NodeTokenizerPlatform();
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
