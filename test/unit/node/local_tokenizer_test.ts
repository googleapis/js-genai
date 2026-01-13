/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {LocalTokenizer as BaseLocalTokenizer} from '../../../src/cross/tokenizer/_local_tokenizer_impl.js';
import {NodeTokenizerPlatform} from '../../../src/node/_node_tokenizer_platform.js';
import {LocalTokenizer} from '../../../src/node/local_tokenizer.js';
import type {Content, CountTokensConfig} from '../../../src/types.js';

describe('LocalTokenizer (Node)', () => {
  describe('constructor', () => {
    it('should create a LocalTokenizer instance', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      expect(tokenizer).toBeDefined();
      expect(tokenizer).toBeInstanceOf(LocalTokenizer);
    });

    it('should initialize with NodeTokenizerPlatform', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      expect(tokenizer['baseTokenizer']).toBeDefined();
      expect(tokenizer['baseTokenizer']).toBeInstanceOf(BaseLocalTokenizer);

      const platform = tokenizer['baseTokenizer']['platform'];
      expect(platform).toBeInstanceOf(NodeTokenizerPlatform);
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

    it('should delegate to base tokenizer', async () => {
      const spy = spyOn(
        tokenizer['baseTokenizer'],
        'countTokens',
      ).and.returnValue(Promise.resolve({totalTokens: 5}));

      const result = await tokenizer.countTokens('What is your name?');

      expect(spy).toHaveBeenCalledWith('What is your name?', undefined);
      expect(result.totalTokens).toBe(5);
    });

    it('should pass config to base tokenizer', async () => {
      const config: CountTokensConfig = {
        systemInstruction: 'You are helpful',
      };

      const spy = spyOn(
        tokenizer['baseTokenizer'],
        'countTokens',
      ).and.returnValue(Promise.resolve({totalTokens: 10}));

      const result = await tokenizer.countTokens('Hello', config);

      expect(spy).toHaveBeenCalledWith('Hello', config);
      expect(result.totalTokens).toBe(10);
    });

    it('should handle string content', async () => {
      spyOn(tokenizer['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.resolve({totalTokens: 3}),
      );

      const result = await tokenizer.countTokens('Hello world');
      expect(result.totalTokens).toBe(3);
    });

    it('should handle Content object', async () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'Hello'}],
      };

      spyOn(tokenizer['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.resolve({totalTokens: 1}),
      );

      const result = await tokenizer.countTokens(content);
      expect(result.totalTokens).toBe(1);
    });

    it('should handle array of Content objects', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi there!'}]},
      ];

      spyOn(tokenizer['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.resolve({totalTokens: 5}),
      );

      const result = await tokenizer.countTokens(contents);
      expect(result.totalTokens).toBe(5);
    });

    it('should propagate errors from base tokenizer', async () => {
      const error = new Error('Model loading failed');
      spyOn(tokenizer['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.reject(error),
      );

      await expectAsync(
        tokenizer.countTokens('Test text'),
      ).toBeRejectedWithError('Model loading failed');
    });
  });

  describe('computeTokens', () => {
    let tokenizer: LocalTokenizer;

    beforeEach(() => {
      tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
    });

    it('should delegate to base tokenizer', async () => {
      const mockResult = {
        tokensInfo: [
          {
            tokenIds: ['1', '2', '3'],
            tokens: ['dGVz', 'dA==', 'IQ=='],
            role: 'user',
          },
        ],
      };

      const spy = spyOn(
        tokenizer['baseTokenizer'],
        'computeTokens',
      ).and.returnValue(Promise.resolve(mockResult));

      const result = await tokenizer.computeTokens('test!');

      expect(spy).toHaveBeenCalledWith('test!');
      expect(result).toEqual(mockResult);
    });

    it('should return base64 encoded tokens', async () => {
      const mockResult = {
        tokensInfo: [
          {
            tokenIds: ['100', '101'],
            tokens: ['SGVs', 'bG8='], // base64 encoded
            role: 'user',
          },
        ],
      };

      spyOn(tokenizer['baseTokenizer'], 'computeTokens').and.returnValue(
        Promise.resolve(mockResult),
      );

      const result = await tokenizer.computeTokens('Hello');
      expect(result.tokensInfo).toBeDefined();
      expect(result.tokensInfo!.length).toBe(1);
      expect(result.tokensInfo![0].tokens).toBeDefined();
      // Verify tokens are base64 encoded
      result.tokensInfo![0].tokens!.forEach((token) => {
        expect(token).toMatch(/^[A-Za-z0-9+/=]*$/);
      });
    });

    it('should handle Content object', async () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'What is AI?'}],
      };

      const mockResult = {
        tokensInfo: [
          {
            tokenIds: ['1', '2', '3'],
            tokens: ['V2hh', 'dCBp', 'cyBBST8='],
            role: 'user',
          },
        ],
      };

      spyOn(tokenizer['baseTokenizer'], 'computeTokens').and.returnValue(
        Promise.resolve(mockResult),
      );

      const result = await tokenizer.computeTokens(content);
      expect(result.tokensInfo![0].role).toBe('user');
      expect(result.tokensInfo![0].tokenIds!.length).toBe(3);
    });

    it('should handle multiple Content objects', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi'}]},
      ];

      const mockResult = {
        tokensInfo: [
          {
            tokenIds: ['1'],
            tokens: ['SGVsbG8='],
            role: 'user',
          },
          {
            tokenIds: ['2'],
            tokens: ['SGk='],
            role: 'model',
          },
        ],
      };

      spyOn(tokenizer['baseTokenizer'], 'computeTokens').and.returnValue(
        Promise.resolve(mockResult),
      );

      const result = await tokenizer.computeTokens(contents);
      expect(result.tokensInfo!.length).toBe(2);
      expect(result.tokensInfo![0].role).toBe('user');
      expect(result.tokensInfo![1].role).toBe('model');
    });

    it('should propagate errors from base tokenizer', async () => {
      const error = new Error('Tokenization failed');
      spyOn(tokenizer['baseTokenizer'], 'computeTokens').and.returnValue(
        Promise.reject(error),
      );

      await expectAsync(
        tokenizer.computeTokens('Test text'),
      ).toBeRejectedWithError('Tokenization failed');
    });
  });

  describe('platform integration', () => {
    it('should use NodeTokenizerPlatform cache', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      expect(platform.cache).toBeDefined();
      expect(typeof platform.cache.load).toBe('function');
      expect(typeof platform.cache.save).toBe('function');
    });

    it('should use NodeTokenizerPlatform fileSystem', () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');
      const platform = tokenizer['baseTokenizer']['platform'];

      expect(platform.fileSystem).toBeDefined();
      expect(typeof platform.fileSystem.fetchFromUrl).toBe('function');
      expect(typeof platform.fileSystem.validateHash).toBe('function');
      expect(typeof platform.fileSystem.computeSha1).toBe('function');
    });
  });

  describe('multiple instances', () => {
    it('should create independent tokenizer instances', () => {
      const tokenizer1 = new LocalTokenizer('gemini-2.0-flash-001');
      const tokenizer2 = new LocalTokenizer('gemini-2.5-pro');

      expect(tokenizer1).not.toBe(tokenizer2);
      expect(tokenizer1['baseTokenizer']).not.toBe(tokenizer2['baseTokenizer']);
    });

    it('should maintain independent state', async () => {
      const tokenizer1 = new LocalTokenizer('gemini-2.0-flash-001');
      const tokenizer2 = new LocalTokenizer('gemini-2.5-pro');

      spyOn(tokenizer1['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.resolve({totalTokens: 5}),
      );
      spyOn(tokenizer2['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.resolve({totalTokens: 10}),
      );

      const result1 = await tokenizer1.countTokens('test');
      const result2 = await tokenizer2.countTokens('test');

      expect(result1.totalTokens).toBe(5);
      expect(result2.totalTokens).toBe(10);
    });
  });

  describe('type compatibility', () => {
    it('should return CountTokensResult with totalTokens', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');

      spyOn(tokenizer['baseTokenizer'], 'countTokens').and.returnValue(
        Promise.resolve({totalTokens: 42}),
      );

      const result = await tokenizer.countTokens('test');

      // Type check - should have totalTokens property
      expect(result.totalTokens).toBeDefined();
      expect(typeof result.totalTokens).toBe('number');
    });

    it('should return ComputeTokensResult with tokensInfo', async () => {
      const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');

      const mockResult = {
        tokensInfo: [
          {
            tokenIds: ['1', '2'],
            tokens: ['dGVz', 'dA=='],
            role: 'user',
          },
        ],
      };

      spyOn(tokenizer['baseTokenizer'], 'computeTokens').and.returnValue(
        Promise.resolve(mockResult),
      );

      const result = await tokenizer.computeTokens('test');

      // Type check - should have tokensInfo array
      expect(result.tokensInfo).toBeDefined();
      expect(Array.isArray(result.tokensInfo)).toBe(true);
      if (result.tokensInfo && result.tokensInfo.length > 0) {
        expect(result.tokensInfo[0].tokenIds).toBeDefined();
        expect(result.tokensInfo[0].tokens).toBeDefined();
        expect(result.tokensInfo[0].role).toBeDefined();
      }
    });
  });
});
