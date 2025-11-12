/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {GoogleGenAI} from '../../src/client.js';
import {mcpToTool} from '../../src/mcp/_mcp.js';
import * as types from '../../src/types.js';

import {
  spinUpBeepingServer,
  spinUpPrintingServer,
  spinUpThrowingServer,
} from './test_mcp_server.js';

const fetchOkOptions = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {
    'content-type': 'application/json; charset=UTF-8',
    'vary': 'Origin, X-Origin, Referer',
    'content-encoding': 'gzip',
    'date': 'Tue, 24 Jun 2025 18:56:29 GMT',
    'server': 'scaffolding on HTTPServer2',
    'x-xss-protection': '0',
    'x-frame-options': 'SAMEORIGIN',
    'x-content-type-options': 'nosniff',
    'transfer-encoding': 'chunked',
  },
  url: 'some-url',
};

const fetch500Options = {
  status: 500,
  statusText: 'Internal Server Error',
  ok: false,
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

const mockGenerateContentResponseWithFunctionCall: types.GenerateContentResponse =
  Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'print',
                  args: {
                    text: 'Hello World',
                    color: 'red',
                  },
                },
              },
              {
                functionCall: {
                  name: 'beep',
                },
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
const mockGenerateContentResponseWithSingleFunctionCall: types.GenerateContentResponse =
  Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'beep',
                },
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

const mockGenerateContentResponseWithAnotherFunctionCall: types.GenerateContentResponse =
  Object.setPrototypeOf(
    {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'print',
                  args: {
                    text: 'Hello World again',
                    color: 'blue',
                  },
                },
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

function createMockReadableStream(chunk: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      function pushChunk() {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.close();
      }
      pushChunk();
    },
  });
}

