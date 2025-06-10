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
          responseSchema: zodToJsonSchema(zodSchema),
        },
      });
      const parsedSchema = (
        (
          JSON.parse(
            fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
          ) as Record<string, unknown>
        )['generationConfig']! as Record<string, unknown>
      )['responseSchema'];
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
          responseSchema: zodToJsonSchema(nestedSchema),
        },
      });
      const parsedSchema = (
        (
          JSON.parse(
            fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
          ) as Record<string, unknown>
        )['generationConfig']! as Record<string, unknown>
      )['responseSchema'];
      expect(parsedSchema).toEqual(expected);
    });
  });
  describe('can use zodToJsonSchema together with tSchema internally to help build the FunctionDeclaration', () => {
    it('should not throw error when wrapping zod function with the helper function', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});

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
                {
                  name: 'setParameterFunction',
                  description: 'this is a setParameter function',
                  parameters: zodToJsonSchema(
                    z.object({
                      numberField: z.number(),
                    }),
                  ) as Record<string, unknown>,
                },
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

      const parsedTools = (
        JSON.parse(
          fetchSpy.calls.allArgs()[0][1]?.['body'] as string,
        ) as Record<string, unknown>
      )['tools'] as unknown[];
      const parsedFunctionDeclarations = (
        (parsedTools[0] as Record<string, unknown>)[
          'functionDeclarations'
        ] as unknown[]
      )[0];

      expect(parsedFunctionDeclarations).toEqual(expected);
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
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );
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
      expect(
        tools.includes({
          functionDeclarations: [
            {
              name: 'beep',
              description: 'Beep with the beeper',
              parameters: {
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
              parameters: zodToJsonSchema(
                z.object({
                  brightness: z.number(),
                  colorTemperature: z.string(),
                }),
              ) as Record<string, unknown>,
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
        expect((e as Error).message).toEqual(
          'Automatic function calling with CallableTools and Tools is not yet supported.',
        );
      }
    });
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
    const fetchSpy = spyOn(global, 'fetch').and.returnValues(...mockResponses);

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
    // The significant of the 2nd call is, this call's content contains the
    // tool error result and send it back to the model.
    const actual2ndCall = JSON.parse(allArgs[1][1]?.['body'] as string);
    const expected2ndCall = JSON.parse(
      '{"contents":[{"parts":[{"text":"Call the throwing tool."}],"role":"user"},{"parts":[{"functionCall":{"name":"throwError","args":{}}}],"role":"model"},{"parts":[{"functionResponse":{"name":"throwError","response":{"error":{"content":[{"type":"text","text":"Error from throwing tool"}],"isError":true}}}}],"role":"user"}],"tools":[{"functionDeclarations":[{"name":"throwError","parameters":{"type":"OBJECT"}}]}],"toolConfig":{"functionCallingConfig":{"mode":"ANY","allowedFunctionNames":["throwError"]}},"generationConfig":{}}',
    );
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
    const fetchSpy = spyOn(global, 'fetch').and.returnValues(...mockResponses);
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

    const fetchSpy = spyOn(global, 'fetch').and.returnValues(...mockResponses);
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
