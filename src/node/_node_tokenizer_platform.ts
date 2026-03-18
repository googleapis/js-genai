/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import {
  TokenizerCache,
  TokenizerFileSystem,
  TokenizerPlatform,
} from '../cross/tokenizer/_interfaces.js';

/**
 * Node.js implementation of tokenizer cache using the file system.
 */
export class NodeTokenizerCache implements TokenizerCache {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(os.tmpdir(), 'vertexai_tokenizer_model');
  }

  async load(
    cacheKey: string,
    expectedHash: string,
  ): Promise<Uint8Array | null> {
    const filePath = path.join(this.cacheDir, cacheKey);
    try {
      const data = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(data).digest('hex');

      if (hash === expectedHash) {
        return new Uint8Array(data);
      }

      await this.removeFile(filePath);
      return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }

  async save(cacheKey: string, data: Uint8Array): Promise<void> {
    const filePath = path.join(this.cacheDir, cacheKey);
    try {
      await fs.mkdir(this.cacheDir, {recursive: true});

      const tmpPath = `${this.cacheDir}.${crypto.randomUUID()}.tmp`;
      await fs.writeFile(tmpPath, data);
      await fs.rename(tmpPath, filePath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Cache is optional, so errors are silently ignored
    }
  }

  private async removeFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Cache is optional, so errors are silently ignored
    }
  }
}

/**
 * Node.js implementation of tokenizer file system operations.
 */
export class NodeTokenizerFileSystem implements TokenizerFileSystem {
  async fetchFromUrl(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch tokenizer model from ${url}: ${response.statusText}`,
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async validateHash(data: Uint8Array, expectedHash: string): Promise<boolean> {
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash === expectedHash;
  }

  async computeSha1(text: Uint8Array): Promise<string> {
    const hash = crypto.createHash('sha1').update(text).digest('hex');
    return hash;
  }
}

/**
 * Node.js platform implementation for tokenizer.
 */
export class NodeTokenizerPlatform implements TokenizerPlatform {
  cache: TokenizerCache;
  fileSystem: TokenizerFileSystem;

  constructor() {
    this.cache = new NodeTokenizerCache();
    this.fileSystem = new NodeTokenizerFileSystem();
  }
}