describe('generateContent', () => {
  describe('separate the responseSchema and responseJsonSchema fields', () => {
    it('should let the object not contain $schema field stays in responseSchema field', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const shouldBeGivenToResponseSchema: types.Schema = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {type: types.Type.STRING},
          stringEmailTime: {type: types.Type.STRING, pattern: 'email'},
          stringWithLength: {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '10',
          },
          simpleNumber: {type: types.Type.NUMBER, minimum: 1, maximum: 10},
        },
        required: [
          'simpleString',
          'stringEmailTime',
          'stringWithLength',
          'simpleNumber',
        ],
        propertyOrdering: [
          'simpleString',
          'stringEmailTime',
          'stringWithLength',
          'simpleNumber',
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
          responseSchema: shouldBeGivenToResponseSchema,
        },
      });
      const parsedSchema = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['generationConfig']! as Record<string, unknown>;
      expect(parsedSchema['responseSchema']).toEqual(
        shouldBeGivenToResponseSchema,
      );
      expect(parsedSchema['responseJsonSchema']).toBeUndefined();
    });
    it('should give the schema that contains $schema field to responseJsonSchema field', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const shouldBeGivenToResponseJsonSchema: unknown = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {type: types.Type.STRING},
          stringEmailTime: {type: types.Type.STRING, pattern: 'email'},
          stringWithLength: {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '10',
          },
          unionInType: {
            type: ['string', 'number'],
          },
          simpleNumber: {type: types.Type.NUMBER, minimum: 1, maximum: 10},
        },
        required: [
          'simpleString',
          'stringEmailTime',
          'stringWithLength',
          'simpleNumber',
          'unionInType',
        ],
        propertyOrdering: [
          'simpleString',
          'stringEmailTime',
          'stringWithLength',
          'simpleNumber',
          'unionInType',
        ],
        $schema: 'https://json-schema.org/draft/2020-12/schema',
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
          responseSchema: shouldBeGivenToResponseJsonSchema,
        },
      });
      const parsedSchema = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['generationConfig']! as Record<string, unknown>;
      expect(parsedSchema['responseJsonSchema']).toEqual(
        shouldBeGivenToResponseJsonSchema,
      );
      expect(parsedSchema['responseSchema']).toBeUndefined();
    });
    it('should be no-op when provided the responseJSONSchema field', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const shouldBeGivenToResponseJsonSchema: unknown = {
        type: types.Type.OBJECT,
        properties: {
          simpleString: {type: types.Type.STRING},
          stringEmailTime: {type: types.Type.STRING, pattern: 'email'},
          stringWithLength: {
            type: types.Type.STRING,
            minLength: '1',
            maxLength: '10',
          },
          unionInType: {
            type: ['string', 'number'],
          },
          simpleNumber: {type: types.Type.NUMBER, minimum: 1, maximum: 10},
        },
        required: [
          'simpleString',
          'stringEmailTime',
          'stringWithLength',
          'simpleNumber',
          'unionInType',
        ],
        propertyOrdering: [
          'simpleString',
          'stringEmailTime',
          'stringWithLength',
          'simpleNumber',
          'unionInType',
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
          responseJsonSchema: shouldBeGivenToResponseJsonSchema,
        },
      });
      const parsedSchema = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['generationConfig']! as Record<string, unknown>;
      expect(parsedSchema['responseJsonSchema']).toEqual(
        shouldBeGivenToResponseJsonSchema,
      );
      expect(parsedSchema['responseSchema']).toBeUndefined();
    });
    it('will send both responseSchema and responseJsonSchema fields to the API if both exist', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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
          responseSchema: {type: types.Type.OBJECT},
          responseJsonSchema: {type: 'string'},
        },
      });

      const parsedSchema = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['generationConfig']! as Record<string, unknown>;
      expect(parsedSchema['responseSchema']).toEqual({
        type: types.Type.OBJECT,
      });
      expect(parsedSchema['responseJsonSchema']).toEqual({
        type: 'string',
      });
    });
    describe('functionDeclaration *JsonSchema fields', () => {
      it('should keep types.Schema in parameters and response field', async () => {
        const client = new GoogleGenAI({
          vertexai: false,
          apiKey: 'fake-api-key',
        });
        const shouldStayInParameters: types.Schema = {
          type: types.Type.OBJECT,
          properties: {
            firstString: {type: types.Type.STRING},
            secondString: {type: types.Type.STRING},
          },
          required: ['firstString', 'secondString'],
          propertyOrdering: ['firstString', 'secondString'],
        };
        const shouldStayInResponse: types.Schema = {
          type: types.Type.OBJECT,
          properties: {
            firstString: {type: types.Type.STRING},
            secondString: {type: types.Type.STRING},
          },
          required: ['firstString', 'secondString'],
          propertyOrdering: ['firstString', 'secondString'],
        };
        const fd: types.FunctionDeclaration = {
          name: 'concatStringFunction',
          description: 'this is a concat string function',
          parameters: shouldStayInParameters,
          response: shouldStayInResponse,
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
            tools: [
              {
                functionDeclarations: [fd],
              },
            ],
          },
        });
        const parsedTool = getFunctionDeclarationFromArgs(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        );
        expect(parsedTool['parameters']).toEqual(shouldStayInParameters);
        expect(parsedTool['parametersJsonSchema']).toBeUndefined();
        expect(parsedTool['response']).toEqual(shouldStayInResponse);
        expect(parsedTool['responseJsonSchema']).toBeUndefined();
      });
      it('should give the data that contains $schema field to *JsonSchema field', async () => {
        const client = new GoogleGenAI({
          vertexai: false,
          apiKey: 'fake-api-key',
        });
        const shouldBeGivenToParametersJsonSchema: unknown = {
          type: types.Type.OBJECT,
          properties: {
            firstString: {type: 'string'},
            secondString: {type: 'string'},
          },
          required: ['firstString', 'secondString'],
          propertyOrdering: ['firstString', 'secondString'],
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        };
        const shouldBeGivenToResponseJsonSchema: unknown = {
          type: types.Type.OBJECT,
          properties: {
            firstString: {type: 'string'},
            secondString: {type: 'string'},
          },
          required: ['firstString', 'secondString'],
          propertyOrdering: ['firstString', 'secondString'],
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        };
        const fd: types.FunctionDeclaration = {
          name: 'concatStringFunction',
          description: 'this is a concat string function',
          parameters: shouldBeGivenToParametersJsonSchema as Record<
            string,
            unknown
          >,
          response: shouldBeGivenToResponseJsonSchema as Record<
            string,
            unknown
          >,
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
            tools: [
              {
                functionDeclarations: [fd],
              },
            ],
          },
        });
        const parsedTool = getFunctionDeclarationFromArgs(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        );
        expect(parsedTool['parameters']).toBeUndefined();
        expect(parsedTool['parametersJsonSchema']).toEqual(
          shouldBeGivenToParametersJsonSchema,
        );
        expect(parsedTool['response']).toBeUndefined();
        expect(parsedTool['responseJsonSchema']).toEqual(
          shouldBeGivenToResponseJsonSchema,
        );
      });
      it('should be no-op when provided the *JsonSchema field', async () => {
        const client = new GoogleGenAI({
          vertexai: false,
          apiKey: 'fake-api-key',
        });
        const noOpInParametersJsonSchema: unknown = {
          type: types.Type.OBJECT,
          properties: {
            firstString: {type: 'string'},
            secondString: {type: types.Type.STRING},
          },
          required: ['firstString', 'secondString'],
          propertyOrdering: ['firstString', 'secondString'],
        };
        const noOpInResponseJsonSchema: unknown = {
          type: types.Type.OBJECT,
          properties: {
            firstString: {type: 'string'},
            secondString: {type: types.Type.STRING},
          },
          required: ['firstString', 'secondString'],
          propertyOrdering: ['firstString', 'secondString'],
        };
        const fd: types.FunctionDeclaration = {
          name: 'concatStringFunction',
          description: 'this is a concat string function',
          parametersJsonSchema: noOpInParametersJsonSchema,
          responseJsonSchema: noOpInResponseJsonSchema,
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
            tools: [
              {
                functionDeclarations: [fd],
              },
            ],
          },
        });
        const parsedTool = getFunctionDeclarationFromArgs(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        );
        expect(parsedTool['parameters']).toBeUndefined();
        expect(parsedTool['parametersJsonSchema']).toEqual(
          noOpInParametersJsonSchema,
        );
        expect(parsedTool['response']).toBeUndefined();
        expect(parsedTool['responseJsonSchema']).toEqual(
          noOpInResponseJsonSchema,
        );
      });
      it('will send both parameters and parametersJsonSchema fields to API if both fields are set', async () => {
        const client = new GoogleGenAI({
          vertexai: false,
          apiKey: 'fake-api-key',
        });
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
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'concatStringFunction',
                    description: 'this is a concat string function',
                    parameters: {type: types.Type.OBJECT},
                    parametersJsonSchema: {type: 'string'},
                  },
                ],
              },
            ],
          },
        });

        const parsedTool = getFunctionDeclarationFromArgs(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        );
        expect(parsedTool['parameters']).toEqual({
          type: types.Type.OBJECT,
        });
        expect(parsedTool['parametersJsonSchema']).toEqual({
          type: 'string',
        });
      });
    });
    it('will send both response and responseJsonSchema fields to API if both fields are set', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
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
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'concatStringFunction',
                  description: 'this is a concat string function',
                  response: {type: types.Type.OBJECT},
                  responseJsonSchema: {type: 'string'},
                },
              ],
            },
          ],
        },
      });

      const parsedTool = getFunctionDeclarationFromArgs(
        fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
      );
      expect(parsedTool['response']).toEqual({
        type: types.Type.OBJECT,
      });
      expect(parsedTool['responseJsonSchema']).toEqual({
        type: 'string',
      });
    });
  });
  describe('can use the results from zodToJsonSchema in responseSchema field', () => {
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
          responseSchema: zodToJsonSchema(zodSchema),
        },
      });
      const parsedSchema = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['generationConfig']! as Record<string, unknown>;
      expect(parsedSchema['responseJsonSchema']).toEqual(
        zodToJsonSchema(zodSchema),
      );
      expect(parsedSchema['responseSchema']).toBeUndefined();
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
          responseSchema: zodToJsonSchema(nestedSchema),
        },
      });
      const parsedSchema = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['generationConfig']! as Record<string, unknown>;
      expect(parsedSchema['responseJsonSchema']).toEqual(
        zodToJsonSchema(nestedSchema),
      );
      expect(parsedSchema['responseSchema']).toBeUndefined();
    });
  });
  describe('can use the mcp client', () => {
    it('should append MCP usage header', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const callableTool = mcpToTool(
        await spinUpPrintingServer(),
        await spinUpBeepingServer(),
      );
      const mockResponses = [
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithFunctionCall),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithAnotherFunctionCall),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      ];
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );
      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents:
          'Use the printer to print a simple math question in red and the answer in blue',
        config: {
          tools: [callableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['print', 'beep'],
            },
          },
        },
      });
      const allArgs = fetchSpy.calls.allArgs();
      const headers = allArgs[0][1]?.['headers'] as Headers;
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('mcp_used/');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('fake-api-key');
      const tools = JSON.parse(allArgs[0][1]?.['body'] as string)[
        'tools'
      ] as types.Tool[];
      expect(
        tools.includes({
          functionDeclarations: [
            {
              name: 'print',
              description: 'Print text to the console',
              parametersJsonSchema: {
                type: types.Type.OBJECT,
                properties: {
                  text: {
                    type: types.Type.STRING,
                  },
                  color: {
                    type: types.Type.STRING,
                  },
                },
                required: ['text', 'color'],
              },
            },
          ],
        }),
      );
    });
    it('should take multiple mcp clients and conduct AFC', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const callableTool = mcpToTool(
        await spinUpPrintingServer(),
        await spinUpBeepingServer(),
      );

      const mockResponses = [
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithFunctionCall),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithAnotherFunctionCall),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      ];
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );
      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents:
          'Use the printer to print a simple math question in red and the answer in blue, and beep with the beeper',
        config: {
          tools: [callableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['print', 'beep'],
            },
          },
        },
      });
      const allArgs = fetchSpy.calls.allArgs();
      const tools = JSON.parse(allArgs[0][1]?.['body'] as string)[
        'tools'
      ] as types.Tool[];
      expect(
        tools.includes({
          functionDeclarations: [
            {
              name: 'print',
              description: 'Print text to the console',
              parametersJsonSchema: {
                type: types.Type.OBJECT,
                properties: {
                  text: {
                    type: types.Type.STRING,
                  },
                  color: {
                    type: types.Type.STRING,
                  },
                },
                required: ['text', 'color'],
              },
            },
          ],
        }),
      );
      expect(
        tools.includes({
          functionDeclarations: [
            {
              name: 'beep',
              description: 'Beep with the beeper',
              parametersJsonSchema: {
                type: types.Type.OBJECT,
                properties: {},
                required: [],
              },
            },
          ],
        }),
      );
    });
    it('should throw error when there are CallableTools and Tools when AFC is enabled', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const mixedToolsList: types.ToolListUnion = [
        await mcpToTool(await spinUpPrintingServer()),
        {
          functionDeclarations: [
            {
              name: 'controlLight',
              description:
                'Set the brightness and color temperature of a room light.',
              parametersJsonSchema: zodToJsonSchema(
                z.object({
                  brightness: z.number(),
                  colorTemperature: z.string(),
                }),
              ),
            },
          ],
        },
      ];
      try {
        await client.models.generateContent({
          model: 'gemini-1.5-flash-exp',
          contents:
            'Use the printer to print a simple math question in red and the answer in blue, and beep with the beeper',
          config: {
            tools: mixedToolsList,
            toolConfig: {
              functionCallingConfig: {
                mode: types.FunctionCallingConfigMode.ANY,
                allowedFunctionNames: ['print'],
              },
            },
          },
        });
      } catch (e) {
        expect((e as Error).message).toContain('Incompatible tools found');
      }
    });
    it('should handle the error thrown by the underlying tool and wrap it in the response', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const callableTool = mcpToTool(await spinUpThrowingServer());

      const mockResponseWithThrowingFunctionCall: types.GenerateContentResponse =
        Object.setPrototypeOf(
          {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      functionCall: {
                        name: 'throwError',
                        args: {},
                      },
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
      const mockResponses = [
        Promise.resolve(
          new Response(
            JSON.stringify(mockResponseWithThrowingFunctionCall),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      ];
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );

      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents: 'Call the throwing tool.',
        config: {
          tools: [callableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['throwError'],
            },
          },
        },
      });

      const allArgs = fetchSpy.calls.allArgs();
      // The significant of the 2nd call is, this call's content contains
      // the tool error result and send it back to the model.
      const actual2ndCall = JSON.parse(allArgs[1][1]?.['body'] as string);
      const jsonString = `{
                            "contents": [
                              {
                                "parts": [
                                  {
                                    "text": "Call the throwing tool."
                                  }
                                ],
                                "role": "user"
                              },
                              {
                                "parts": [
                                  {
                                    "functionCall": {
                                      "name": "throwError",
                                      "args": {}
                                    }
                                  }
                                ],
                                "role": "model"
                              },
                              {
                                "parts": [
                                  {
                                    "functionResponse": {
                                      "name": "throwError",
                                      "response": {
                                        "error": {
                                          "content": [
                                            {
                                              "type": "text",
                                              "text": "Error from throwing tool"
                                            }
                                          ],
                                          "isError": true
                                        }
                                      }
                                    }
                                  }
                                ],
                                "role": "user"
                              }
                            ],
                            "tools": [
                              {
                                "functionDeclarations": [
                                  {
                                    "parametersJsonSchema": {
                                      "type": "object",
                                      "properties": {}
                                    },
                                    "name": "throwError"
                                  }
                                ]
                              }
                            ],
                            "toolConfig": {
                              "functionCallingConfig": {
                                "mode": "ANY",
                                "allowedFunctionNames": [
                                  "throwError"
                                ]
                              }
                            },
                            "generationConfig": {}
                          }`;
      const expected2ndCall = JSON.parse(jsonString);
      expect(actual2ndCall).toEqual(expected2ndCall);
    });
    it('should not conduct AFC when afc is disabled', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const callableTool = mcpToTool(await spinUpPrintingServer());
      const mockResponses = [
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithFunctionCall),
            fetchOkOptions,
          ),
        ),
      ];
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );
      const consoleLogSpy = spyOn(console, 'log');
      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents: 'Call the throwing tool.',
        config: {
          tools: [callableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['throwError'],
            },
          },
          automaticFunctionCalling: {
            disable: true,
          },
        },
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
    it('should conduct AFC according the maximumRemoteCalls', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const callableTool = mcpToTool(await spinUpBeepingServer());
      const expectedNumberOfCalls = 3;
      const mockResponses = [];
      for (let i = 0; i < 20; i++) {
        mockResponses.push(
          Promise.resolve(
            new Response(
              JSON.stringify(mockGenerateContentResponseWithSingleFunctionCall),
              fetchOkOptions,
            ),
          ),
        );
      }

      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );
      const consoleBeepSpy = spyOn(process.stdout, 'write').and.callThrough();
      await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents: 'Call the printing tool.',
        config: {
          tools: [callableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
            },
          },
          automaticFunctionCalling: {
            maximumRemoteCalls: 3,
          },
        },
      });
      expect(fetchSpy).toHaveBeenCalledTimes(expectedNumberOfCalls);
      expect(consoleBeepSpy).toHaveBeenCalledTimes(expectedNumberOfCalls);
    });
    it('should append AFC history when ignoreCallHistory is false', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const mcpCallableTool = mcpToTool(
        await spinUpPrintingServer(),
        await spinUpBeepingServer(),
      );

      const mockResponses = [
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithFunctionCall),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      ];
      spyOn(global, 'fetch').and.returnValues(...mockResponses);
      const response = await client.models.generateContent({
        model: 'gemini-1.5-flash-exp',
        contents:
          'Use the printer to print a simple math question in red and the answer in blue, and beep with the beeper',
        config: {
          tools: [mcpCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: types.FunctionCallingConfigMode.ANY,
            },
          },
        },
      });
      // This is the response.automaticFunctionCallingHistory
      // [
      //   {
      //     "role": "user",
      //     "parts": [
      //       {
      //         "text": "Use the printer to print a simple math question in red
      //         and the answer in blue, and beep with the beeper"
      //       }
      //     ]
      //   },
      //   {
      //     "parts": [
      //       {
      //         "functionCall": {
      //           "name": "print",
      //           "args": {
      //             "text": "Hello World",
      //             "color": "red"
      //           }
      //         }
      //       },
      //       {
      //         "functionCall": {
      //           "name": "beep"
      //         }
      //       }
      //     ],
      //     "role": "model"
      //   },
      //   {
      //     "role": "user",
      //     "parts": [
      //       {
      //         "functionResponse": {
      //           "name": "print",
      //           "response": {
      //             "content": []
      //           }
      //         }
      //       },
      //       {
      //         "functionResponse": {
      //           "name": "beep",
      //           "response": {
      //             "content": []
      //           }
      //         }
      //       }
      //     ]
      //   }
      // ]
      expect(response.automaticFunctionCallingHistory).toEqual(
        JSON.parse(
          '[{"role":"user","parts":[{"text":"Use the printer to print a simple math question in red and the answer in blue, and beep with the beeper"}]},{"parts":[{"functionCall":{"name":"print","args":{"text":"Hello World","color":"red"}}},{"functionCall":{"name":"beep"}}],"role":"model"},{"role":"user","parts":[{"functionResponse":{"name":"print","response":{"content":[]}}},{"functionResponse":{"name":"beep","response":{"content":[]}}}]}]',
        ),
      );
    });
  });

  it('should set timeout', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const mcpClient = await spinUpBeepingServer();
    const callableTool = mcpToTool(mcpClient, {
      timeout: 1, // Set artificially low timeout to test.
    });
    const expectedNumberOfCalls = 3;
    const mockResponses = [];
    for (let i = 0; i < 20; i++) {
      mockResponses.push(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponseWithSingleFunctionCall),
            fetchOkOptions,
          ),
        ),
      );
    }

    const fetchSpy = spyOn(global, 'fetch').and.returnValues(...mockResponses);
    const consoleBeepSpy = spyOn(process.stdout, 'write').and.callThrough();
    const callToolSpy = spyOn(mcpClient, 'callTool').and.callThrough();
    await client.models.generateContent({
      model: 'gemini-1.5-flash-exp',
      contents: 'Call the printing tool.',
      config: {
        tools: [callableTool],
        toolConfig: {
          functionCallingConfig: {
            mode: types.FunctionCallingConfigMode.ANY,
          },
        },
        automaticFunctionCalling: {
          maximumRemoteCalls: 3,
        },
      },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(expectedNumberOfCalls);
    expect(consoleBeepSpy).toHaveBeenCalledTimes(expectedNumberOfCalls);
    const requestOptions = callToolSpy.calls.allArgs()[0][2] as Record<
      string,
      unknown
    >;
    expect(requestOptions['timeout']).toEqual(1);
  });
  it('should retry on 500 error and eventually succeed when per-request retry options are provided', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});

    let fetchCalls = 0;
    spyOn(global, 'fetch').and.callFake(() => {
      fetchCalls++;
      if (fetchCalls < 3) {
        // Fail the first two times
        return Promise.resolve(
          new Response(
            JSON.stringify({error: 'Internal Server Error'}),
            fetch500Options,
          ),
        );
      }
      // Succeed on the third try
      return Promise.resolve(
        new Response(
          JSON.stringify(mockGenerateContentResponse),
          fetchOkOptions,
        ),
      );
    });

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Why is the sky blue?',
      config: {
        httpOptions: {
          retryOptions: {
            attempts: 3,
            initialDelay: 0,
          },
        },
      },
    });

    expect(fetchCalls).toBe(3);

    // Check that the final response is the successful one
    expect(response.candidates).toEqual(mockGenerateContentResponse.candidates);
  });
});
describe('generateContentStream', () => {
  it('should append MCP usage header streaming', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    const callableTool = mcpToTool(
      await spinUpPrintingServer(),
      await spinUpBeepingServer(),
    );

    const mockStreamingGenerateContentResponseWithFunctionCall =
      createMockReadableStream(
        JSON.stringify(mockGenerateContentResponseWithFunctionCall),
      );
    const mockStreamingGenerateContentResponseWithAnotherFunctionCall =
      createMockReadableStream(
        JSON.stringify(mockGenerateContentResponseWithAnotherFunctionCall),
      );
    const mockStreamingGenerateContentResponse = createMockReadableStream(
      JSON.stringify(mockGenerateContentResponse),
    );

    const mockResponses = [
      Promise.resolve(
        new Response(
          mockStreamingGenerateContentResponseWithFunctionCall,
          fetchOkOptions,
        ),
      ),
      Promise.resolve(
        new Response(
          mockStreamingGenerateContentResponseWithAnotherFunctionCall,
          fetchOkOptions,
        ),
      ),
      Promise.resolve(
        new Response(mockStreamingGenerateContentResponse, fetchOkOptions),
      ),
    ];
    const fetchSpy = spyOn(global, 'fetch').and.returnValues(...mockResponses);
    const response = await client.models.generateContentStream({
      model: 'gemini-1.5-flash-exp',
      contents:
        'Use the printer to print a simple math question in red and the answer in blue',
      config: {
        tools: [callableTool],
        toolConfig: {
          functionCallingConfig: {
            mode: types.FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['print', 'beep'],
          },
        },
      },
    });
    for await (const _chunk of response) {
      // do nothing
    }
    const allArgs = fetchSpy.calls.allArgs();
    const headers = allArgs[0][1]?.['headers'] as Headers;
    expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
    expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
    expect(headers.get('x-goog-api-client')).toContain('mcp_used/');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('x-goog-api-key')).toBe('fake-api-key');
    const tools = JSON.parse(allArgs[0][1]?.['body'] as string)[
      'tools'
    ] as types.Tool[];
    expect(
      tools.includes({
        functionDeclarations: [
          {
            name: 'print',
            description: 'Print text to the console',
            parameters: {
              type: types.Type.OBJECT,
              properties: {
                text: {
                  type: types.Type.STRING,
                },
                color: {
                  type: types.Type.STRING,
                },
              },
              required: ['text', 'color'],
            },
          },
        ],
      }),
    );
  });
});

