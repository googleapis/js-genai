/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {LocalTokenizer as BaseLocalTokenizer} from '../../../src/cross/tokenizer/_local_tokenizer_impl.js';
import type {Content} from '../../../src/types.js';
import {WebTokenizerPlatform} from '../../../src/web/_web_tokenizer_platform.js';
import {LocalTokenizer} from '../../../src/web/local_tokenizer.js';

describe('LocalTokenizer (Web)', () => {
  describe('constructor', () => {
    it('should create a LocalTokenizer instance', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      expect(tokenizer).toBeDefined();
      expect(tokenizer).toBeInstanceOf(LocalTokenizer);
    });

    it('should initialize with WebTokenizerPlatform', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      expect(tokenizer['baseTokenizer']).toBeDefined();
      expect(tokenizer['baseTokenizer']).toBeInstanceOf(BaseLocalTokenizer);

      const platform = tokenizer['baseTokenizer']['platform'];
      expect(platform).toBeInstanceOf(WebTokenizerPlatform);
    });

    it('should accept different model names', () => {
      const models = [
        'gemini-2.0-flash-001',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
      ];

      models.forEach((model) => {
        const tokenizer = new LocalTokenizer(model);
        expect(tokenizer).toBeDefined();
      });
    });

    it('should throw error for unsupported model', () => {
      expect(() => new LocalTokenizer('unsupported-model')).toThrowError(
        /is not supported for local tokenization/,
      );
    });
  });

  describe('countTokens', () => {
    let tokenizer: LocalTokenizer;

    beforeEach(() => {
      tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
    });

    it('should throw error for unimplemented web platform', async () => {
      await expectAsync(
        tokenizer.countTokens('Test text'),
      ).toBeRejectedWithError(/Web tokenizer file system not yet implemented/);
    });

    it('should throw error with Content object', async () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'Hello'}],
      };

      await expectAsync(tokenizer.countTokens(content)).toBeRejectedWithError(
        /Web tokenizer file system not yet implemented/,
      );
    });

    it('should throw error with array of Content objects', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi there!'}]},
      ];

      await expectAsync(tokenizer.countTokens(contents)).toBeRejectedWithError(
        /Web tokenizer file system not yet implemented/,
      );
    });
  });

  describe('computeTokens', () => {
    let tokenizer: LocalTokenizer;

    beforeEach(() => {
      tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
    });

    it('should throw error for unimplemented web platform', async () => {
      await expectAsync(
        tokenizer.computeTokens('Test text'),
      ).toBeRejectedWithError(/Web tokenizer file system not yet implemented/);
    });

    it('should throw error with Content object', async () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'What is AI?'}],
      };

      await expectAsync(tokenizer.computeTokens(content)).toBeRejectedWithError(
        /Web tokenizer file system not yet implemented/,
      );
    });

    it('should throw error with array of Content objects', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi'}]},
      ];

      await expectAsync(
        tokenizer.computeTokens(contents),
      ).toBeRejectedWithError(/Web tokenizer file system not yet implemented/);
    });
  });

  describe('platform integration', () => {
    it('should use WebTokenizerPlatform cache', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      expect(platform.cache).toBeDefined();
      expect(typeof platform.cache.load).toBe('function');
      expect(typeof platform.cache.save).toBe('function');
    });

    it('should use WebTokenizerPlatform fileSystem', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      expect(platform.fileSystem).toBeDefined();
      expect(typeof platform.fileSystem.fetchFromUrl).toBe('function');
      expect(typeof platform.fileSystem.validateHash).toBe('function');
      expect(typeof platform.fileSystem.computeSha1).toBe('function');
    });

    it('should throw error for unimplemented cache.load', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      await expectAsync(
        platform.cache.load('key', 'hash'),
      ).toBeRejectedWithError(/Web tokenizer cache not yet implemented/);
    });

    it('should throw error for unimplemented cache.save', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      await expectAsync(
        platform.cache.save('key', new Uint8Array()),
      ).toBeRejectedWithError(/Web tokenizer cache not yet implemented/);
    });

    it('should throw error for unimplemented fileSystem.fetchFromUrl', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      await expectAsync(
        platform.fileSystem.fetchFromUrl('https://example.com'),
      ).toBeRejectedWithError(/Web tokenizer file system not yet implemented/);
    });

    it('should throw error for unimplemented fileSystem.validateHash', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      await expectAsync(
        platform.fileSystem.validateHash(new Uint8Array(), 'hash'),
      ).toBeRejectedWithError(/Web tokenizer file system not yet implemented/);
    });

    it('should throw error for unimplemented fileSystem.computeSha1', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      await expectAsync(
        platform.fileSystem.computeSha1(new Uint8Array()),
      ).toBeRejectedWithError(/Web tokenizer file system not yet implemented/);
    });
  });

  describe('multiple instances', () => {
    it('should create independent tokenizer instances', () => {
      const tokenizer1 = new LocalTokenizer('gemini-2.0-flash-001');
      const tokenizer2 = new LocalTokenizer('gemini-2.5-pro');

      expect(tokenizer1).not.toBe(tokenizer2);
      expect(tokenizer1['baseTokenizer']).not.toBe(tokenizer2['baseTokenizer']);
    });
  });
});
