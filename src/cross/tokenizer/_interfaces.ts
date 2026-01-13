/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ComputeTokensResult,
  ContentListUnion,
  CountTokensConfig,
  CountTokensResult,
} from '../../types.js';

/**
 * Interface for platform-specific cache operations for tokenizer models.
 */
export interface TokenizerCache {
  /**
   * Loads tokenizer model data from cache if available and valid.
   *
   * @param cacheKey Unique identifier for the cached model
   * @param expectedHash SHA-256 hash to validate cached data
   * @return Cached model data if valid, null otherwise
   */
  load(cacheKey: string, expectedHash: string): Promise<Uint8Array | null>;

  /**
   * Saves tokenizer model data to cache.
   *
   * @param cacheKey Unique identifier for the model
   * @param data Model data to cache
   */
  save(cacheKey: string, data: Uint8Array): Promise<void>;
}

/**
 * Interface for platform-specific file operations for tokenizer.
 */
export interface TokenizerFileSystem {
  /**
   * Downloads file from URL.
   *
   * @param url URL to download from
   * @return File contents as bytes
   */
  fetchFromUrl(url: string): Promise<Uint8Array>;

  /**
   * Validates file hash using SHA-256.
   *
   * @param data File data
   * @param expectedHash Expected SHA-256 hash
   * @return true if hash matches
   */
  validateHash(data: Uint8Array, expectedHash: string): Promise<boolean>;

  /**
   * Computes SHA-1 hash of a string (used for cache keys).
   *
   * @param text Text to hash
   * @return SHA-1 hash as hex string
   */
  computeSha1(text: Uint8Array): Promise<string>;
}

/**
 * Platform-specific dependencies for tokenizer.
 */
export interface TokenizerPlatform {
  cache: TokenizerCache;
  fileSystem: TokenizerFileSystem;
}

/**
 * Configuration for a specific tokenizer model.
 */
export interface TokenizerConfig {
  modelUrl: string;
  modelHash: string;
}

/**
 * Interface for local tokenizer implementation.
 */
export interface ILocalTokenizer {
  /**
   * Counts the number of tokens in the given content.
   *
   * @param contents The contents to tokenize
   * @param config Optional configuration for counting tokens
   * @return A CountTokensResult containing the total number of tokens
   */
  countTokens(
    contents: ContentListUnion,
    config?: CountTokensConfig,
  ): Promise<CountTokensResult>;

  /**
   * Computes detailed token information for the given content.
   *
   * @param contents The contents to tokenize
   * @return A ComputeTokensResult containing token IDs, bytes, and roles
   */
  computeTokens(contents: ContentListUnion): Promise<ComputeTokensResult>;
}
