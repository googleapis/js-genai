import {z} from 'zod';

import {GoogleGenAI} from '../../src/client';
import {
  functionDeclarationFromZod,
  responseSchemaFromZod,
} from '../../src/schema_helper';
import * as types from '../../src/types';

const fetchOkOptions = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'some-url',
};

const mockGenerateContentResponse: types.GenerateContentResponse =
  Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'The',
              },
            ],
            role: 'model',
          },
          finishReason: types.FinishReason.STOP,
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 8,
        candidatesTokenCount: 1,
        totalTokenCount: 9,
      },
    },
    types.GenerateContentResponse.prototype,
  );

describe('generateContent', () => {
  describe('can use the results from responseSchemaFromZod in responseSchema field', () => {
    it('should not throw error when wrapping zod object with the helper function', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const zodSchema = z.object({
        foo: z.string(),
        bar: z.number(),
      });
      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      expect(async () => {
        await client.models.generateContent({
          model: 'gemini-1.5-flash-exp',
          contents: 'why is the sky blue?',
          config: {
            responseSchema: responseSchemaFromZod(client.vertexai, zodSchema),
          },
        });
      }).not.toThrow();
    });
    it('should process simple zod object', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const zodSchema = z.object({
        simpleString: z.string(),
        stringDateTime: z.string().datetime(),
        stringWithLength: z.string().min(1).max(10),
        simpleNumber: z.number(),
        simpleInteger: z.number().int(),
        integerInt64: z.bigint(),
        numberWithMinMax: z.number().min(1).max(10),
        simpleBoolean: z.boolean(),
      });
      const expected: types.Schema = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {type: types.Type.STRING},
          stringDateTime: {type: types.Type.STRING, format: 'date-time'},
          stringWithLength: {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '10',
          },
          simpleNumber: {type: types.Type.NUMBER},
          simpleInteger: {type: types.Type.INTEGER},
          integerInt64: {type: types.Type.INTEGER, format: 'int64'},
          numberWithMinMax: {type: types.Type.NUMBER, minimum: 1, maximum: 10},
          simpleBoolean: {type: types.Type.BOOLEAN},
        },
        required: [
          'simpleString',
          'stringDateTime',
          'stringWithLength',
          'simpleNumber',
          'simpleInteger',
          'integerInt64',
          'numberWithMinMax',
          'simpleBoolean',
        ],
      };

      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents: 'why is the sky blue?',
        config: {
          responseSchema: responseSchemaFromZod(client.vertexai, zodSchema),
        },
      });
      const parsedSchema = (
        JSON.parse(fetchSpy.calls.allArgs()[0][1]?.['body'] as string) as any
      ).generationConfig.responseSchema;
      expect(parsedSchema).toEqual(expected);
    });
    it('should process zod object with nested objects', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string(),
        stringDateTime: z.string().datetime(),
        stringWithLength: z.string().min(1).max(10),
        nestedObject: innerObject,
      });
      const expected: types.Schema = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {type: types.Type.STRING},
          stringDateTime: {type: types.Type.STRING, format: 'date-time'},
          stringWithLength: {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '10',
          },
          nestedObject: {
            type: types.Type.OBJECT,
            properties: {
              innerString: {type: types.Type.STRING},
              innerNumber: {type: types.Type.NUMBER},
            },
            required: ['innerString', 'innerNumber'],
          },
        },
        required: [
          'simpleString',
          'stringDateTime',
          'stringWithLength',
          'nestedObject',
        ],
      };
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents: 'why is the sky blue?',
        config: {
          responseSchema: responseSchemaFromZod(client.vertexai, nestedSchema),
        },
      });
      const parsedSchema = (
        JSON.parse(fetchSpy.calls.allArgs()[0][1]?.['body'] as string) as any
      ).generationConfig.responseSchema;
      expect(parsedSchema).toEqual(expected);
    });
  });
  describe('can use the results from functionDeclarationFromZod in functionDeclarations field', () => {
    it('should not throw error when wrapping zod function with the helper function', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const zodFunction = z
        .function()
        .args(z.object({numberField: z.number()}))
        .returns(z.void())
        .describe('this is a setParameter function');

      const expected: types.FunctionDeclaration = {
        description: 'this is a setParameter function',
        name: 'setParameterFunction',
        parameters: {
          type: types.Type.OBJECT,
          properties: {
            numberField: {
              type: types.Type.NUMBER,
            },
          },
          required: ['numberField'],
        },
      };

      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );

      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents: 'Dim the lights so the room feels cozy and warm.',
        config: {
          tools: [
            {
              functionDeclarations: [
                functionDeclarationFromZod(client.vertexai, {
                  name: 'setParameterFunction',
                  zodFunctionSchema: zodFunction,
                }),
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['setParameterFunction'],
            },
          },
        },
      });

      const parsedSchema = (
        JSON.parse(fetchSpy.calls.allArgs()[0][1]?.['body'] as string) as any
      ).tools[0].functionDeclarations[0];

      console.log('parsedSchema', parsedSchema);
      expect(parsedSchema).toEqual(expected);
    });
  });
});