function getFunctionDeclarationFromArgs(
  requestBody: string,
): Record<string, unknown> {
  if (typeof requestBody === 'string') {
    try {
      const payload = JSON.parse(requestBody);
      const toolDeclaration = payload?.tools?.[0]?.functionDeclarations?.[0];
      if (
        toolDeclaration &&
        typeof toolDeclaration === 'object' &&
        !Array.isArray(toolDeclaration)
      ) {
        return toolDeclaration as Record<string, unknown>;
      }
    } catch (error) {
      console.error('Failed to parse JSON body or access tool:', error);
      // `parsedTool` will remain undefined on error.
    }
  }
  return {};
}

describe('generateContentStream', () => {
  it('should always return the headers in the sdkHttpResponse', async () => {
    const client = new GoogleGenAI({vertexai: true, apiKey: 'fake-api-key'});
    const mockStreamingGenerateContentResponse = createMockReadableStream(
      JSON.stringify(mockGenerateContentResponse),
    );
    const mockResponses = [
      Promise.resolve(
        new Response(mockStreamingGenerateContentResponse, fetchOkOptions),
      ),
    ];
    spyOn(global, 'fetch').and.returnValues(...mockResponses);
    const response = await client.models.generateContentStream({
      model: 'gemini-1.5-flash-exp',
      contents: 'Do anything.',
    });

    for await (const _chunk of response) {
      expect(_chunk.sdkHttpResponse?.headers).toEqual(fetchOkOptions.headers);
    }
  });
});
