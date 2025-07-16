/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../../src/node/node_client.js';
import {
  CallableTool,
  FunctionCall,
  FunctionCallingConfigMode,
  GenerateContentResponse,
  Part,
} from '../../../src/types.js';
import {setupTestServer, shutdownTestServer} from '../test_server.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;

const customDivideCallableTool: CallableTool = {
  tool: async () =>
    Promise.resolve({
      functionDeclarations: [
        {
          description: 'Custom divide function',
          name: 'customDivide',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              numerator: {
                type: 'number',
              },
              denominator: {
                type: 'number',
              },
            },
          },
        },
      ],
    }),

  callTool: async (functionCalls: FunctionCall[]) => {
    if (functionCalls[0].name === 'customDivide') {
      const response: Part = {
        functionResponse: {
          name: 'customDivide',
          response: {
            result: 42,
          },
        },
      };
      return [response];
    } else {
      throw new Error('Unknown function call');
    }
  },
};

describe('AFC Streaming Tests', () => {
  beforeAll(async () => {
    await setupTestServer();
  });

  afterAll(async () => {
    await shutdownTestServer();
  });

  describe('generateContentStream afc enabled', () => {
    const testCases = [
      {
        name: 'Google AI AFC enabled',
        clientParams: {
          vertexai: false,
          apiKey: GEMINI_API_KEY,
        },
        model: 'gemini-2.0-flash',
        config: {
          tools: [customDivideCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
        messages: ['Divide 10 by 2 using the customDivide function'],
      },
      {
        name: 'Vertex AI AFC enabled',
        clientParams: {vertexai: true, project: GOOGLE_CLOUD_PROJECT},
        model: 'gemini-2.0-flash',
        config: {
          tools: [customDivideCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
        messages: ['Divide 10 by 2 using the customDivide function'],
      },
    ];

    for (const testCase of testCases) {
      it(testCase.name, async () => {
        const client = new GoogleGenAI(testCase.clientParams);
        const response = await client.models.generateContentStream({
          model: testCase.model,
          contents: testCase.messages,
          config: testCase.config,
        });
        const chunks: GenerateContentResponse[] = [];
        for await (const chunk of response) {
          chunks.push(chunk);
        }
        expect(chunks.length).toBeGreaterThan(2);
        expect(
          chunks[0].candidates![0].content!.parts![0].functionCall!.name,
        ).toBe('customDivide');
        expect(
          chunks[1].candidates![0].content!.parts![0].functionResponse!.name,
        ).toBe('customDivide');
        expect(chunks[2].text).not.toBeNull();
      });
    }
  });

  describe('generateContentStream afc disabled', () => {
    const testCases = [
      {
        name: 'Google AI AFC disabled',
        clientParams: {
          vertexai: false,
          apiKey: GEMINI_API_KEY,
        },
        model: 'gemini-2.0-flash',
        config: {
          tools: [customDivideCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
          automaticFunctionCalling: {
            disable: true,
          },
        },
        messages: ['Divide 10 by 2 using the customDivide function'],
      },
      {
        name: 'Vertex AI AFC disabled',
        clientParams: {vertexai: true, project: GOOGLE_CLOUD_PROJECT},
        model: 'gemini-2.0-flash',
        config: {
          tools: [customDivideCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
          automaticFunctionCalling: {
            disable: true,
          },
        },
        messages: ['Divide 10 by 2 using the customDivide function'],
      },
    ];

    for (const testCase of testCases) {
      it(testCase.name, async () => {
        const client = new GoogleGenAI(testCase.clientParams);
        const response = await client.models.generateContentStream({
          model: testCase.model,
          contents: testCase.messages,
          config: testCase.config,
        });
        const chunks: GenerateContentResponse[] = [];
        for await (const chunk of response) {
          chunks.push(chunk);
        }
        expect(chunks.length).toEqual(1);
        expect(
          chunks[0].candidates![0].content!.parts![0].functionCall!.name,
        ).toBe('customDivide');
      });
    }
  });

  describe('chat stream AFC enabled', () => {
    const testCases = [
      {
        name: 'Google AI chat stream',
        clientParams: {
          vertexai: false,
          apiKey: GEMINI_API_KEY,
        },
        model: 'gemini-2.0-flash',
        config: {
          tools: [customDivideCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
        messages: ['Divide 10 by 2 using the customDivide function', 'Thanks!'],
      },
      {
        name: 'Vertex AI chat stream',
        clientParams: {vertexai: true, project: GOOGLE_CLOUD_PROJECT},
        model: 'gemini-2.0-flash',
        config: {
          tools: [customDivideCallableTool],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
        messages: ['Divide 10 by 2 using the customDivide function', 'Thanks!'],
      },
    ];

    testCases.forEach((testCase) => {
      it(testCase.name, async () => {
        const client = new GoogleGenAI(testCase.clientParams);
        const chat = client.chats.create({
          model: testCase.model,
          config: testCase.config,
        });
        for (const message of testCase.messages) {
          const response = await chat.sendMessageStream({
            message,
          });
          const chunks: GenerateContentResponse[] = [];
          for await (const chunk of response) {
            chunks.push(chunk);
          }
          expect(chunks.length).toBeGreaterThan(0);
        }
        const history = chat.getHistory();
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].parts![0].text).toBe(
          'Divide 10 by 2 using the customDivide function',
        );
        expect(history[1].parts![0].functionCall).not.toBeNull();
        expect(history[2].parts![0].functionResponse).not.toBeNull();
      });
    });

    describe('AFC max calls exceeded', () => {
      const testCases = [
        {
          name: 'Google AI can continue after max calls exceeded',
          clientParams: {
            vertexai: false,
            apiKey: GEMINI_API_KEY,
          },
          model: 'gemini-2.0-flash',
          config: {
            tools: [customDivideCallableTool],
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.AUTO,
              },
            },
            automaticFunctionCalling: {
              maximumRemoteCalls: 1,
            },
          },
          messages: [
            'Divide 10 by 2 using the customDivide function, then divide the result by 2 again, then tell me the result',
            'Thanks!',
          ],
        },
        {
          name: 'Vertex AI can continue after max calls exceeded',
          clientParams: {vertexai: true, project: GOOGLE_CLOUD_PROJECT},
          model: 'gemini-2.0-flash',
          config: {
            tools: [customDivideCallableTool],
            toolConfig: {
              functionCallingConfig: {
                mode: FunctionCallingConfigMode.AUTO,
              },
            },
            automaticFunctionCalling: {
              maximumRemoteCalls: 1,
            },
          },
          messages: [
            'Divide 10 by 2 using the customDivide function, then divide the result by 2 again, then tell me the result',
            'Thanks!',
          ],
        },
      ];

      testCases.forEach((testCase) => {
        it(testCase.name, async () => {
          const client = new GoogleGenAI(testCase.clientParams);
          const chat = client.chats.create({
            model: testCase.model,
            config: testCase.config,
          });
          const initialResponse = await chat.sendMessageStream({
            message: testCase.messages[0],
          });
          const chunks: GenerateContentResponse[] = [];
          for await (const chunk of initialResponse) {
            chunks.push(chunk);
          }
          expect(chunks.length).toBeGreaterThan(0);
          const lastChunk = chunks[chunks.length - 1];
          expect(
            lastChunk.candidates![0].content!.parts![0].functionCall,
          ).not.toBeNull();
          const secondResponse = await chat.sendMessageStream({
            message: {
              functionResponse: {name: 'customDivide', response: {result: 2}},
            },
          });
          const secondChunks: GenerateContentResponse[] = [];
          for await (const chunk of secondResponse) {
            secondChunks.push(chunk);
          }
          expect(secondChunks.length).toBeGreaterThan(0);
          expect(
            secondChunks[0].candidates![0].content!.parts![0].text,
          ).not.toBeNull();
        });
      });
    });
  });
});
