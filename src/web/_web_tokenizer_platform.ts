/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TokenizerCache,
  TokenizerFileSystem,
  TokenizerPlatform,
} from '../cross/tokenizer/_interfaces.js';

/**
 * Web implementation of tokenizer cache using IndexedDB.
 * TODO: Implement using IndexedDB for web storage.
 */
export class WebTokenizerCache implements TokenizerCache {
  async load(
    _cacheKey: string,
    _expectedHash: string,
  ): Promise<Uint8Array | null> {
    throw new Error(
      'Web tokenizer cache not yet implemented. Use Node.js environment for local tokenization.',
    );
  }

  async save(_cacheKey: string, _data: Uint8Array): Promise<void> {
    throw new Error(
      'Web tokenizer cache not yet implemented. Use Node.js environment for local tokenization.',
    );
  }
}

/**
 * Web implementation of tokenizer file system operations.
 * TODO: Implement using fetch API and SubtleCrypto.
 */
export class WebTokenizerFileSystem implements TokenizerFileSystem {
  async fetchFromUrl(_url: string): Promise<Uint8Array> {
    throw new Error(
      'Web tokenizer file system not yet implemented. Use Node.js environment for local tokenization.',
    );
  }

  async validateHash(
    _data: Uint8Array,
    _expectedHash: string,
  ): Promise<boolean> {
    throw new Error(
      'Web tokenizer file system not yet implemented. Use Node.js environment for local tokenization.',
    );
  }

  async computeSha1(_text: Uint8Array): Promise<string> {
    throw new Error(
      'Web tokenizer file system not yet implemented. Use Node.js environment for local tokenization.',
    );
  }
}

/**
 * Web platform implementation for tokenizer.
 * TODO: Complete implementation for web environment.
 */
export class WebTokenizerPlatform implements TokenizerPlatform {
  cache: TokenizerCache;
  fileSystem: TokenizerFileSystem;

  constructor() {
    this.cache = new WebTokenizerCache();
    this.fileSystem = new WebTokenizerFileSystem();
  }
}
