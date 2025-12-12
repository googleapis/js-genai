/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {TextsAccumulator} from '../../../../src/cross/tokenizer/_texts_accumulator.js';
import {
  Content,
  FunctionCall,
  FunctionResponse,
  Schema,
  Tool,
  Type,
} from '../../../../src/types.js';

describe('TextsAccumulator', () => {
  let accumulator: TextsAccumulator;

  beforeEach(() => {
    accumulator = new TextsAccumulator();
  });

  describe('getTexts', () => {
    it('should return empty array when no texts added', () => {
      expect(accumulator.getTexts()).toEqual([]);
    });

    it('should return accumulated texts', () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'Hello world'}],
      };
      accumulator.addContent(content);
      expect(accumulator.getTexts()).toEqual(['Hello world']);
    });
  });

  describe('addContent', () => {
    it('should add text from simple content', () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'Hello'}],
      };
      accumulator.addContent(content);
      expect(accumulator.getTexts()).toEqual(['Hello']);
    });

    it('should add multiple texts from content with multiple parts', () => {
      const content: Content = {
        role: 'user',
        parts: [{text: 'Hello'}, {text: 'World'}],
      };
      accumulator.addContent(content);
      expect(accumulator.getTexts()).toEqual(['Hello', 'World']);
    });

    it('should throw error for fileData', () => {
      const content: Content = {
        role: 'user',
        parts: [{fileData: {mimeType: 'image/png', fileUri: 'gs://test'}}],
      };
      expect(() => accumulator.addContent(content)).toThrowError(
        'LocalTokenizers do not support non-text content types.',
      );
    });

    it('should throw error for inlineData', () => {
      const content: Content = {
        role: 'user',
        parts: [{inlineData: {mimeType: 'image/png', data: 'base64data'}}],
      };
      expect(() => accumulator.addContent(content)).toThrowError(
        'LocalTokenizers do not support non-text content types.',
      );
    });

    it('should handle videoMetadata without error', () => {
      const content: Content = {
        role: 'user',
        parts: [
          {
            text: 'Video content',
            videoMetadata: {startOffset: '0', endOffset: '1000'},
          },
        ],
      };
      accumulator.addContent(content);
      expect(accumulator.getTexts()).toEqual(['Video content']);
    });

    it('should add texts from functionCall', () => {
      const content: Content = {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'getWeather',
              args: {location: 'San Francisco', unit: 'celsius'},
            },
          },
        ],
      };
      accumulator.addContent(content);
      const texts = accumulator.getTexts();
      expect(texts).toContain('getWeather');
      expect(texts).toContain('location');
      expect(texts).toContain('San Francisco');
      expect(texts).toContain('unit');
      expect(texts).toContain('celsius');
    });

    it('should add texts from functionResponse', () => {
      const content: Content = {
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: 'getWeather',
              response: {temperature: '72', condition: 'sunny'},
            },
          },
        ],
      };
      accumulator.addContent(content);
      const texts = accumulator.getTexts();
      expect(texts).toContain('getWeather');
      expect(texts).toContain('temperature');
      expect(texts).toContain('72');
      expect(texts).toContain('condition');
      expect(texts).toContain('sunny');
    });

    it('should warn for unsupported content fields', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      const content = {
        role: 'user',
        parts: [{text: 'Hello'}],
        unsupportedField: 'value',
      } as unknown as Content;

      accumulator.addContent(content);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Content contains unsupported types'),
      );
    });
  });

  describe('addContents', () => {
    it('should add multiple contents', () => {
      const contents: Content[] = [
        {role: 'user', parts: [{text: 'Hello'}]},
        {role: 'model', parts: [{text: 'Hi there'}]},
        {role: 'user', parts: [{text: 'How are you?'}]},
      ];
      accumulator.addContents(contents);
      expect(accumulator.getTexts()).toEqual([
        'Hello',
        'Hi there',
        'How are you?',
      ]);
    });

    it('should handle empty array', () => {
      accumulator.addContents([]);
      expect(accumulator.getTexts()).toEqual([]);
    });
  });

  describe('addFunctionCall', () => {
    it('should add function name', () => {
      const functionCall: FunctionCall = {
        name: 'calculateSum',
        args: {},
      };
      accumulator.addFunctionCall(functionCall);
      expect(accumulator.getTexts()).toContain('calculateSum');
    });

    it('should add function args', () => {
      const functionCall: FunctionCall = {
        name: 'add',
        args: {a: 5, b: 10},
      };
      accumulator.addFunctionCall(functionCall);
      const texts = accumulator.getTexts();
      expect(texts).toContain('add');
      expect(texts).toContain('a');
      expect(texts).toContain('b');
    });

    it('should handle nested args', () => {
      const functionCall: FunctionCall = {
        name: 'complexFunction',
        args: {
          nested: {
            level1: {
              level2: 'deep value',
            },
          },
        },
      };
      accumulator.addFunctionCall(functionCall);
      const texts = accumulator.getTexts();
      expect(texts).toContain('complexFunction');
      expect(texts).toContain('nested');
      expect(texts).toContain('level1');
      expect(texts).toContain('level2');
      expect(texts).toContain('deep value');
    });

    it('should handle array args', () => {
      const functionCall: FunctionCall = {
        name: 'processItems',
        args: {items: ['apple', 'banana', 'cherry']},
      };
      accumulator.addFunctionCall(functionCall);
      const texts = accumulator.getTexts();
      expect(texts).toContain('processItems');
      expect(texts).toContain('items');
      expect(texts).toContain('apple');
      expect(texts).toContain('banana');
      expect(texts).toContain('cherry');
    });
  });

  describe('addFunctionResponse', () => {
    it('should add function response name', () => {
      const functionResponse: FunctionResponse = {
        name: 'getResult',
        response: {},
      };
      accumulator.addFunctionResponse(functionResponse);
      expect(accumulator.getTexts()).toContain('getResult');
    });

    it('should add response data', () => {
      const functionResponse: FunctionResponse = {
        name: 'getData',
        response: {status: 'success', message: 'Data retrieved'},
      };
      accumulator.addFunctionResponse(functionResponse);
      const texts = accumulator.getTexts();
      expect(texts).toContain('getData');
      expect(texts).toContain('status');
      expect(texts).toContain('success');
      expect(texts).toContain('message');
      expect(texts).toContain('Data retrieved');
    });
  });

  describe('addFunctionResponses', () => {
    it('should add multiple function responses', () => {
      const functionResponses: FunctionResponse[] = [
        {name: 'func1', response: {result: 'result1'}},
        {name: 'func2', response: {result: 'result2'}},
      ];
      accumulator.addFunctionResponses(functionResponses);
      const texts = accumulator.getTexts();
      expect(texts).toContain('func1');
      expect(texts).toContain('func2');
      expect(texts).toContain('result1');
      expect(texts).toContain('result2');
    });
  });

  describe('addTool', () => {
    it('should add tool with function declarations', () => {
      const tool: Tool = {
        functionDeclarations: [
          {
            name: 'getWeather',
            description: 'Get the current weather',
          },
        ],
      };
      accumulator.addTool(tool);
      const texts = accumulator.getTexts();
      expect(texts).toContain('getWeather');
      expect(texts).toContain('Get the current weather');
    });

    it('should handle tool without function declarations', () => {
      const tool: Tool = {};
      accumulator.addTool(tool);
      expect(accumulator.getTexts()).toEqual([]);
    });

    it('should add function declaration parameters', () => {
      const tool: Tool = {
        functionDeclarations: [
          {
            name: 'calculateArea',
            description: 'Calculate area of a rectangle',
            parameters: {
              type: Type.OBJECT,
              properties: {
                width: {
                  type: Type.NUMBER,
                  description: 'Width of the rectangle',
                },
                height: {
                  type: Type.NUMBER,
                  description: 'Height of the rectangle',
                },
              },
              required: ['width', 'height'],
            },
          },
        ],
      };
      accumulator.addTool(tool);
      const texts = accumulator.getTexts();
      expect(texts).toContain('calculateArea');
      expect(texts).toContain('Calculate area of a rectangle');
      expect(texts).toContain('width');
      expect(texts).toContain('Width of the rectangle');
      expect(texts).toContain('height');
      expect(texts).toContain('Height of the rectangle');
    });
  });

  describe('addTools', () => {
    it('should add multiple tools', () => {
      const tools: Tool[] = [
        {
          functionDeclarations: [
            {name: 'func1', description: 'First function'},
          ],
        },
        {
          functionDeclarations: [
            {name: 'func2', description: 'Second function'},
          ],
        },
      ];
      accumulator.addTools(tools);
      const texts = accumulator.getTexts();
      expect(texts).toContain('func1');
      expect(texts).toContain('First function');
      expect(texts).toContain('func2');
      expect(texts).toContain('Second function');
    });
  });

  describe('addSchema', () => {
    it('should add schema format', () => {
      const schema: Schema = {
        type: Type.STRING,
        format: 'email',
      };
      accumulator.addSchema(schema);
      expect(accumulator.getTexts()).toContain('email');
    });

    it('should add schema description', () => {
      const schema: Schema = {
        type: Type.STRING,
        description: 'User email address',
      };
      accumulator.addSchema(schema);
      expect(accumulator.getTexts()).toContain('User email address');
    });

    it('should add schema enum values', () => {
      const schema: Schema = {
        type: Type.STRING,
        enum: ['red', 'green', 'blue'],
      };
      accumulator.addSchema(schema);
      const texts = accumulator.getTexts();
      expect(texts).toContain('red');
      expect(texts).toContain('green');
      expect(texts).toContain('blue');
    });

    it('should add schema required fields', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        required: ['name', 'email'],
      };
      accumulator.addSchema(schema);
      const texts = accumulator.getTexts();
      expect(texts).toContain('name');
      expect(texts).toContain('email');
    });

    it('should add schema properties', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          username: {type: Type.STRING, description: 'User name'},
          age: {type: Type.NUMBER, description: 'User age'},
        },
      };
      accumulator.addSchema(schema);
      const texts = accumulator.getTexts();
      expect(texts).toContain('username');
      expect(texts).toContain('User name');
      expect(texts).toContain('age');
      expect(texts).toContain('User age');
    });

    it('should add schema items for arrays', () => {
      const schema: Schema = {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: 'Array item',
        },
      };
      accumulator.addSchema(schema);
      expect(accumulator.getTexts()).toContain('Array item');
    });

    it('should add schema example', () => {
      const schema: Schema = {
        type: Type.STRING,
        example: 'example value',
      };
      accumulator.addSchema(schema);
      expect(accumulator.getTexts()).toContain('example value');
    });

    it('should handle complex nested schema', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          address: {
            type: Type.OBJECT,
            properties: {
              street: {type: Type.STRING, description: 'Street name'},
              city: {type: Type.STRING, description: 'City name'},
            },
          },
        },
      };
      accumulator.addSchema(schema);
      const texts = accumulator.getTexts();
      expect(texts).toContain('address');
      expect(texts).toContain('street');
      expect(texts).toContain('Street name');
      expect(texts).toContain('city');
      expect(texts).toContain('City name');
    });

    it('should handle null example', () => {
      const schema: Schema = {
        type: Type.STRING,
        example: null,
      };
      accumulator.addSchema(schema);
      // Should not throw and should not add null to texts
      expect(accumulator.getTexts()).toEqual([]);
    });

    it('should handle object example', () => {
      const schema: Schema = {
        type: Type.OBJECT,
        example: {key: 'value', nested: {deep: 'data'}},
      };
      accumulator.addSchema(schema);
      const texts = accumulator.getTexts();
      expect(texts).toContain('key');
      expect(texts).toContain('value');
      expect(texts).toContain('nested');
      expect(texts).toContain('deep');
      expect(texts).toContain('data');
    });

    it('should handle array example', () => {
      const schema: Schema = {
        type: Type.ARRAY,
        example: ['item1', 'item2', 'item3'],
      };
      accumulator.addSchema(schema);
      const texts = accumulator.getTexts();
      expect(texts).toContain('item1');
      expect(texts).toContain('item2');
      expect(texts).toContain('item3');
    });
  });

  describe('complex scenarios', () => {
    it('should handle content with mixed parts', () => {
      const content: Content = {
        role: 'user',
        parts: [
          {text: 'First text'},
          {
            functionCall: {
              name: 'myFunction',
              args: {param: 'value'},
            },
          },
          {text: 'Second text'},
        ],
      };
      accumulator.addContent(content);
      const texts = accumulator.getTexts();
      expect(texts).toContain('First text');
      expect(texts).toContain('myFunction');
      expect(texts).toContain('param');
      expect(texts).toContain('value');
      expect(texts).toContain('Second text');
    });

    it('should handle function declaration with response schema', () => {
      const tool: Tool = {
        functionDeclarations: [
          {
            name: 'getUser',
            description: 'Get user information',
            parameters: {
              type: Type.OBJECT,
              properties: {
                userId: {type: Type.STRING, description: 'User ID'},
              },
            },
            response: {
              type: Type.OBJECT,
              properties: {
                name: {type: Type.STRING, description: 'User name'},
                email: {type: Type.STRING, description: 'User email'},
              },
            },
          },
        ],
      };
      accumulator.addTool(tool);
      const texts = accumulator.getTexts();
      expect(texts).toContain('getUser');
      expect(texts).toContain('Get user information');
      expect(texts).toContain('userId');
      expect(texts).toContain('User ID');
      expect(texts).toContain('name');
      expect(texts).toContain('User name');
      expect(texts).toContain('email');
      expect(texts).toContain('User email');
    });
  });
});
