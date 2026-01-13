/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SentencePieceProcessor,
  Token,
} from '../../../../src/cross/sentencepiece/_processor.js';
import {
  TokenizerCache,
  TokenizerFileSystem,
  TokenizerPlatform,
} from '../../../../src/cross/tokenizer/_interfaces.js';
import {LocalTokenizer} from '../../../../src/cross/tokenizer/_local_tokenizer_impl.js';
import {Content, CountTokensConfig, Tool, Type} from '../../../../src/types.js';

describe('LocalTokenizer', () => {
  let mockCache: jasmine.SpyObj<TokenizerCache>;
  let mockFileSystem: jasmine.SpyObj<TokenizerFileSystem>;
  let mockPlatform: TokenizerPlatform;
  let mockModelData: Uint8Array;
  let tokenizer: LocalTokenizer;

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

    // Setup default mock behaviors
    mockCache.load.and.returnValue(Promise.resolve(mockModelData));
    mockFileSystem.computeSha1.and.returnValue(Promise.resolve('cache-key'));
  });

  describe('constructor', () => {
    it('should create tokenizer instance for gemini-2.0-flash-001', () => {
      tokenizer = new LocalTokenizer('gemini-2.0-flash-001', mockPlatform);
      expect(tokenizer).toBeDefined();
    });

    it('should create tokenizer instance for gemini-2.5-pro', () => {
      tokenizer = new LocalTokenizer('gemini-2.5-pro', mockPlatform);
      expect(tokenizer).toBeDefined();
    });

    it('should create tokenizer instance for gemini-2.5-flash', () => {
      tokenizer = new LocalTokenizer('gemini-2.5-flash', mockPlatform);
      expect(tokenizer).toBeDefined();
    });

    it('should throw error for unsupported model', () => {
      expect(
        () => new LocalTokenizer('unsupported-model', mockPlatform),
      ).toThrowError(/is not supported for local tokenization/);
    });
  });

  describe('countTokens', () => {
    let mockProcessor: jasmine.SpyObj<SentencePieceProcessor>;

    beforeEach(() => {
      // Create a spy for SentencePieceProcessor
      mockProcessor = jasmine.createSpyObj<SentencePieceProcessor>(
        'SentencePieceProcessor',
        ['encode', 'decode'],
      );

      // Mock the encode method to return tokens
      mockProcessor.encode.and.callFake((text: string): Token[] => {
        // Simple mock: return one token per word
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        return words.map((word, idx) => ({id: idx, text: word}));
      });

      // Spy on SentencePieceProcessor constructor
      type ProcessorConstructor = new (
        modelBytes: Uint8Array,
      ) => SentencePieceProcessor;
      const MockProcessorConstructor = jasmine
        .createSpy('ProcessorConstructor')
        .and.returnValue(mockProcessor) as unknown as ProcessorConstructor;

      tokenizer = new LocalTokenizer(
        'gemini-2.0-flash-001',
        mockPlatform,
        MockProcessorConstructor,
      );
    });

    it('should count tokens for simple string content', async () => {
      const result = await tokenizer.countTokens('Hello world');
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(mockCache.load).toHaveBeenCalled();
    });

    it('should count tokens for Content object', async () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'What is your name?'}],
      };
      const result = await tokenizer.countTokens(content);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should count tokens for array of Content objects', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi there'}]},
      ];
      const result = await tokenizer.countTokens(contents);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should include system instruction in token count', async () => {
      const config: CountTokensConfig = {
        systemInstruction: 'You are a helpful assistant',
      };
      const result = await tokenizer.countTokens('Hello', config);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should include tools in token count', async () => {
      const tools: Tool[] = [
        {
          functionDeclarations: [
            {
              name: 'getWeather',
              description: 'Get the current weather',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  location: {type: Type.STRING, description: 'City name'},
                },
              },
            },
          ],
        },
      ];
      const config: CountTokensConfig = {tools};
      const result = await tokenizer.countTokens(
        'What is the weather?',
        config,
      );
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should include response schema in token count', async () => {
      const config: CountTokensConfig = {
        generationConfig: {
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {type: Type.STRING, description: 'The answer'},
            },
          },
        },
      };
      const result = await tokenizer.countTokens('Question?', config);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const result = await tokenizer.countTokens('');
      expect(result.totalTokens).toBe(0);
    });

    it('should count tokens for content with function calls', async () => {
      const content: Content = {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'getWeather',
              args: {location: 'San Francisco'},
            },
          },
        ],
      };
      const result = await tokenizer.countTokens(content);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should count tokens for content with function responses', async () => {
      const content: Content = {
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: 'getWeather',
              response: {temperature: '72F', condition: 'sunny'},
            },
          },
        ],
      };
      const result = await tokenizer.countTokens(content);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should load model only once for multiple calls', async () => {
      await tokenizer.countTokens('First call');
      await tokenizer.countTokens('Second call');
      await tokenizer.countTokens('Third call');

      // Cache load should be called only once (during first countTokens call)
      expect(mockCache.load).toHaveBeenCalledTimes(1);
    });

    it('should handle complex config with all options', async () => {
      const config: CountTokensConfig = {
        systemInstruction: {
          role: 'system',
          parts: [{text: 'You are helpful'}],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'search',
                description: 'Search the web',
              },
            ],
          },
        ],
        generationConfig: {
          responseSchema: {
            type: Type.OBJECT,
            properties: {result: {type: Type.STRING}},
          },
        },
      };
      const result = await tokenizer.countTokens('Hello', config);
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('computeTokens', () => {
    let mockProcessor: jasmine.SpyObj<SentencePieceProcessor>;

    beforeEach(() => {
      mockProcessor = jasmine.createSpyObj<SentencePieceProcessor>(
        'SentencePieceProcessor',
        ['encode', 'decode'],
      );

      mockProcessor.encode.and.callFake((text: string): Token[] => {
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        return words.map((word, idx) => ({id: idx + 100, text: word}));
      });

      type ProcessorConstructor = new (
        modelBytes: Uint8Array,
      ) => SentencePieceProcessor;
      const MockProcessorConstructor = jasmine
        .createSpy('ProcessorConstructor')
        .and.returnValue(mockProcessor) as unknown as ProcessorConstructor;

      tokenizer = new LocalTokenizer(
        'gemini-2.0-flash-001',
        mockPlatform,
        MockProcessorConstructor,
      );
    });

    it('should compute tokens for simple string', async () => {
      const result = await tokenizer.computeTokens('Hello world');
      expect(result.tokensInfo).toBeDefined();
      expect(result.tokensInfo!.length).toBeGreaterThan(0);
    });

    it('should compute tokens for Content object', async () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'What is AI?'}],
      };
      const result = await tokenizer.computeTokens(content);
      expect(result.tokensInfo).toBeDefined();
      expect(result.tokensInfo!.length).toBe(1);
      expect(result.tokensInfo![0].role).toBe('user');
    });

    it('should compute tokens for multiple Content objects', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi'}]},
      ];
      const result = await tokenizer.computeTokens(contents);
      expect(result.tokensInfo!.length).toBe(2);
      expect(result.tokensInfo![0].role).toBe('user');
      expect(result.tokensInfo![1].role).toBe('model');
    });

    it('should return token IDs as strings', async () => {
      const result = await tokenizer.computeTokens('Test');
      expect(result.tokensInfo!.length).toBeGreaterThan(0);
      const tokenIds = result.tokensInfo![0].tokenIds;
      expect(tokenIds).toBeDefined();
      expect(tokenIds!.length).toBeGreaterThan(0);
      expect(typeof tokenIds![0]).toBe('string');
    });

    it('should return base64 encoded tokens', async () => {
      const result = await tokenizer.computeTokens('Test');
      expect(result.tokensInfo!.length).toBeGreaterThan(0);
      const tokens = result.tokensInfo![0].tokens;
      expect(tokens).toBeDefined();
      expect(tokens!.length).toBeGreaterThan(0);
      // Base64 encoded strings should only contain valid base64 characters
      tokens!.forEach((token) => {
        expect(token).toMatch(/^[A-Za-z0-9+/=]*$/);
      });
    });

    it('should handle content with function calls', async () => {
      const content: Content = {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'calculate',
              args: {operation: 'add', x: 5, y: 3},
            },
          },
        ],
      };
      const result = await tokenizer.computeTokens(content);
      expect(result.tokensInfo!.length).toBe(1);
      expect(result.tokensInfo![0].tokenIds!.length).toBeGreaterThan(0);
    });

    it('should skip content with no text', async () => {
      const content: Content = {
        role: 'user',
        parts: [{videoMetadata: {startOffset: '0', endOffset: '1000'}}],
      };
      const result = await tokenizer.computeTokens(content);
      // Should not include tokensInfo for content with no extractable text
      expect(result.tokensInfo!.length).toBe(0);
    });

    it('should handle mixed content with text and function calls', async () => {
      const content: Content = {
        role: 'model',
        parts: [
          {text: 'Let me check that'},
          {
            functionCall: {
              name: 'search',
              args: {query: 'weather'},
            },
          },
        ],
      };
      const result = await tokenizer.computeTokens(content);
      expect(result.tokensInfo!.length).toBe(1);
      expect(result.tokensInfo![0].tokenIds!.length).toBeGreaterThan(0);
    });

    it('should preserve role information', async () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Question'}]},
        {role: 'model', parts: [{text: 'Answer'}]},
        {
          role: 'function',
          parts: [{functionResponse: {name: 'fn', response: {}}}],
        },
      ];
      const result = await tokenizer.computeTokens(contents);
      expect(result.tokensInfo![0].role).toBe('user');
      expect(result.tokensInfo![1].role).toBe('model');
      expect(result.tokensInfo![2].role).toBe('function');
    });

    it('should handle empty content', async () => {
      const result = await tokenizer.computeTokens('');
      expect(result.tokensInfo!.length).toBe(0);
    });

    it('should load model only once for multiple calls', async () => {
      await tokenizer.computeTokens('First');
      await tokenizer.computeTokens('Second');
      await tokenizer.computeTokens('Third');

      expect(mockCache.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('model loading', () => {
    let mockProcessor: jasmine.SpyObj<SentencePieceProcessor>;

    beforeEach(() => {
      mockProcessor = jasmine.createSpyObj<SentencePieceProcessor>(
        'SentencePieceProcessor',
        ['encode', 'decode'],
      );

      mockProcessor.encode.and.callFake((text: string): Token[] => {
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        return words.map((word, idx) => ({id: idx + 100, text: word}));
      });

      type ProcessorConstructor = new (
        modelBytes: Uint8Array,
      ) => SentencePieceProcessor;
      const MockProcessorConstructor = jasmine
        .createSpy('ProcessorConstructor')
        .and.returnValue(mockProcessor) as unknown as ProcessorConstructor;

      tokenizer = new LocalTokenizer(
        'gemini-2.0-flash-001',
        mockPlatform,
        MockProcessorConstructor,
      );
    });

    it('should load model from cache', async () => {
      mockCache.load.and.returnValue(Promise.resolve(mockModelData));

      await tokenizer.countTokens('Test');

      expect(mockCache.load).toHaveBeenCalled();
    });

    it('should download model if not in cache', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(true));

      await tokenizer.countTokens('Test');

      expect(mockFileSystem.fetchFromUrl).toHaveBeenCalled();
      expect(mockCache.save).toHaveBeenCalledWith('cache-key', mockModelData);
    });

    it('should throw error if model download fails validation', async () => {
      mockCache.load.and.returnValue(Promise.resolve(null));
      mockFileSystem.fetchFromUrl.and.returnValue(
        Promise.resolve(mockModelData),
      );
      mockFileSystem.validateHash.and.returnValue(Promise.resolve(false));
      mockFileSystem.computeSha1.and.returnValues(
        Promise.resolve('cache-key'),
        Promise.resolve('wrong-hash'),
      );

      await expectAsync(tokenizer.countTokens('Test')).toBeRejectedWithError(
        /Downloaded model file is corrupted/,
      );
    });
  });

  describe('error handling', () => {
    let mockProcessor: jasmine.SpyObj<SentencePieceProcessor>;

    beforeEach(() => {
      mockProcessor = jasmine.createSpyObj<SentencePieceProcessor>(
        'SentencePieceProcessor',
        ['encode', 'decode'],
      );

      mockProcessor.encode.and.callFake((text: string): Token[] => {
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        return words.map((word, idx) => ({id: idx + 100, text: word}));
      });

      type ProcessorConstructor = new (
        modelBytes: Uint8Array,
      ) => SentencePieceProcessor;
      const MockProcessorConstructor = jasmine
        .createSpy('ProcessorConstructor')
        .and.returnValue(mockProcessor) as unknown as ProcessorConstructor;

      tokenizer = new LocalTokenizer(
        'gemini-2.0-flash-001',
        mockPlatform,
        MockProcessorConstructor,
      );
    });

    it('should throw error for non-text content in countTokens', async () => {
      const content: Content = {
        role: 'user',
        parts: [{fileData: {mimeType: 'image/png', fileUri: 'gs://test'}}],
      };

      await expectAsync(tokenizer.countTokens(content)).toBeRejectedWithError(
        /LocalTokenizers do not support non-text content types/,
      );
    });

    it('should throw error for non-text content in computeTokens', async () => {
      const content: Content = {
        role: 'user',
        parts: [{inlineData: {mimeType: 'audio/mp3', data: 'base64'}}],
      };

      await expectAsync(tokenizer.computeTokens(content)).toBeRejectedWithError(
        /LocalTokenizers do not support non-text content types/,
      );
    });
  });

  describe('integration scenarios', () => {
    let mockProcessor: jasmine.SpyObj<SentencePieceProcessor>;

    beforeEach(() => {
      mockProcessor = jasmine.createSpyObj<SentencePieceProcessor>(
        'SentencePieceProcessor',
        ['encode', 'decode'],
      );

      mockProcessor.encode.and.callFake((text: string): Token[] => {
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        return words.map((word, idx) => ({id: idx + 100, text: word}));
      });

      type ProcessorConstructor = new (
        modelBytes: Uint8Array,
      ) => SentencePieceProcessor;
      const MockProcessorConstructor = jasmine
        .createSpy('ProcessorConstructor')
        .and.returnValue(mockProcessor) as unknown as ProcessorConstructor;

      tokenizer = new LocalTokenizer(
        'gemini-2.0-flash-001',
        mockPlatform,
        MockProcessorConstructor,
      );
    });

    it('should handle chat-like conversation', async () => {
      const conversation: Content[] = [
        {role: 'user', parts: [{text: 'What is the weather today?'}]},
        {
          role: 'model',
          parts: [
            {
              functionCall: {
                name: 'getWeather',
                args: {location: 'current'},
              },
            },
          ],
        },
        {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: 'getWeather',
                response: {temp: '75F', condition: 'sunny'},
              },
            },
          ],
        },
        {role: 'model', parts: [{text: 'It is sunny and 75 degrees.'}]},
      ];

      const countResult = await tokenizer.countTokens(conversation);
      expect(countResult.totalTokens).toBeGreaterThan(0);

      const computeResult = await tokenizer.computeTokens(conversation);
      expect(computeResult.tokensInfo!.length).toBe(4);
    });

    it('should handle content with tools and system instruction', async () => {
      const config: CountTokensConfig = {
        systemInstruction: 'You are a weather assistant',
        tools: [
          {
            functionDeclarations: [
              {
                name: 'getWeather',
                description: 'Get current weather',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    location: {type: Type.STRING},
                  },
                  required: ['location'],
                },
              },
            ],
          },
        ],
      };

      const result = await tokenizer.countTokens(
        'What is the weather in Paris?',
        config,
      );
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });
});
