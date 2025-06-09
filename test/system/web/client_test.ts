/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {fail} from 'assert';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';

import {
  FunctionCallingConfigMode,
  GenerateContentResponse,
} from '../../../src/types.js';
import {GoogleGenAI} from '../../../src/web/web_client.js';
import {createZeroFilledTempFile} from '../../_generate_test_file.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 30 seconds

describe('generateContent', () => {
  it('ML Dev should generate content with specified parameters', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'why is the sky blue?',
      config: {maxOutputTokens: 20, candidateCount: 1},
    });
    expect(response.candidates!.length).toBe(
      1,
      'Expected 1 candidate got ' + response.candidates!.length,
    );
    expect(response.usageMetadata!.candidatesTokenCount).toBeLessThanOrEqual(
      20,
      'Expected candidatesTokenCount to be less than or equal to 20, got ' +
        response.usageMetadata!.candidatesTokenCount,
    );
    console.info(
      'ML Dev should generate content with specified parameters\n',
      response.text,
    );
  });

  it('ML Dev should generate content with system instruction', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
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

  it('ML Dev should generate content without system instruction when responseModalities contains image', async () => {
     const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
     const response = await client.models.generateContent({
       model: 'gemini-2.0-flash-exp',//image modality requires different model
       contents: 'Create an image of a mountain',      
       config: {responseModalities: ['text', 'image'], systemInstruction: 'I say high you say low'},
     });
     const responseText = response.text;
     expect(responseText?.includes('mountain') ?? false).toBe(
       true,
       `Expected response to include "mountain", but got ${responseText}`,
     );
     console.info(
       'ML Dev should generate content without system instruction\n',
       responseText,
     );
   });
  
  it('ML Dev should generate content with given zod schema', async () => {
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
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
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
  it('ML Dev should help build the FunctionDeclaration', async () => {
    const stringArgument = z.object({
      firstString: z.string(),
      secondString: z.string(),
    });
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
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
});

describe('generateContentStream', () => {
  it('ML Dev should stream generate content with specified parameters', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    const response = await client.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: 'why is the sky blue?',
      config: {candidateCount: 1, maxOutputTokens: 200},
    });
    let i = 1;
    let finalChunk: GenerateContentResponse | undefined = undefined;
    console.info(
      'ML Dev should stream generate content with specified parameters',
    );
    for await (const chunk of response) {
      expect(chunk.text).toBeDefined();
      console.info(`stream chunk ${i}`, chunk.text);
      expect(chunk.candidates!.length).toBe(
        1,
        'Expected 1 candidate got ' + chunk.candidates!.length,
      );
      i++;
      finalChunk = chunk;
    }
    expect(finalChunk?.usageMetadata!.candidatesTokenCount).toBeLessThanOrEqual(
      250, // sometimes backend returns a little more than 200 tokens
      'Expected candidatesTokenCount to be less than or equal to 250, got ' +
        finalChunk?.usageMetadata!.candidatesTokenCount,
    );
  });

  it('ML Dev should stream generate content with system instruction', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    const response = await client.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: 'high',
      config: {
        systemInstruction:
          'I say high you say low, and then tell me why is the sky blue.',
        candidateCount: 1,
        maxOutputTokens: 200,
      },
    });
    let i = 1;
    let finalChunk: GenerateContentResponse | undefined = undefined;
    console.info(
      'ML Dev should stream generate content with system instruction',
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
    expect(finalChunk?.usageMetadata!.candidatesTokenCount).toBeLessThanOrEqual(
      250, // sometimes backend returns a little more than 200 tokens
      'Expected candidatesTokenCount to be less than or equal to 250, got ' +
        finalChunk?.usageMetadata!.candidatesTokenCount,
    );
  });
});

describe('generateImages', () => {
  it('ML Dev should generate image with specified parameters', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
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
});

describe('test async performance', () => {
  beforeAll(function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000; // 15 seconds
  });
  it('generate content should complete in less than 10 seconds', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    async function firstAsyncFunc() {
      client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'high',
        config: {
          systemInstruction: 'I say high you say low.',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 5000)); // artificially add 5 seconds delay
    }
    async function secondAsyncFunc() {
      client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'high',
        config: {
          systemInstruction: 'I say high you say low.',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 10000)); // artificially add 10 seconds timeout
    }
    const startTime = performance.now(); // Record start time
    try {
      await Promise.all([firstAsyncFunc(), secondAsyncFunc()]);
    } catch (e) {
      fail('Test failed due to error: ' + e);
    } finally {
      const endTime = performance.now(); // Record end time
      const timeDelta = endTime - startTime;
      expect(timeDelta).toBeLessThanOrEqual(
        10030,
        'Expected timeDelta to be less than or equal to 10030, got ' +
          timeDelta,
      );
    }
  });
  it('stream generate content should complete in less than 10 seconds', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    async function firstAsyncFunc() {
      client.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: 'high',
        config: {
          systemInstruction: 'I say high you say low.',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 5000)); // artificially add 5 seconds delay
    }
    async function secondAsyncFunc() {
      client.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: 'high',
        config: {
          systemInstruction: 'I say high you say low.',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 10000)); // artificially add 10 seconds timeout
    }
    const startTime = performance.now(); // Record start time
    try {
      await Promise.all([firstAsyncFunc(), secondAsyncFunc()]);
    } catch (e) {
      fail('Test failed due to error: ' + e);
    } finally {
      const endTime = performance.now(); // Record end time
      const timeDelta = endTime - startTime;
      expect(timeDelta).toBeLessThanOrEqual(
        10050,
        'Expected timeDelta to be less than or equal to 10050, got ' +
          timeDelta,
      );
    }
  });
});

describe('test forward compatibility', () => {
  it('generate content should not return thought field', async () => {
    const client = new GoogleGenAI({
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      httpOptions: {apiVersion: 'v1alpha'},
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
    expect(JSON.stringify(response)).not.toContain(
      '"thought":true',
      'Expected response to not contain field "thought',
    );
  });
});

describe('countTokens', () => {
  it('ML Dev should count tokens with specified parameters', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});

    const response = await client.models.countTokens({
      model: 'gemini-1.5-flash',
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
});

describe('files', () => {
  it('ML Dev list files with specified parameters', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
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
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
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
  it('ML Dev should fail when provided with a string file path', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
    // generate a temp file
    const filePath = await createZeroFilledTempFile(1024 * 1024 * 10);

    // upload the file
    try {
      await client.files.upload({
        file: filePath,
        config: {displayName: 'generate_file_test.txt'},
      });
    } catch (e) {
      expect((e as Error).message).toBe(
        'File path is not supported in browser uploader.',
      );
    }
  });
  it('ML Dev should upload the file from a Blob and get just uploaded file with specified parameters', async () => {
    const client = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});
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

describe('client initialization', () => {
  it('Vertex AI should fail since no API key provided', async () => {
    expect(
      () =>
        new GoogleGenAI({
          vertexai: true,
          project: GOOGLE_CLOUD_PROJECT,
          location: GOOGLE_CLOUD_LOCATION,
        }),
    ).toThrowError('An API Key must be set when running in a browser');
  });
});
