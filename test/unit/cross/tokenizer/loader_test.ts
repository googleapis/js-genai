/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TokenizerCache,
  TokenizerFileSystem,
  TokenizerPlatform,
} from '../../../../src/cross/tokenizer/_interfaces.js';
import {
  getTokenizerConfig,
  getTokenizerName,
  loadModelProtoBytes,
} from '../../../../src/cross/tokenizer/_loader.js';

describe('Tokenizer Loader', () => {
  describe('getTokenizerName', () => {
    it('should return gemma3 for gemini-2.5-pro', () => {
      expect(getTokenizerName('gemini-2.5-pro')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-flash', () => {
      expect(getTokenizerName('gemini-2.5-flash')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-flash-lite', () => {
      expect(getTokenizerName('gemini-2.5-flash-lite')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.0-flash', () => {
      expect(getTokenizerName('gemini-2.0-flash')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.0-flash-lite', () => {
      expect(getTokenizerName('gemini-2.0-flash-lite')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-pro-preview-06-05', () => {
      expect(getTokenizerName('gemini-2.5-pro-preview-06-05')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-pro-preview-05-06', () => {
      expect(getTokenizerName('gemini-2.5-pro-preview-05-06')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-pro-exp-03-25', () => {
      expect(getTokenizerName('gemini-2.5-pro-exp-03-25')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-live-2.5-flash', () => {
      expect(getTokenizerName('gemini-live-2.5-flash')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-flash-preview-05-20', () => {
      expect(getTokenizerName('gemini-2.5-flash-preview-05-20')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-flash-preview-04-17', () => {
      expect(getTokenizerName('gemini-2.5-flash-preview-04-17')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.5-flash-lite-preview-06-17', () => {
      expect(getTokenizerName('gemini-2.5-flash-lite-preview-06-17')).toBe(
        'gemma3',
      );
    });

    it('should return gemma3 for gemini-2.0-flash-001', () => {
      expect(getTokenizerName('gemini-2.0-flash-001')).toBe('gemma3');
    });

    it('should return gemma3 for gemini-2.0-flash-lite-001', () => {
      expect(getTokenizerName('gemini-2.0-flash-lite-001')).toBe('gemma3');
    });

    it('should throw error for unsupported model', () => {
      expect(() => getTokenizerName('gemini-1.5-pro')).toThrowError(
        /is not supported for local tokenization\. Supported models:/,
      );
    });

    it('should throw error for unknown model', () => {
      expect(() => getTokenizerName('unknown-model')).toThrowError(
        /is not supported for local tokenization\. Supported models:/,
      );
    });

    it('should include supported models in error message', () => {
      try {
        getTokenizerName('unsupported-model');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('gemini-2.5-pro');
        expect((error as Error).message).toContain('gemini-2.0-flash');
      }
    });
  });

  describe('getTokenizerConfig', () => {
    it('should return config for gemma2 tokenizer', () => {
      const config = getTokenizerConfig('gemma2');
      expect(config).toBeDefined();
      expect(config.modelUrl).toContain('tokenizer.model');
      expect(config.modelHash).toBe(
        '61a7b147390c64585d6c3543dd6fc636906c9af3865a5548f27f31aee1d4c8e2',
      );
    });

    it('should return config for gemma3 tokenizer', () => {
      const config = getTokenizerConfig('gemma3');
      expect(config).toBeDefined();
      expect(config.modelUrl).toContain(
        'gemma3_cleaned_262144_v2.spiece.model',
      );
      expect(config.modelHash).toBe(
        '1299c11d7cf632ef3b4e11937501358ada021bbdf7c47638d13c0ee982f2e79c',
      );
    });

    it('should throw error for unsupported tokenizer', () => {
      expect(() => getTokenizerConfig('unknown-tokenizer')).toThrowError(
        /is not supported\. Supported tokenizers:/,
      );
    });

    it('should include supported tokenizers in error message', () => {
      try {
        getTokenizerConfig('unsupported-tokenizer');
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('gemma2');
        expect((error as Error).message).toContain('gemma3');
      }
    });
  });

  describe('loadModelProtoBytes', () => {
    let mockCache: jasmine.SpyObj<TokenizerCache>;
    let mockFileSystem: jasmine.SpyObj<TokenizerFileSystem>;
    let mockPlatform: TokenizerPlatform;
    let mockModelData: Uint8Array;

    beforeEach(() => {
      mockModelData = new Uint8Array([1, 2, 3, 4, 5]);

      mockCache = jasmine.createSpyObj<TokenizerCache>('TokenizerCache', [
        'load',
        'save',
      ]);

      mockFileSystem = jasmine.createSpyObj<TokenizerFileSystem>(
        'TokenizerFileSystem',
        ['fetchFromUrl', 'validateHash', 'computeSha1'],
      );

      mockPlatform = {
        cache: mockCache,
        fileSystem: mockFileSystem,
      };
    });

    it('should load model from cache if available and valid', async () => {
      mockCache.load.and.returnValue(Promise.resolve(mockModelData));
      mockFileSystem.computeSha1.and.returnValue(Promise.resolve('cache-key'));

      const result = await loadModelProtoBytes('gemma3', mockPlatform);

      expect(result).toBe(mockModelData);
      expect(mockCache.load).toHaveBeenCalledWith(
        'cache-key',
        '1299c11d7cf632ef3b4e11937501358ada021bbdf7c47638d13c0ee982f2e79c',
      );
      expect(mockFileSystem.fetchFromUrl).not.toHaveBeenCalled();
    });

    it('should download and cache model if not in cache', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.computeSha1.and.returnValue(Promise.resolve('cache-key'));
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(true));

      const result = await loadModelProtoBytes('gemma3', mockPlatform);

      expect(result).toBe(mockModelData);
      expect(mockFileSystem.fetchFromUrl).toHaveBeenCalledWith(
        jasmine.stringContaining('gemma3_cleaned_262144_v2.spiece.model'),
      );
      expect(mockFileSystem.validateHash).toHaveBeenCalledWith(
        mockModelData,
        '1299c11d7cf632ef3b4e11937501358ada021bbdf7c47638d13c0ee982f2e79c',
      );
      expect(mockCache.save).toHaveBeenCalledWith('cache-key', mockModelData);
    });

    it('should compute cache key from model URL', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.computeSha1.and.returnValue(
        Promise.resolve('computed-key'),
      );
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(true));

      await loadModelProtoBytes('gemma3', mockPlatform);

      expect(mockFileSystem.computeSha1).toHaveBeenCalled();
      const call = mockFileSystem.computeSha1.calls.first();
      const urlBytes = call.args[0] as Uint8Array;
      const decoder = new TextDecoder();
      const url = decoder.decode(urlBytes);
      expect(url).toContain('gemma3_cleaned_262144_v2.spiece.model');
    });

    it('should throw error if downloaded model hash is invalid', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.computeSha1.and.returnValue(Promise.resolve('cache-key'));
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(false));

      await expectAsync(
        loadModelProtoBytes('gemma3', mockPlatform),
      ).toBeRejectedWithError(/Downloaded model file is corrupted/);

      expect(mockCache.save).not.toHaveBeenCalled();
    });

    it('should include expected and actual hash in error message', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.computeSha1.and.returnValues(
        Promise.resolve('cache-key'),
        Promise.resolve('actual-hash-value'),
      );
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(false));

      try {
        await loadModelProtoBytes('gemma3', mockPlatform);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('Expected hash');
        expect((error as Error).message).toContain(
          '1299c11d7cf632ef3b4e11937501358ada021bbdf7c47638d13c0ee982f2e79c',
        );
        expect((error as Error).message).toContain('Got file hash');
        expect((error as Error).message).toContain('actual-hash-value');
      }
    });

    it('should work with gemma2 tokenizer', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.computeSha1.and.returnValue(Promise.resolve('cache-key'));
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(true));

      const result = await loadModelProtoBytes('gemma2', mockPlatform);

      expect(result).toBe(mockModelData);
      expect(mockFileSystem.fetchFromUrl).toHaveBeenCalledWith(
        jasmine.stringContaining('tokenizer.model'),
      );
      expect(mockFileSystem.validateHash).toHaveBeenCalledWith(
        mockModelData,
        '61a7b147390c64585d6c3543dd6fc636906c9af3865a5548f27f31aee1d4c8e2',
      );
    });

    it('should not save to cache if hash validation fails', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.computeSha1.and.returnValues(
        Promise.resolve('cache-key'),
        Promise.resolve('wrong-hash'),
      );
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(false));

      await expectAsync(
        loadModelProtoBytes('gemma3', mockPlatform),
      ).toBeRejected();

      expect(mockCache.save).not.toHaveBeenCalled();
    });

    it('should call cache load with correct cache key and hash', async () => {
      const expectedCacheKey = 'test-cache-key';
      const expectedHash =
        '1299c11d7cf632ef3b4e11937501358ada021bbdf7c47638d13c0ee982f2e79c';

      mockFileSystem.computeSha1.and.returnValue(
        Promise.resolve(expectedCacheKey),
      );
      mockCache.load.and.returnValue(Promise.resolve(mockModelData));

      await loadModelProtoBytes('gemma3', mockPlatform);

      expect(mockCache.load).toHaveBeenCalledWith(
        expectedCacheKey,
        expectedHash,
      );
    });
  });
});
