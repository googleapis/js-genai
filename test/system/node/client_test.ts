/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuthOptions} from 'google-auth-library';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {GoogleGenAI} from '../../../src/node/node_client.js';
import {
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GenerateContentResponse,
  HttpOptions,
  Modality,
  Part,
} from '../../../src/types.js';
import {createZeroFilledTempFile} from '../../_generate_test_file.js';
import {setupTestServer, shutdownTestServer} from '../test_server.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'test-api-key';
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const MODEL = 'gemini-2.5-flash';

describe('Client Tests', () => {
  let testName: string = '';
  let httpOptions: HttpOptions;

  beforeAll(async () => {
    await setupTestServer();
    jasmine.getEnv().addReporter({
      specStarted: function (result) {
        testName = result.fullName;
      },
    });
  });

  afterAll(async () => {
    await shutdownTestServer();
  });

  beforeEach(() => {
    httpOptions = {headers: {'Test-Name': testName}};
  });

  describe('generateContent', () => {
    it('ML Dev should generate content with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {
          maxOutputTokens: 200,
          candidateCount: 1,
          thinkingConfig: {thinkingBudget: 50},
        },
      });
      expect(response.candidates!.length).toBe(
        1,
        'Expected 1 candidate got ' + response.candidates!.length,
      );
      expect(response.usageMetadata!.candidatesTokenCount).toBeLessThanOrEqual(
        250, // sometimes backend returns a little more than 200 tokens
        'Expected candidatesTokenCount to be less than or equal to 250, got ' +
          response.usageMetadata!.candidatesTokenCount,
      );
      console.info(
        'ML Dev should generate content with specified parameters\n',
        response.text,
      );
    });

    it('Vertex AI should generate content with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {
          maxOutputTokens: 200,
          candidateCount: 1,
          thinkingConfig: {thinkingBudget: 50},
        },
      });
      expect(response.candidates!.length).toBe(
        1,
        'Expected 1 candidate got ' + response.candidates!.length,
      );
      expect(response.usageMetadata!.candidatesTokenCount).toBeLessThanOrEqual(
        250,
        'Expected candidatesTokenCount to be less than or equal to 20, got ' +
          response.usageMetadata!.candidatesTokenCount,
      );
      console.info(
        'Vertex AI should generate content with specified parameters\n',
        response.text,
      );
    });

    it('ML Dev should generate content with system instruction', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'high',
        config: {systemInstruction: 'I say high you say low'},
      });
      const responseText = response.text;
      expect(responseText?.includes('low') ?? false).toBe(
        true,
        `Expected response to include "low", but got ${responseText}`,
      );
      console.info(
        'ML Dev should generate content with system instruction\n',
        responseText,
      );
    });

    it('Vertex AI should generate content with system instruction', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'high',
        config: {systemInstruction: 'I say high you say low.'},
      });
      const responseText = response.text;
      expect(responseText?.includes('low') ?? false).toBe(
        true,
        `Expected response to include "low", but got ${responseText}`,
      );
      console.info(
        'Vertex AI should generate content with system instruction\n',
        responseText,
      );
    });
    it('Vertex AI should use application default credentials when no auth options are provided', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      await client.models.generateContent({
        model: MODEL,
        contents: 'high',
        config: {systemInstruction: 'I say high you say low.'},
      });
      console.info(
        'Vertex AI should use application default credentials when no auth options are provided\n',
      );
    });
    it('Vertex AI should allow user provided googleAuth objects', async () => {
      const googleAuthOptions: GoogleAuthOptions = {
        credentials: {
          client_email: 'test-sa@appspot.gserviceaccount.com',
          private_key: '',
        },
      };
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        googleAuthOptions: googleAuthOptions,
        httpOptions,
      });
      try {
        await client.models.generateContent({
          model: MODEL,
          contents: 'why is the sky blue?',
          config: {maxOutputTokens: 20, candidateCount: 1},
        });
        console.info(
          'Vertex AI should allow user provided googleAuth objects\n',
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          // When a service account is passed in via client_email, a private_key
          // field is required.
          expect(
            error.message.includes(
              'The incoming JSON object does not contain a private_key field',
            ),
          );
        }
      }
    });
    it('ML Dev should generate content with given valid json schema in responseSchema', async () => {
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nullableInnerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string().describe('This is a simple string'),
        stringDatatime: z.string().datetime(),
        stringWithEnum: z.enum(['enumvalue1', 'enumvalue2', 'enumvalue3']),
        stringWithLength: z.string().min(1).max(10),
        simpleNumber: z.number(),
        simpleInteger: z.number().int(),
        integerInt64: z.number().int(),
        numberWithMinMax: z.number().min(1).max(10),
        simpleBoolean: z.boolean(),
        arrayFiled: z.array(z.string()),
        unionField: z.union([z.string(), z.number()]),
        nullableField: z.string().nullable(),
        nullableArrayField: z.array(z.string()).nullable(),
        nullableObjectField: nullableInnerObject.nullable(),
        inner: innerObject,
      });
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'populate the following object',
        config: {
          responseMimeType: 'application/json',
          responseSchema: zodToJsonSchema(nestedSchema),
        },
      });
      const parsedResponse = JSON.parse(
        response.candidates![0].content!['parts']![0].text as string,
      );
      console.log('mldev response', parsedResponse);
      const validationResult = nestedSchema.safeParse(parsedResponse);
      expect(validationResult.success).toEqual(true);
    });

    it('Vertex AI should generate content with given valid json schema in responseSchema', async () => {
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nullableInnerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string().default('default'),
        stringDatetime: z.string().datetime(),
        stringWithEnum: z.enum(['enumvalue1', 'enumvalue2', 'enumvalue3']),
        stringWithLength: z.string().min(1).max(10),
        simpleNumber: z.number(),
        simpleInteger: z.number().int(),
        integerInt64: z.number().int(),
        numberWithMinMax: z.number().min(1).max(10),
        simpleBoolean: z.boolean(),
        arrayFiled: z.array(z.string()),
        unionField: z.union([z.string(), z.number()]),
        nullableField: z.string().nullable(),
        nullableArrayField: z.array(z.string()).nullable(),
        nullableObjectField: nullableInnerObject.nullable(),
        inner: innerObject,
      });

      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'populate the following object',
        config: {
          responseMimeType: 'application/json',
          responseSchema: zodToJsonSchema(nestedSchema),
        },
      });
      const parsedResponse = JSON.parse(
        response.candidates![0].content!['parts']![0].text as string,
      );
      console.log('vertex ai response', parsedResponse);
      const validationResult = nestedSchema.safeParse(parsedResponse);
      expect(validationResult.success).toEqual(true);
    });
    it('ML Dev should be able to help build the FunctionDeclaration', async () => {
      const stringArgument = z.object({
        firstString: z.string(),
        secondString: z.string(),
      });

      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'put word: hello and word: world into a string',
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'concatStringFunction',
                  description: 'this is a concat string function',
                  parameters: zodToJsonSchema(stringArgument) as Record<
                    string,
                    unknown
                  >,
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['concatStringFunction'],
            },
          },
        },
      });
      const functionCallResponse =
        response.candidates![0].content!['parts']![0].functionCall;
      expect(functionCallResponse!.name).toEqual('concatStringFunction');
      const parsedArgument = stringArgument.safeParse(
        functionCallResponse!.args!,
      );
      expect(parsedArgument.success).toEqual(true);
      expect(parsedArgument.data).toEqual({
        firstString: 'hello',
        secondString: 'world',
      });
    });

    it('ML Dev should generate content with given valid json schema in responseJsonSchema', async () => {
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nullableInnerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string().describe('This is a simple string'),
        stringDatatime: z.string().datetime(),
        stringWithEnum: z.enum(['enumvalue1', 'enumvalue2', 'enumvalue3']),
        stringWithLength: z.string().min(1).max(10),
        simpleNumber: z.number(),
        simpleInteger: z.number().int(),
        integerInt64: z.number().int(),
        numberWithMinMax: z.number().min(1).max(10),
        simpleBoolean: z.boolean(),
        arrayFiled: z.array(z.string()),
        unionField: z.union([z.string(), z.number()]),
        nullableField: z.string().nullable(),
        nullableArrayField: z.array(z.string()).nullable(),
        nullableObjectField: nullableInnerObject.nullable(),
        inner: innerObject,
      });
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'populate the following object',
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(nestedSchema),
        },
      });
      const parsedResponse = JSON.parse(
        response.candidates![0].content!['parts']![0].text as string,
      );
      console.log('mldev response', parsedResponse);
      const validationResult = nestedSchema.safeParse(parsedResponse);
      expect(validationResult.success).toEqual(true);
    });

    it('Vertex AI should generate content with given valid json schema in responseJsonSchema', async () => {
      const innerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nullableInnerObject = z.object({
        innerString: z.string(),
        innerNumber: z.number(),
      });
      const nestedSchema = z.object({
        simpleString: z.string().default('default'),
        stringDatetime: z.string().datetime(),
        stringWithEnum: z.enum(['enumvalue1', 'enumvalue2', 'enumvalue3']),
        stringWithLength: z.string().min(1).max(10),
        simpleNumber: z.number(),
        simpleInteger: z.number().int(),
        integerInt64: z.number().int(),
        numberWithMinMax: z.number().min(1).max(10),
        simpleBoolean: z.boolean(),
        arrayFiled: z.array(z.string()),
        unionField: z.union([z.string(), z.number()]),
        nullableField: z.string().nullable(),
        nullableArrayField: z.array(z.string()).nullable(),
        nullableObjectField: nullableInnerObject.nullable(),
        inner: innerObject,
      });

      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'populate the following object',
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(nestedSchema),
        },
      });
      const parsedResponse = JSON.parse(
        response.candidates![0].content!['parts']![0].text as string,
      );
      console.log('vertex ai response', parsedResponse);
      const validationResult = nestedSchema.safeParse(parsedResponse);
      expect(validationResult.success).toEqual(true);
    });
    it('ML Dev can use JSON schema in parameters to build FunctionDeclaration', async () => {
      const stringArgument = z.object({
        firstString: z.string(),
        secondString: z.string(),
      });

      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'put word: hello and word: world into a string',
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'concatStringFunction',
                  description: 'this is a concat string function',
                  parameters: zodToJsonSchema(stringArgument) as Record<
                    string,
                    unknown
                  >,
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['concatStringFunction'],
            },
          },
        },
      });
      const functionCallResponse =
        response.candidates![0].content!['parts']![0].functionCall;
      expect(functionCallResponse!.name).toEqual('concatStringFunction');
      const parsedArgument = stringArgument.safeParse(
        functionCallResponse!.args!,
      );
      expect(parsedArgument.success).toEqual(true);
      expect(parsedArgument.data).toEqual({
        firstString: 'hello',
        secondString: 'world',
      });
    });
    it('ML Dev can use JSON schema in parametersJsonSchema to build FunctionDeclaration', async () => {
      const stringArgument = z.object({
        firstString: z.string(),
        secondString: z.string(),
      });

      console.log('httpoptions: ', httpOptions);
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'put word: hello and word: world into a string',
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'concatStringFunction',
                  description: 'this is a concat string function',
                  parametersJsonSchema: zodToJsonSchema(stringArgument),
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['concatStringFunction'],
            },
          },
        },
      });
      const functionCallResponse =
        response.candidates![0].content!['parts']![0].functionCall;
      expect(functionCallResponse!.name).toEqual('concatStringFunction');
      const parsedArgument = stringArgument.safeParse(
        functionCallResponse!.args!,
      );
      expect(parsedArgument.success).toEqual(true);
      expect(parsedArgument.data).toEqual({
        firstString: 'hello',
        secondString: 'world',
      });
    });
    it('Vertex AI can use JSON schema in parameters to build FunctionDeclaration', async () => {
      const stringArgument = z.object({
        firstString: z.string(),
        secondString: z.string(),
      });
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'put word: hello and word: world into a string',
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'concatStringFunction',
                  description: 'this is a concat string function',
                  parameters: zodToJsonSchema(stringArgument) as Record<
                    string,
                    unknown
                  >,
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ['concatStringFunction'],
            },
          },
        },
      });
      const functionCallResponse =
        response.candidates![0].content!['parts']![0].functionCall;
      expect(functionCallResponse!.name).toEqual('concatStringFunction');
      const parsedArgument = stringArgument.safeParse(
        functionCallResponse!.args!,
      );
      expect(parsedArgument.success).toEqual(true);
      expect(parsedArgument.data).toEqual({
        firstString: 'hello',
        secondString: 'world',
      });
    });
    it('ML Dev should return the headers in the sdkHttpResponse by default', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {maxOutputTokens: 20, candidateCount: 1},
      });
      console.log('response', response);
      expect(response.sdkHttpResponse?.headers).toEqual(
        jasmine.objectContaining({
          'content-type': 'application/json; charset=UTF-8',
          'x-content-type-options': 'nosniff',
          'x-xss-protection': '0',
        }),
      );
    });

    it('Vertex AI should return the headers in the sdkHttpResponse by default', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {maxOutputTokens: 20, candidateCount: 1},
      });
      expect(response.sdkHttpResponse?.headers).toEqual(
        jasmine.objectContaining({
          'content-type': 'application/json; charset=UTF-8',
          'x-content-type-options': 'nosniff',
          'x-xss-protection': '0',
        }),
      );
    });
  });
  it('Vertex AI can use JSON schema in parametersJsonSchema to build FunctionDeclaration', async () => {
    const stringArgument = z.object({
      firstString: z.string(),
      secondString: z.string(),
    });
    const client = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
      httpOptions,
    });
    const response = await client.models.generateContent({
      model: MODEL,
      contents: 'put word: hello and word: world into a string',
      config: {
        tools: [
          {
            functionDeclarations: [
              {
                name: 'concatStringFunction',
                description: 'this is a concat string function',
                parametersJsonSchema: zodToJsonSchema(stringArgument),
              },
            ],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['concatStringFunction'],
          },
        },
      },
    });
    const functionCallResponse =
      response.candidates![0].content!['parts']![0].functionCall;
    expect(functionCallResponse!.name).toEqual('concatStringFunction');
    const parsedArgument = stringArgument.safeParse(
      functionCallResponse!.args!,
    );
    expect(parsedArgument.success).toEqual(true);
    expect(parsedArgument.data).toEqual({
      firstString: 'hello',
      secondString: 'world',
    });
  });

  describe('generateContentStream', () => {
    describe('partial function calling', () => {
      const json_function_declarations: FunctionDeclaration[] = [
        {
          'name': 'getCurrentWeather',
          'description': 'Get the current weather in a city',
          'parametersJsonSchema': {
            'type': 'object',
            'properties': {
              'location': {
                'type': 'string',
                'description': 'The location to get the weather for',
              },
              'country': {
                'anyOf': [
                  {
                    'type': 'string',
                    'description': 'The country to get the weather for',
                  },
                  {
                    'type': 'null',
                  },
                ],
                'description': 'The country to get the weather for',
              },
              'unit': {
                'type': 'string',
                'enum': ['C', 'F'],
              },
              'purpose': {
                'type': 'string',
                'description': 'Discribes the purpose of asking the weather',
              },
            },
            'required': ['location', 'unit', 'country'],
          },
        },
      ];
      it('ML Dev will throw error when enabbled streamFunctionCallArguments', async () => {
        const client = new GoogleGenAI({
          vertexai: false,
          apiKey: GOOGLE_API_KEY,
          httpOptions,
        });
        try {
          await client.models.generateContentStream({
            model: 'gemini-3-pro-preview',
            contents:
              'get the current weather in NewYorkCity in celsius, the country should be left null, the purpose is to know what to wear today.',
            config: {
              tools: [
                {
                  functionDeclarations: json_function_declarations,
                },
              ],
              toolConfig: {
                functionCallingConfig: {
                  streamFunctionCallArguments: true,
                },
              },
            },
          });
        } catch (error: unknown) {
          if (error instanceof Error) {
            expect(
              error.message.includes(
                'streamFunctionCallArguments parameter is not supported in Gemini API',
              ),
            );
          }
        }
      });
      it('Vertex AI should stream generate content enabled streamFunctionCallArguments', async () => {
        httpOptions.baseUrl = 'http://localhost:1455';
        const client = new GoogleGenAI({
          vertexai: true,
          project: GOOGLE_CLOUD_PROJECT,
          location: GOOGLE_CLOUD_LOCATION,
          httpOptions,
        });
        const response = await client.models.generateContentStream({
          model: 'gemini-3-pro-preview',
          contents:
            'get the current weather in NewYorkCity in celsius, the country should be USA, the purpose is to know what to wear today.',
          config: {
            tools: [
              {
                functionDeclarations: json_function_declarations,
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                streamFunctionCallArguments: true,
              },
            },
          },
        });
        console.info(
          'Vertex AI should stream generate content with specified parameters',
        );
        for await (const chunk of response) {
          expect(chunk.candidates!.length).toBe(
            1,
            'Expected 1 candidate got ' + chunk.candidates!.length,
          );
        }
      });
      it('Vertex AI should stream generate content with particial function calling in the content', async () => {
        httpOptions.baseUrl = 'http://localhost:1455';
        const client = new GoogleGenAI({
          vertexai: true,
          project: GOOGLE_CLOUD_PROJECT,
          location: GOOGLE_CLOUD_LOCATION,
          httpOptions,
        });
        const response = await client.models.generateContentStream({
          model: 'gemini-3-pro-preview',
          contents:
            'get the current weather in NewYorkCity in celsius, the country should be USA, the purpose is to know what to wear today.',
          config: {
            tools: [
              {
                functionDeclarations: json_function_declarations,
              },
            ],
            toolConfig: {
              functionCallingConfig: {
                streamFunctionCallArguments: true,
              },
            },
          },
        });
        console.info(
          'Vertex AI should stream generate content with specified parameters',
        );
        for await (const chunk of response) {
          expect(chunk.candidates!.length).toBe(
            1,
            'Expected 1 candidate got ' + chunk.candidates!.length,
          );
        }
      });
    });
    it('Vertex AI should stream generate content with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {
          candidateCount: 1,
          maxOutputTokens: 200,
          thinkingConfig: {thinkingBudget: 50},
        },
      });
      let i = 1;
      let finalChunk: GenerateContentResponse | undefined = undefined;
      console.info(
        'Vertex AI should stream generate content with specified parameters',
      );
      for await (const chunk of response) {
        console.info(`stream chunk ${i}`, chunk.text);
        expect(chunk.candidates!.length).toBe(
          1,
          'Expected 1 candidate got ' + chunk.candidates!.length,
        );
        i++;
        finalChunk = chunk;
      }
      expect(
        finalChunk?.usageMetadata!.candidatesTokenCount,
      ).toBeLessThanOrEqual(
        250, // sometimes backend returns a little more than 200
        // tokens
        'Expected candidatesTokenCount to be less than or equal to 250, got ' +
          finalChunk?.usageMetadata!.candidatesTokenCount,
      );
    });

    it('ML Dev should stream generate content with system instruction', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: MODEL,
        contents: 'high',
        config: {
          systemInstruction:
            'I say high you say low, and then tell me why is the sky blue.',
          candidateCount: 1,
        },
      });
      let i = 1;
      for await (const chunk of response) {
        console.info(`stream chunk ${i}`, chunk.text);
        expect(chunk.candidates!.length).toBe(
          1,
          'Expected 1 candidate got ' + chunk.candidates!.length,
        );
        i++;
      }
    });

    it('Vertex AI should stream generate content with system instruction', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: MODEL,
        contents: 'high',
        config: {
          systemInstruction:
            'I say high you say low, then tell me why is the sky blue.',
          maxOutputTokens: 200,
          candidateCount: 1,
        },
      });
      let i = 1;
      let finalChunk: GenerateContentResponse | undefined = undefined;
      console.info(
        'Vertex AI should stream generate content with system instruction',
      );
      for await (const chunk of response) {
        console.info(`stream chunk ${i}`, chunk.text);
        expect(chunk.candidates!.length).toBe(
          1,
          'Expected 1 candidate got ' + chunk.candidates!.length,
        );
        i++;
        finalChunk = chunk;
      }
      expect(
        finalChunk?.usageMetadata!.candidatesTokenCount,
      ).toBeLessThanOrEqual(
        250, // sometimes backend returns a little more than 200
        // tokens
        'Expected candidatesTokenCount to be less than or equal to 250, got ' +
          finalChunk?.usageMetadata!.candidatesTokenCount,
      );
    });
    it('ML Dev should return the headers in the sdkHttpResponse for each chunk', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {candidateCount: 1, maxOutputTokens: 200},
      });
      let i = 1;
      console.info(
        'ML Dev should stream generate content with specified parameters',
      );
      for await (const chunk of response) {
        console.info(`stream chunk ${i}`, chunk.sdkHttpResponse?.headers);
        expect(chunk.sdkHttpResponse?.headers).toEqual(
          jasmine.objectContaining({
            'content-type': 'text/event-stream',
            'transfer-encoding': 'chunked',
            'x-content-type-options': 'nosniff',
            'x-xss-protection': '0',
          }),
        );
        i++;
      }
    });

    it('Vertex AI should return the headers in the sdkHttpResponse for each chunk', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: MODEL,
        contents: 'why is the sky blue?',
        config: {candidateCount: 1},
      });
      console.info(
        'Vertex AI should stream generate content with specified parameters',
      );
      for await (const chunk of response) {
        expect(chunk.candidates!.length).toBe(
          1,
          'Expected 1 candidate got ' + chunk.candidates!.length,
        );
      }
    });

    it('ML Dev should stream generate content with image output', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents:
          'Generate an image of the Eiffel tower with fireworks in' +
          '  the background.',
        config: {responseModalities: [Modality.IMAGE, Modality.TEXT]},
      });
      let i = 1;
      console.info('ML Dev should stream generate content with image output');
      for await (const chunk of response) {
        for (const candidate of chunk.candidates!) {
          if (candidate.finishReason) {
            continue;
          }
          for (const part of candidate.content!.parts!) {
            expect(part.text || part.inlineData).toBeDefined();
          }
        }
        if (chunk.text) {
          console.info(`stream chunk ${i}`, chunk.text);
        }
        expect(chunk.candidates!.length).toBe(
          1,
          'Expected 1 candidate got ' + chunk.candidates!.length,
        );
        i++;
      }
    });

    it('Vertex AI should stream generate content with image output', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateContentStream({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents:
          'Generate an image of the Eiffel tower with fireworks in' +
          '  the background.',
        config: {responseModalities: [Modality.IMAGE, Modality.TEXT]},
      });
      let i = 1;
      console.info(
        'Vertex AI should stream generate content with image output',
      );
      for await (const chunk of response) {
        for (const candidate of chunk.candidates!) {
          if (candidate.finishReason) {
            continue;
          }
          for (const part of candidate.content!.parts!) {
            expect(part.text || part.inlineData).toBeDefined();
          }
        }
        if (chunk.text) {
          console.info(`stream chunk ${i}`, chunk.text);
        }
        expect(chunk.candidates!.length).toBe(
          1,
          'Expected 1 candidate got ' + chunk.candidates!.length,
        );
        i++;
      }
    });
  });

  describe('generateImages', () => {
    let originalTimeout: number;

    beforeEach(function () {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; // 10 seconds
    });
    it('ML Dev should generate image with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: 'Robot holding a red skateboard',
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          includeSafetyAttributes: true,
        },
      });
      expect(response?.generatedImages!.length).toBe(
        1,
        'Expected 1 generated image got ' + response?.generatedImages!.length,
      );
      expect(response?.generatedImages?.[0]?.image?.imageBytes).toEqual(
        jasmine.anything(),
        'Expected image bytes to be non-empty',
      );
      expect(response?.positivePromptSafetyAttributes).toEqual(
        jasmine.anything(),
        'Expected positive prompt safety attributes to be non-empty',
      );
    });

    it('Vertex AI should generate images with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });
      const response = await client.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: 'Robot holding a red skateboard',
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          includeSafetyAttributes: true,
        },
      });
      expect(response?.generatedImages!.length).toBe(
        1,
        'Expected 1 generated image got ' + response?.generatedImages!.length,
      );
      expect(response?.generatedImages?.[0]?.image?.imageBytes).toEqual(
        jasmine.anything(),
        'Expected image bytes to be non-empty',
      );
      expect(response?.positivePromptSafetyAttributes).toEqual(
        jasmine.anything(),
        'Expected positive prompt safety attributes to be non-empty',
      );
    });

    afterEach(function () {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });

  describe('test thinking', () => {
    it('generate content should return thought field', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions: {apiVersion: 'v1alpha', headers: {'Test-Name': testName}},
      });
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash-thinking-exp',
        contents: 'What is the sum of natural numbers from 1 to 100?',
        config: {
          maxOutputTokens: 20,
          candidateCount: 1,
          thinkingConfig: {includeThoughts: true},
        },
      });
      expect(JSON.stringify(response)).toContain(
        '"thought":true',
        'Expected response to contain field "thought',
      );
    });
  });

  describe('countTokens', () => {
    it('ML Dev should count tokens with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });

      const response = await client.models.countTokens({
        model: MODEL,
        contents: 'The quick brown fox jumps over the lazy dog.',
      });
      expect(response!.totalTokens ?? 0).toBeGreaterThan(
        0,
        'Expected totalTokens to be nonzero, got ' + response.totalTokens,
      );
      console.info(
        'ML Dev should count tokens with specified parameters\n',
        JSON.stringify(response),
      );
    });

    it('Vertex AI should count tokens with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });

      const response = await client.models.countTokens({
        model: MODEL,
        contents: 'The quick brown fox jumps over the lazy dog.',
      });
      expect(response!.totalTokens ?? 0).toBeGreaterThan(
        0,
        'Expected totalTokens to be nonzero, got ' + response.totalTokens,
      );
      console.info(
        'Vertex AI should count tokens with specified parameters\n',
        JSON.stringify(response),
      );
    });
  });

  describe('embedContent', () => {
    it('Vertex AI should embed content with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });

      const response = await client.models.embedContent({
        model: 'text-embedding-004',
        contents: 'Hello world',
      });
      expect(response!.embeddings!.length).toBeGreaterThan(
        0,
        'Expected embeddings to be nonempty, got ' +
          response!.embeddings!.length,
      );
      console.info(
        'Vertex AI should embed content with specified parameters\n',
        JSON.stringify(response),
      );
    });
  });

  describe('computeTokens', () => {
    it('Vertex AI should compute tokens with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });

      const response = await client.models.computeTokens({
        model: MODEL,
        contents: 'The quick brown fox jumps over the lazy dog.',
      });
      expect(response!.tokensInfo!.length).toBeGreaterThan(
        0,
        'Expected tokensInfo to be nonempty, got ' +
          response!.tokensInfo!.length,
      );
      console.info(
        'Vertex AI should compute tokens with specified parameters\n',
        JSON.stringify(response),
      );
    });
  });

  describe('cachedContent', () => {
    let originalTimeout: number;

    beforeEach(function () {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    });
    it('Vertex AI should cache content with specified parameters', async () => {
      setTimeout(async function () {
        const client = new GoogleGenAI({
          vertexai: true,
          project: GOOGLE_CLOUD_PROJECT,
          location: GOOGLE_CLOUD_LOCATION,
          httpOptions,
        });

        const cachedContent1: Part = {
          fileData: {
            fileUri: 'gs://cloud-samples-data/generative-ai/pdf/2403.05530.pdf',
            mimeType: 'application/pdf',
          },
        };

        const cachedContent2: Part = {
          fileData: {
            fileUri:
              'gs://cloud-samples-data/generative-ai/pdf/2312.11805v3.pdf',
            mimeType: 'application/pdf',
          },
        };

        const cache = await client.caches.create({
          model: MODEL,
          config: {contents: [cachedContent1, cachedContent2]},
        });
        expect(cache.name).toBeDefined();

        const getResponse = await client.caches.get({name: cache.name ?? ''});
        expect(getResponse.name).toBe(
          cache.name,
          'Expected getResponse to contain the created cache name.',
        );
      }, 30000); // 30 seconds
    });

    // Disabling as when recording we didn't get cache entries and failed.
    // TODO(b/416948563): make this test independent of previous state or remove it.
    xit('Vertex AI should return list of caches', async () => {
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: GOOGLE_CLOUD_LOCATION,
        httpOptions,
      });

      const response = await client.caches.list();
      const pager = await client.caches.list({
        config: {pageSize: 2},
      });
      let page = pager.page;
      for (const cache of page) {
        console.log(cache.name);
      }
      while (pager.hasNextPage()) {
        page = await pager.nextPage();
        for (const cache of page) {
          console.log(cache.name);
        }
      }

      expect(response.pageLength).toBeGreaterThan(0);
      expect(pager.pageLength).toBeGreaterThan(0);
    });

    afterEach(function () {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });

  // These tests upload large files which make for a large recording footprint.
  // Since these are artificially created files with just zeros they should
  // compress very well.
  // TODO(b/416161146): Enable these tests once test-server can compress large
  // recordings.
  xdescribe('files', () => {
    it('ML Dev list files with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const response = await client.files.list({config: {'pageSize': 2}});
      expect(response!.pageLength ?? 0).toBeGreaterThan(
        0,
        'Expected at least one file has more than 2 pages, got ' +
          response!.pageLength,
      );
      console.info(
        'ML Dev should list files with specified parameters\n',
        JSON.stringify(response),
      );
    });
    it('ML Dev list files with pagers', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      const pager = await client.files.list({config: {pageSize: 2}});
      let page = pager.page;
      for (const file of page) {
        console.log(file.name);
      }
      while (pager.hasNextPage()) {
        for (const file of page) {
          console.log(file.name);
        }
        page = await pager.nextPage();
      }

      expect(pager.pageLength).toBeGreaterThan(0);
    });
    it('ML Dev should upload the file from a string path and get just uploaded file with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      // generate a temp file
      const filePath = await createZeroFilledTempFile(1024 * 1024 * 10);

      // upload the file
      const file = await client.files.upload({
        file: filePath,
        config: {displayName: 'generate_file_test.txt'},
      });
      expect(file.name?.startsWith('files/'))
        .withContext(`File name "${file.name}" should start with "files/"}`)
        .toBeTrue();

      // get the file just uploaded
      const getFile = await client.files.get({name: file.name as string});
      console.log('getFile', getFile);
      expect(getFile.name).toBe(file.name);
    });
    it('ML Dev should upload the file from a Blob and get just uploaded file with specified parameters', async () => {
      const client = new GoogleGenAI({
        vertexai: false,
        apiKey: GOOGLE_API_KEY,
        httpOptions,
      });
      // generate a temp file
      const fileBlob = new Blob([new Uint8Array(1024 * 1024 * 30)], {
        type: 'text/plain',
      });

      // upload the file
      const file = await client.files.upload({
        file: fileBlob,
        config: {displayName: 'upload_blob_test.txt'},
      });
      expect(file.name?.startsWith('files/'))
        .withContext(`File name "${file.name}" should start with "files/"}`)
        .toBeTrue();

      // get the file just uploaded
      const getFile = await client.files.get({name: file.name as string});
      console.log('getFile', getFile);
      expect(getFile.name).toBe(file.name);
    });
  });
});
