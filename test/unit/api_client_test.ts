/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Readable} from 'stream';

import {
  ApiClient,
  includeExtraBodyToRequestInit,
} from '../../src/_api_client.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import * as types from '../../src/types.js';
import {FakeAuth} from '../_fake_auth.js';

const fetchOkOptions = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'some-url',
};

const fetch500Options = {
  status: 500,
  statusText: 'Internal Server Error',
  ok: false,
  headers: {'Content-Type': 'application/json'},
  url: 'some-url',
};

const fetch400Options = {
  status: 400,
  statusText: 'Bad Request',
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

describe('processStreamResponse', () => {
  const apiClient = new ApiClient({
    auth: new FakeAuth(),
    apiKey: 'test-api-key',
    uploader: new CrossUploader(),
    downloader: new CrossDownloader(),
  });

  it('should throw an error if the chunk does not start with the data prefix', async () => {
    const invalidChunk = 'invalid chunk';
    const stream = new Readable();
    stream.push(invalidChunk);
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);

    const generator = apiClient.processStreamResponse(response);

    await expectAsync(generator.next()).toBeRejectedWithError(
      'Incomplete JSON segment at the end',
    );
  });

  it('should throw an error if the chunk cannot be parsed as JSON', async () => {
    const invalidChunk = 'data: invalid chunk';
    const stream = new Readable();
    stream.push(invalidChunk);
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);

    const generator = apiClient.processStreamResponse(response);

    await expectAsync(generator.next()).toBeRejectedWithError(
      'Incomplete JSON segment at the end',
    );
  });

  it('should throw an error if encountering an error while parsing the chunk', async () => {
    const validChunk =
      'data: {"candidates": [{"content": {"parts": [{"text": "The"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n';
    const invalidChunk =
      '{"error": {"code": 500, "message": "Internal error", "status": "INTERNAL"}}';
    const stream = new Readable();
    stream.push(validChunk);
    stream.push(invalidChunk);
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);

    const expectedResponse = {
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
          finishReason: 'STOP' as types.FinishReason,
          index: 0,
        },
      ],
      usageMetadata: {
        promptTokenCount: 8,
        candidatesTokenCount: 1,
        totalTokenCount: 9,
      },
    };
    const generator = apiClient.processStreamResponse(response);
    const resultHttpResponse = await generator.next();
    const result = await resultHttpResponse.value.json();
    expect(result).toEqual(expectedResponse);

    await expectAsync(generator.next()).toBeRejectedWithError(
      'got status: INTERNAL. {"error":{"code":500,"message":"Internal error","status":"INTERNAL"}}',
    );
  });

  it('should yield the json chunk data', async () => {
    const validChunk1 =
      'data: {"candidates": [{"content": {"parts": [{"text": "The"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n';
    const validChunk2 =
      'data: {"candidates": [{"content": {"parts": [{"text": "The"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\r\r';
    const validChunk3 =
      'data: {"candidates": [{"content": {"parts": [{"text": "The"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\r\n\r\n';
    const validChunks = [validChunk1, validChunk2, validChunk3];
    for (const validChunk of validChunks) {
      const stream = new Readable();
      stream.push(validChunk);
      stream.push(null); // signal end of stream
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });
      const response = new Response(readableStream);
      const expectedResponse = {
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
            finishReason: 'STOP' as types.FinishReason,
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 8,
          candidatesTokenCount: 1,
          totalTokenCount: 9,
        },
      };
      const generator = apiClient.processStreamResponse(response);
      const resultHttpResponse = await generator.next();
      const result = await resultHttpResponse.value.json();
      expect(result).toEqual(expectedResponse);
    }
  });

  it('should yield all expected chunks', async () => {
    const chunk1 =
      'data: {"candidates": [{"content": {"parts": [{"text": "One"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n';
    const chunk2 =
      'data: {"candidates": [{"content": {"parts": [{"text": "Two"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\r\r';
    const chunk3 =
      'data: {"candidates": [{"content": {"parts": [{"text": "Three"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\r\n\r\n';
    const chunks = [chunk1, chunk2, chunk3];
    const stream = new Readable();
    for (const chunk of chunks) {
      stream.push(chunk);
    }
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);

    const streamResponse = await apiClient.processStreamResponse(response);

    let count = 0;
    const expectedText = ['One', 'Two', 'Three'];
    for await (const jsonChunk of streamResponse) {
      const typedChunk = new types.GenerateContentResponse();
      const jsonChunkData = await jsonChunk.json();
      Object.assign(typedChunk, jsonChunkData);
      expect(typedChunk.text).toEqual(expectedText[count]);
      count++;
    }
    expect(count).toEqual(3);
  });

  it('should yield all expected chunks with leading whitespace', async () => {
    const chunk1 =
      '\n\ndata: {"candidates": [{"content": {"parts": [{"text": "One"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n';
    const chunk2 =
      '\r\rdata: {"candidates": [{"content": {"parts": [{"text": "Two"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\r\r';
    const chunk3 =
      '\r\n\r\ndata: {"candidates": [{"content": {"parts": [{"text": "Three"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\r\n\r\n';
    const chunks = [chunk1, chunk2, chunk3];
    const stream = new Readable();
    for (const chunk of chunks) {
      stream.push(chunk);
    }
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);

    const streamResponse = await apiClient.processStreamResponse(response);

    let count = 0;
    const expectedText = ['One', 'Two', 'Three'];
    for await (const jsonChunk of streamResponse) {
      const typedChunk = new types.GenerateContentResponse();
      const jsonChunkData = await jsonChunk.json();
      Object.assign(typedChunk, jsonChunkData);
      expect(typedChunk.text).toEqual(expectedText[count]);
      count++;
    }
    expect(count).toEqual(3);
  });

  it('should yield valid json split into multiple chunk data', async () => {
    const validChunk1 =
      'data: {"candidates": [{"content": {"parts": [{"text": "The"}],"role": "model"},"finishReason": "STOP","index": 0}],';
    const validChunk2 =
      '"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n';
    const stream = new Readable();
    stream.push(validChunk1);
    stream.push(validChunk2);
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);
    const expectedResponse = {
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
    };
    const generator = apiClient.processStreamResponse(response);
    const resultHttpResponse = await generator.next();
    const result = await resultHttpResponse.value.json();
    expect(result).toEqual(expectedResponse);
  });

  it('should yield valid json split into multiple chunk data at the middle of multi-byte character', async () => {
    const encoder = new TextEncoder();
    const fullData = new Uint8Array([
      0xe3, 0x81, 0x93, 0xe3, 0x82, 0x93, 0xe3, 0x81, 0xab, 0xe3, 0x81, 0xa1,
      0xe3, 0x81, 0xaf, 0xf0, 0x9f, 0x98, 0x8a,
    ]);
    const validChunkHead = encoder.encode(
      'data: {"candidates": [{"content": {"parts": [{"text": "',
    );
    const validChunkTail = encoder.encode(
      '"}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n',
    );
    const validChunkHeadMultibytes = fullData.slice(0, 16);
    const validChunkTailMultibytes = fullData.slice(16);

    const stream = new Readable();
    stream.push(Uint8Array.of(...validChunkHead, ...validChunkHeadMultibytes));
    stream.push(Uint8Array.of(...validChunkTailMultibytes, ...validChunkTail));
    stream.push(null); // signal end of stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });
    const response = new Response(readableStream);
    const expectedResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'こんにちは😊',
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
    };
    const generator = apiClient.processStreamResponse(response);
    const resultHttpResponse = await generator.next();
    const result = await resultHttpResponse.value.json();
    expect(result).toEqual(expectedResponse);
  });
});

describe('ApiClient', () => {
  describe('constructor', () => {
    it('should initialize with provided values', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'apikey-from-opts',
        vertexai: false,
        apiVersion: 'v1beta',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(false);
      expect(client.getProject()).toBe('project-from-opts');
      expect(client.getLocation()).toBe('location-from-opts');
      expect(client.getApiKey()).toBe('apikey-from-opts');
      expect(client.getRequestUrl()).toBe(
        'https://generativelanguage.googleapis.com/v1beta',
      );
      expect(client.getApiVersion()).toBe('v1beta');
    });

    it('should initialize with Vertex AI if specified', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'vertex-project',
        location: 'vertex-location',
        vertexai: true,
        apiVersion: 'v1beta1',
        apiKey: 'apikey-from-opts',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(true);
      expect(client.getProject()).toBe('vertex-project');
      expect(client.getLocation()).toBe('vertex-location');
      expect(client.getApiKey()).toBeUndefined(); // API key is ignored when setting opts.vertexai
      expect(client.getRequestUrl()).toBe(
        'https://vertex-location-aiplatform.googleapis.com/v1beta1',
      );
      expect(client.getApiVersion()).toBe('v1beta1');
    });

    it('should not have api key if project/location is provided for vertexai', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'vertex-project',
        location: 'vertex-location',
        vertexai: true,
        apiVersion: 'v1beta1',
        apiKey: 'apikey-from-opts',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      expect(client.isVertexAI()).toBe(true);
      expect(client.getProject()).toBe('vertex-project');
      expect(client.getLocation()).toBe('vertex-location');
      expect(client.getApiKey()).toBeUndefined();
      expect(client.getRequestUrl()).toBe(
        'https://vertex-location-aiplatform.googleapis.com/v1beta1',
      );
      expect(client.getApiVersion()).toBe('v1beta1');
    });
    it('should use default value if not provided', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        apiKey: 'test-api-key',
        project: 'env-project',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      // baseUrl is based on apiVersion
      expect(client.getRequestUrl()).toContain('/v1');
      expect(client.isVertexAI()).toBeFalse();
    });

    it('should initialize with custom base URL and no auth', () => {
      const originalGeminiApiKey = process.env['GEMINI_API_KEY'];
      const originalGoogleApiKey = process.env['GOOGLE_API_KEY'];
      const originalProject = process.env['GOOGLE_CLOUD_PROJECT'];
      const originalLocation = process.env['GOOGLE_CLOUD_LOCATION'];

      delete process.env['GEMINI_API_KEY'];
      delete process.env['GOOGLE_API_KEY'];
      delete process.env['GOOGLE_CLOUD_PROJECT'];
      delete process.env['GOOGLE_CLOUD_LOCATION'];

      try {
        const client = new ApiClient({
          auth: new FakeAuth(),
          vertexai: true,
          httpOptions: {
            baseUrl: 'https://custom-gateway.com',
          },
          uploader: new CrossUploader(),
          downloader: new CrossDownloader(),
        });

        expect(client.isVertexAI()).toBe(true);
        expect(client.getProject()).toBeUndefined();
        expect(client.getLocation()).toBeUndefined();
        expect(client.getApiKey()).toBeUndefined();
        expect(client.getRequestUrl()).toBe(
          'https://custom-gateway.com/v1beta1',
        );
        expect(client.getApiVersion()).toBe('v1beta1');
      } finally {
        process.env['GEMINI_API_KEY'] = originalGeminiApiKey;
        process.env['GOOGLE_API_KEY'] = originalGoogleApiKey;
        process.env['GOOGLE_CLOUD_PROJECT'] = originalProject;
        process.env['GOOGLE_CLOUD_LOCATION'] = originalLocation;
      }
    });

    it('should set websocket protocol to ws when base URL is http', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'apikey-from-opts',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: {
          baseUrl: 'http://custom-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.getWebsocketBaseUrl()).toBe(
        'ws://custom-base-url.googleapis.com/',
      );
    });

    it('should set websocket protocol to wss when base URL is https', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'apikey-from-opts',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: {
          baseUrl: 'https://custom-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.getWebsocketBaseUrl()).toBe(
        'wss://custom-base-url.googleapis.com/',
      );
    });

    it('should override base URL with provided values', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'apikey-from-opts',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: {
          baseUrl: 'https://custom-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(false);
      expect(client.getProject()).toBe('project-from-opts');
      expect(client.getLocation()).toBe('location-from-opts');
      expect(client.getApiKey()).toBe('apikey-from-opts');
      expect(client.getRequestUrl()).toBe(
        'https://custom-base-url.googleapis.com/v1beta',
      );
      expect(client.getWebsocketBaseUrl()).toBe(
        'wss://custom-base-url.googleapis.com/',
      );
      expect(client.getApiVersion()).toBe('v1beta');
    });

    it('should override API version with provided values', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'apikey-from-opts',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: {
          apiVersion: 'v1',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(false);
      expect(client.getProject()).toBe('project-from-opts');
      expect(client.getLocation()).toBe('location-from-opts');
      expect(client.getApiKey()).toBe('apikey-from-opts');
      expect(client.getRequestUrl()).toBe(
        'https://generativelanguage.googleapis.com/v1',
      );
      expect(client.getWebsocketBaseUrl()).toBe(
        'wss://generativelanguage.googleapis.com/',
      );
      expect(client.getApiVersion()).toBe('v1');
    });

    it('should return default HTTP headers', () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'vertex-project',
        location: 'vertex-location',
        vertexai: true,
        apiVersion: 'v1beta1',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(true);
      expect(client.getProject()).toBe('vertex-project');
      expect(client.getLocation()).toBe('vertex-location');
      expect(client.getApiKey()).toBeUndefined(); // API key is ignored when setting opts.vertexai
      expect(client.getRequestUrl()).toBe(
        'https://vertex-location-aiplatform.googleapis.com/v1beta1',
      );
      const headers = client.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toContain('google-genai-sdk/');
      expect(headers['x-goog-api-client']).toContain('google-genai-sdk/');
      expect(client.getApiVersion()).toBe('v1beta1');
    });

    it('should append HTTP headers with duplicate keys', () => {
      const httpOptions: types.HttpOptions = {
        headers: {
          'google-custom-header': 'custom-value',
          'Content-Type': 'text/plain',
        },
      };

      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'test-api-key',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: httpOptions,
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(false);
      expect(client.getProject()).toBe('project-from-opts');
      expect(client.getLocation()).toBe('location-from-opts');
      expect(client.getRequestUrl()).toBe(
        'https://generativelanguage.googleapis.com/v1beta',
      );
      const headers = client.getHeaders();
      expect(headers['Content-Type']).toBe('text/plain');
      expect(headers['User-Agent']).toContain('google-genai-sdk/');
      expect(headers['x-goog-api-client']).toContain('google-genai-sdk/');
      expect(headers['google-custom-header']).toBe('custom-value');
      expect(client.getApiVersion()).toBe('v1beta');
    });

    it('should append default HTTP headers with provided values MLDev', () => {
      const httpOptions: types.HttpOptions = {
        headers: {
          'x-goog-api-key': 'apikey-from-user',
        },
      };

      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'project-from-opts',
        location: 'location-from-opts',
        apiKey: 'apikey-from-opts',
        vertexai: false,
        apiVersion: 'v1beta',
        httpOptions: httpOptions,
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(false);
      expect(client.getProject()).toBe('project-from-opts');
      expect(client.getLocation()).toBe('location-from-opts');
      expect(client.getApiKey()).toBe('apikey-from-opts');
      expect(client.getRequestUrl()).toBe(
        'https://generativelanguage.googleapis.com/v1beta',
      );
      const headers = client.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['x-goog-api-key']).toBe('apikey-from-user');
      expect(headers['User-Agent']).toContain('google-genai-sdk/');
      expect(headers['x-goog-api-client']).toContain('google-genai-sdk/');
      expect(client.getApiVersion()).toBe('v1beta');
    });

    it('should append default HTTP headers with provided values Vertex', () => {
      const httpOptions: types.HttpOptions = {
        headers: {
          Authorization: 'User Token',
        },
      };

      const client = new ApiClient({
        auth: new FakeAuth(),
        project: 'vertex-project',
        location: 'vertex-location',
        vertexai: true,
        apiVersion: 'v1beta1',
        httpOptions: httpOptions,
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      expect(client.isVertexAI()).toBe(true);
      expect(client.getProject()).toBe('vertex-project');
      expect(client.getLocation()).toBe('vertex-location');
      expect(client.getApiKey()).toBeUndefined(); // API key is ignored when setting opts.vertexai
      expect(client.getRequestUrl()).toBe(
        'https://vertex-location-aiplatform.googleapis.com/v1beta1',
      );
      const headers = client.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('User Token');
      expect(headers['User-Agent']).toContain('google-genai-sdk/');
      expect(headers['x-goog-api-client']).toContain('google-genai-sdk/');
      expect(client.getApiVersion()).toBe('v1beta1');
    });
  });

  describe('post/get methods', () => {
    it('should prepend base resource path if vertexai is true and path does not start with "projects/"', async () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        vertexai: true,
        project: 'test-project',
        location: 'test-location',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      spyOn(client, 'getBaseResourcePath').and.returnValue(
        'base-resource-path',
      );
      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: 'test-path',
        body: JSON.stringify({data: 'test'}),
        httpMethod: 'POST',
      });
      const fetchArgs = (global.fetch as jasmine.Spy).calls.first().args;
      expect(fetchArgs[0]).toContain('base-resource-path');
      expect(client.getBaseResourcePath).toHaveBeenCalled();
    });
    it('should append query parameters to URL', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams: Record<string, string> = {
        'param1': 'value1',
        'param2': 'value2',
      };
      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'GET',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        jasmine.stringMatching(/param1=value1&param2=value2/),
        jasmine.any(Object),
      );
    });
    it('should throw an error if request body is not empty for GET request', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      await client
        .request({
          path: 'test-path',
          body: JSON.stringify({data: 'test'}),
          httpMethod: 'GET',
        })
        .catch((e) => {
          expect(e.message).toEqual(
            'Request body should be empty for GET request, but got non empty request body',
          );
        });
    });
    it('should include AbortSignal when timeout is set', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {timeout: 1000},
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({path: 'test-path', httpMethod: 'POST'});
      const fetchArgs = fetchSpy.calls.allArgs();
      // @ts-expect-error TS2532: Object is possibly 'undefined'.
      expect(fetchArgs[0][1].signal instanceof AbortSignal).toBeTrue();
      // @ts-expect-error TS2532: Object is possibly 'undefined'.
      expect(fetchArgs[0][1].signal.aborted).toBeFalse();
    });
    it('should include AbortSignal when AbortSignal is set from request', async () => {
      const externalAbortController = new AbortController();
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: 'test-path',
        httpMethod: 'POST',
        abortSignal: externalAbortController.signal,
      });

      externalAbortController.abort();

      const fetchArgs = fetchSpy.calls.allArgs();
      // @ts-expect-error TS2532: Object is possibly 'undefined'.
      expect(fetchArgs[0][1].signal instanceof AbortSignal).toBeTrue();
      // @ts-expect-error TS2532: Object is possibly 'undefined'.
      expect(fetchArgs[0][1].signal.aborted).toBeTrue();
    });
    it('should apply requestHttpOptions when provided', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams: Record<string, string> = {
        'param1': 'value1',
        'param2': 'value2',
      };
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const mockTimer = jasmine.createSpyObj('timeout', ['unref']);
      const timeoutSpy = spyOn(global, 'setTimeout').and.returnValue(mockTimer);

      await client.request({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'GET',
        httpOptions: {
          baseUrl: 'https://custom-request-base-url.googleapis.com',
          apiVersion: 'v1alpha',
          timeout: 1001,
          headers: {'google-custom-header': 'custom-header-value'},
        },
      });

      const fetchArgs = fetchSpy.calls.first().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      const timeoutArgs = timeoutSpy.calls.first().args;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('test-api-key');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('google-custom-header')).toBe('custom-header-value');
      expect(timeoutArgs[1]).toEqual(1001);
      expect(headers.get('X-Server-Timeout')).toBe('2'); // Rounds up to 2s.
      expect(fetchArgs[0]).toEqual(
        'https://custom-request-base-url.googleapis.com/v1alpha/test-path?param1=value1&param2=value2',
      );
      expect(mockTimer.unref).toHaveBeenCalled();
    });
    it('should set bearer token for vertexai', async () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        apiKey: 'test-api-key',
        vertexai: true,
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams: Record<string, string> = {
        'param1': 'value1',
        'param2': 'value2',
      };
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );

      await client.request({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'GET',
      });

      const fetchArgs = fetchSpy.calls.first().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer token');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
    });
    it('should merge request http options and client http options', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams: Record<string, string> = {
        'param1': 'value1',
        'param2': 'value2',
      };
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const timeoutSpy = spyOn(global, 'setTimeout');

      await client.request({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'GET',
        httpOptions: {
          headers: {'google-custom-header': 'custom-header-value'},
          timeout: 1001,
          apiVersion: 'v1alpha',
        },
      });

      const fetchArgs = fetchSpy.calls.first().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('test-api-key');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('google-custom-header')).toBe('custom-header-value');
      const timeoutArgs = timeoutSpy.calls.first().args;
      expect(timeoutArgs[1]).toEqual(1001);
      expect(fetchArgs[0]).toEqual(
        'https://custom-client-base-url.googleapis.com/v1alpha/test-path?param1=value1&param2=value2',
      );
    });
    it('should not override the client http options permanently', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
          apiVersion: 'v1beta1',
          timeout: 1000,
          headers: {'google-custom-header': 'custom-header-value'},
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams: Record<string, string> = {
        'param1': 'value1',
        'param2': 'value2',
      };
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const timeoutSpy = spyOn(global, 'setTimeout');

      await client.request({
        path: 'test-path',
        queryParams: queryParams,
        httpOptions: {
          baseUrl: 'https://custom-request-base-url.googleapis.com',
          apiVersion: 'v1alpha',
          timeout: 1002,
          headers: {'google-custom-header': 'custom-header-request-value'},
        },
        httpMethod: 'GET',
      });

      const fetchArgs = fetchSpy.calls.mostRecent().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('test-api-key');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('google-custom-header')).toBe(
        'custom-header-request-value',
      );
      const timeoutArgs = timeoutSpy.calls.mostRecent().args;
      expect(timeoutArgs[1]).toEqual(1002);
      expect(fetchArgs[0]).toEqual(
        'https://custom-request-base-url.googleapis.com/v1alpha/test-path?param1=value1&param2=value2',
      );

      await client.request({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'GET',
      });

      const secondFetchArgs = fetchSpy.calls.mostRecent().args;
      const secondRequestInit = fetchArgs[1] as RequestInit;
      const secondHeaders = secondRequestInit.headers as Headers;
      expect(secondHeaders.get('Content-Type')).toBe('application/json');
      expect(secondHeaders.get('x-goog-api-key')).toBe('test-api-key');
      expect(secondHeaders.get('User-Agent')).toContain('google-genai-sdk/');
      expect(secondHeaders.get('x-goog-api-client')).toContain(
        'google-genai-sdk/',
      );
      expect(secondHeaders.get('google-custom-header')).toBe(
        'custom-header-request-value',
      );
      const secondTimeoutArgs = timeoutSpy.calls.mostRecent().args;
      expect(secondTimeoutArgs[1]).toEqual(1000);
      expect(secondFetchArgs[0]).toEqual(
        'https://custom-client-base-url.googleapis.com/v1beta1/test-path?param1=value1&param2=value2',
      );
    });
    it('should use baseUrl and path correctly when apiVersion is set to empty string', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const json = {data: 'test'};
      await client.request({
        path: 'test-path/shouldBeUsedVersion',
        body: JSON.stringify(json),
        httpOptions: {
          apiVersion: '',
          headers: {'google-custom-header': 'custom-header-request-value'},
        },
        httpMethod: 'POST',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-client-base-url.googleapis.com/test-path/shouldBeUsedVersion',
        jasmine.any(Object),
      );
    });
    it('should use baseUrl and path correctly when apiVersion is set to empty string and baseUrl ends with a slash', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com/',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const json = {data: 'test'};
      await client.request({
        path: 'test-path/shouldBeUsedVersion',
        body: JSON.stringify(json),
        httpOptions: {
          apiVersion: '',
          headers: {'google-custom-header': 'custom-header-request-value'},
        },
        httpMethod: 'POST',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-client-base-url.googleapis.com/test-path/shouldBeUsedVersion',
        jasmine.any(Object),
      );
    });
    it('should use baseUrl when path and apiVersion are both set to empty string in the request http options', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: '',
        body: 'test-content-string',
        httpOptions: {
          apiVersion: '',
          baseUrl:
            'https://custom-client-base-url-set-in-request-path.googleapis.com/test-path/shouldBeUsedVersion',
          headers: {'google-custom-header': 'custom-header-request-value'},
        },
        httpMethod: 'POST',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-client-base-url-set-in-request-path.googleapis.com/test-path/shouldBeUsedVersion',
        jasmine.any(Object),
      );
    });
    it('should consutruct correct url when path, baseUrl and apiVersion are set.', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl:
            'https://custom-client-base-url-set-in-client-options.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });

      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: 'custom-correct-path',
        body: 'test-content-string',
        httpOptions: {
          apiVersion: 'custom-correct-version',
          baseUrl:
            'https://custom-client-base-url-set-in-request.googleapis.com',
          headers: {'google-custom-header': 'custom-header-request-value'},
        },
        httpMethod: 'POST',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-client-base-url-set-in-request.googleapis.com/custom-correct-version/custom-correct-path',
        jasmine.any(Object),
      );
    });
    it('should return HttpResponse with proper headers', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const customHeaders = {
        'content-type': 'application/json',
        'x-custom-header': 'custom-value',
      };
      const customResponse = new Response(
        JSON.stringify(mockGenerateContentResponse),
        {
          status: 200,
          statusText: 'OK',
          headers: customHeaders,
        },
      );
      spyOn(global, 'fetch').and.returnValue(Promise.resolve(customResponse));

      const postResponse = await client.request({
        path: 'test-path',
        httpMethod: 'GET',
      });

      expect(postResponse instanceof types.HttpResponse).toBeTrue();
      expect(postResponse.headers).toEqual(customHeaders);
      expect(postResponse.headers?.['x-custom-header']).toBe('custom-value');
    });

    it('should merge clientOptions.httpOptions.extraBody into request body', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          extraBody: {clientExtra: 'clientValue'},
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: 'test-path',
        body: JSON.stringify({original: 'originalValue'}),
        httpMethod: 'POST',
      });
      const fetchArgs = fetchSpy.calls.first().args;
      const requestBody = JSON.parse(fetchArgs[1]?.body as string);
      expect(requestBody).toEqual({
        original: 'originalValue',
        clientExtra: 'clientValue',
      });
    });

    it('should merge request.httpOptions.extraBody and take precedence over clientOptions', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          extraBody: {clientExtra: 'clientValue', commonKey: 'clientCommon'},
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.request({
        path: 'test-path',
        body: JSON.stringify({original: 'originalValue'}),
        httpMethod: 'POST',
        httpOptions: {
          extraBody: {requestExtra: 'requestValue', commonKey: 'requestCommon'},
        },
      });
      const fetchArgs = fetchSpy.calls.first().args;
      const requestBody = JSON.parse(fetchArgs[1]?.body as string);
      expect(requestBody).toEqual({
        original: 'originalValue',
        clientExtra: 'clientValue', // This remains because request.httpOptions is merged with clientOptions
        requestExtra: 'requestValue',
        commonKey: 'requestCommon', // request commonKey overwrites client commonKey
      });
    });
  });
  it('should construct correct URL for public API calls', async () => {
    const client = new ApiClient({
      auth: new FakeAuth('test-api-key'),
      apiKey: 'test-api-key',
      httpOptions: {
        baseUrl: 'https://custom-client-base-url.googleapis.com',
      },
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });

    spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(
          JSON.stringify(mockGenerateContentResponse),
          fetchOkOptions,
        ),
      ),
    );

    const testPath = 'test-public-api-path';
    const apiVersion = 'v1';
    await client.request({
      path: testPath,
      httpMethod: 'GET',
      httpOptions: {
        apiVersion: apiVersion,
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `https://custom-client-base-url.googleapis.com/${apiVersion}/${testPath}`,
      jasmine.any(Object),
    );
  });
  it('should not prepend project/location to path if path already contains it for requestStream', async () => {
    const client = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(
          JSON.stringify(mockGenerateContentResponse),
          fetchOkOptions,
        ),
      ),
    );
    await client.requestStream({
      path: 'projects/test-project/locations/test-location/test-path',
      httpMethod: 'POST',
    });
    const fetchArgs = fetchSpy.calls.first().args;
    expect(fetchArgs[0]).toBe(
      'https://test-location-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/test-location/test-path?alt=sse',
    );
  });
  it('should not prepend project/location to path if path already contains it for request', async () => {
    const client = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(
          JSON.stringify(mockGenerateContentResponse),
          fetchOkOptions,
        ),
      ),
    );
    await client.request({
      path: 'projects/test-project/locations/test-location/test-path',
      httpMethod: 'POST',
    });
    const fetchArgs = fetchSpy.calls.first().args;
    expect(fetchArgs[0]).toBe(
      'https://test-location-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/test-location/test-path',
    );
  });
  it('should not prepend project/location to path if path starts with publishers/google/models for request', async () => {
    const client = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(
        new Response(
          JSON.stringify(mockGenerateContentResponse),
          fetchOkOptions,
        ),
      ),
    );
    await client.request({
      path: 'publishers/google/models/test-model',
      httpMethod: 'GET',
    });
    const fetchArgs = fetchSpy.calls.first().args;
    expect(fetchArgs[0]).toBe(
      'https://test-location-aiplatform.googleapis.com/v1beta1/publishers/google/models/test-model',
    );
  });
  describe('requestStream', () => {
    it('should throw ApiError if response is 500', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify({'error': 'Internal Server Error'}),
            fetch500Options,
          ),
        ),
      );
      await client
        .requestStream({path: 'test-path', httpMethod: 'POST'})
        .catch((e) => {
          expect(e.name).toEqual('ApiError');
          expect(e.message).toContain('Internal Server Error');
          expect(e.status).toEqual(500);
        });
    });
    it('should throw ApiError if response is 400', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify({'error': 'Bad Request'}),
            fetch400Options,
          ),
        ),
      );
      await client
        .requestStream({path: 'test-path', httpMethod: 'POST'})
        .catch((e) => {
          expect(e.name).toEqual('ApiError');
          expect(e.message).toContain('Bad Request');
          expect(e.status).toEqual(400);
        });
    });
    it('should yield data if response is ok', async () => {
      const validChunk1 =
        'data: {"candidates": [{"content": {"parts": [{"text": "The"}],"role": "model"},"finishReason": "STOP","index": 0}],';
      const validChunk2 =
        '"usageMetadata": {"promptTokenCount": 8,"candidatesTokenCount": 1,"totalTokenCount": 9}}\n\n';
      const stream = new Readable();
      stream.push(validChunk1);
      stream.push(validChunk2);
      stream.push(null); // signal end of stream
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });
      const response = new Response(readableStream, fetchOkOptions);
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      spyOn(global, 'fetch').and.returnValue(Promise.resolve(response));
      const generator = await client.requestStream({
        path: 'test-path',
        httpMethod: 'POST',
      });
      const resultHttpResponse = await generator.next();
      const result = await resultHttpResponse.value.json();
      expect(result).toEqual({
        candidates: [
          {
            content: {parts: [{text: 'The'}], role: 'model'},
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 8,
          candidatesTokenCount: 1,
          totalTokenCount: 9,
        },
      });
    });
    it('should use global endpoint for api keys on vertexai', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        vertexai: true,
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.requestStream({path: 'test-path', httpMethod: 'POST'});
      const fetchArgs = fetchSpy.calls.first().args;
      expect(fetchArgs[0]).toBe(
        'https://aiplatform.googleapis.com/v1beta1/test-path?alt=sse',
      );
    });
    it('should use project resource path when project is provided', async () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        vertexai: true,
        project: 'test-project',
        location: 'test-location',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.requestStream({path: 'test-path', httpMethod: 'POST'});
      const fetchArgs = fetchSpy.calls.first().args;
      expect(fetchArgs[0]).toBe(
        'https://test-location-aiplatform.googleapis.com/v1beta1/projects' +
          '/test-project/locations/test-location/test-path?alt=sse',
      );
    });
    it('should include AbortSignal when timeout is set', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {timeout: 1000},
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      await client.requestStream({path: 'test-path', httpMethod: 'POST'});
      const fetchArgs = fetchSpy.calls.first().args;
      expect(fetchArgs[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/test-path?alt=sse',
      );
      // @ts-expect-error TS2532: Object is possibly 'undefined'.
      expect(fetchArgs[1].signal instanceof AbortSignal).toBeTrue();
      // @ts-expect-error TS2532: Object is possibly 'undefined'.
      expect(fetchArgs[1].signal.aborted).toBeFalse();
    });
    it('should apply requestHttpOptions when provided', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const timeoutSpy = spyOn(global, 'setTimeout');

      await client.requestStream({
        path: 'test-path',
        httpMethod: 'POST',
        httpOptions: {
          baseUrl: 'https://custom-request-base-url.googleapis.com',
          headers: {'google-custom-header': 'custom-header-value'},
          apiVersion: 'v1alpha',
          timeout: 1001,
        },
      });

      const fetchArgs = fetchSpy.calls.first().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('test-api-key');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('google-custom-header')).toBe('custom-header-value');
      const timeoutArgs = timeoutSpy.calls.first().args;
      expect(timeoutArgs[1]).toEqual(1001);
      expect(fetchArgs[0]).toEqual(
        'https://custom-request-base-url.googleapis.com/v1alpha/test-path?alt=sse',
      );
    });
    it('should set bearer token for vertexai', async () => {
      const client = new ApiClient({
        auth: new FakeAuth(),
        apiKey: 'test-api-key',
        vertexai: true,
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );

      await client.requestStream({path: 'test-path', httpMethod: 'POST'});

      const fetchArgs = fetchSpy.calls.first().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer token');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
    });
    it('should merge request http options and client http options', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams = {'param1': 'value1', 'param2': 'value2'};
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const timeoutSpy = spyOn(global, 'setTimeout');

      await client.requestStream({
        path: 'test-path',
        queryParams: queryParams,
        httpOptions: {
          headers: {'google-custom-header': 'custom-header-value'},
          timeout: 1001,
          apiVersion: 'v1alpha',
        },
        httpMethod: 'GET',
      });

      const fetchArgs = fetchSpy.calls.first().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('test-api-key');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('google-custom-header')).toBe('custom-header-value');
      const timeoutArgs = timeoutSpy.calls.first().args;
      expect(timeoutArgs[1]).toEqual(1001);
      expect(fetchArgs[0]).toEqual(
        'https://custom-client-base-url.googleapis.com/v1alpha/test-path?alt=sse',
      );
    });
    it('should not override the client http options permanently', async () => {
      const client = new ApiClient({
        auth: new FakeAuth('test-api-key'),
        apiKey: 'test-api-key',
        httpOptions: {
          baseUrl: 'https://custom-client-base-url.googleapis.com',
          apiVersion: 'v1beta1',
          timeout: 1000,
          headers: {'google-custom-header': 'custom-header-value'},
        },
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
      });
      const queryParams: Record<string, string> = {
        'param1': 'value1',
        'param2': 'value2',
      };
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify(mockGenerateContentResponse),
            fetchOkOptions,
          ),
        ),
      );
      const timeoutSpy = spyOn(global, 'setTimeout');

      await client.requestStream({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'POST',
        httpOptions: {
          baseUrl: 'https://custom-request-base-url.googleapis.com',
          apiVersion: 'v1alpha',
          timeout: 1002,
          headers: {'google-custom-header': 'custom-header-request-value'},
        },
      });

      const fetchArgs = fetchSpy.calls.mostRecent().args;
      const requestInit = fetchArgs[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('x-goog-api-key')).toBe('test-api-key');
      expect(headers.get('User-Agent')).toContain('google-genai-sdk/');
      expect(headers.get('x-goog-api-client')).toContain('google-genai-sdk/');
      expect(headers.get('google-custom-header')).toBe(
        'custom-header-request-value',
      );
      const timeoutArgs = timeoutSpy.calls.mostRecent().args;
      expect(timeoutArgs[1]).toEqual(1002);
      expect(fetchArgs[0]).toEqual(
        'https://custom-request-base-url.googleapis.com/v1alpha/test-path?alt=sse',
      );

      await client.requestStream({
        path: 'test-path',
        queryParams: queryParams,
        httpMethod: 'POST',
      });

      const secondFetchArgs = fetchSpy.calls.mostRecent().args;
      const secondRequestInit = fetchArgs[1] as RequestInit;
      const secondHeaders = secondRequestInit.headers as Headers;
      expect(secondHeaders.get('Content-Type')).toBe('application/json');
      expect(secondHeaders.get('x-goog-api-key')).toBe('test-api-key');
      expect(secondHeaders.get('User-Agent')).toContain('google-genai-sdk/');
      expect(secondHeaders.get('x-goog-api-client')).toContain(
        'google-genai-sdk/',
      );
      expect(secondHeaders.get('google-custom-header')).toBe(
        'custom-header-request-value',
      );
      const secondTimeoutArgs = timeoutSpy.calls.mostRecent().args;
      expect(secondTimeoutArgs[1]).toEqual(1000);
      expect(secondFetchArgs[0]).toEqual(
        'https://custom-client-base-url.googleapis.com/v1beta1/test-path?alt=sse',
      );
    });
  });
});

const extraBodyTestCases = [
  {
    testName: 'should not modify requestInit.body if extraBody is null',
    initialBody: JSON.stringify({a: 1}),
    extraBody: null,
    expectedBody: JSON.stringify({a: 1}),
    expectedWarning: undefined,
  },
  {
    testName: 'should not modify requestInit.body if extraBody is empty',
    initialBody: JSON.stringify({a: 1}),
    extraBody: {},
    expectedBody: JSON.stringify({a: 1}),
    expectedWarning: undefined,
  },
  {
    testName: 'should not modify requestInit.body and warn if body is a Blob',
    initialBody: new Blob(['test data']),
    extraBody: {b: 2},
    expectedBody: new Blob(['test data']),
    expectedWarning:
      'includeExtraBodyToRequestInit: extraBody provided but current request body is a Blob. extraBody will be ignored as merging is not supported for Blob bodies.',
  },
  {
    testName:
      'should set requestInit.body to extraBody if original body is empty string',
    initialBody: '',
    extraBody: {b: 2},
    expectedBody: JSON.stringify({b: 2}),
    expectedWarning: undefined,
  },
  {
    testName:
      'should set requestInit.body to extraBody if original body is undefined',
    initialBody: undefined,
    extraBody: {b: 2},
    expectedBody: JSON.stringify({b: 2}),
    expectedWarning: undefined,
  },
  {
    testName: 'should merge extraBody into valid JSON string body',
    initialBody: JSON.stringify({a: 1}),
    extraBody: {b: 2, c: {d: 3}},
    expectedBody: JSON.stringify({a: 1, b: 2, c: {d: 3}}),
    expectedWarning: undefined,
  },
  {
    testName: 'should overwrite existing keys in valid JSON string body',
    initialBody: JSON.stringify({a: 1, b: 0}),
    extraBody: {b: 2, c: 3},
    expectedBody: JSON.stringify({a: 1, b: 2, c: 3}),
    expectedWarning: undefined,
  },
  {
    testName: 'should perform deep merge correctly',
    initialBody: JSON.stringify({a: 1, c: {d: 3, e: 4}}),
    extraBody: {b: 2, c: {d: 5, f: 6}},
    expectedBody: JSON.stringify({a: 1, b: 2, c: {d: 5, e: 4, f: 6}}),
    expectedWarning: undefined,
  },
  {
    testName: 'should warn and overwrite on type mismatch during merge',
    initialBody: JSON.stringify({a: 1}),
    extraBody: {a: 'string'},
    expectedBody: JSON.stringify({a: 'string'}),
    expectedWarning:
      'includeExtraBodyToRequestInit:deepMerge: Type mismatch for key "a". Original type: number, New type: string. Overwriting.',
  },
  {
    testName: 'should not modify body and warn if original body is JSON array',
    initialBody: JSON.stringify([1, 2]),
    extraBody: {a: 1},
    expectedBody: JSON.stringify([1, 2]),
    expectedWarning:
      'includeExtraBodyToRequestInit: Original request body is valid JSON but not a non-array object. Skip applying extraBody to the request body.',
  },
  {
    testName:
      'should not modify body and warn if original body is JSON primitive',
    initialBody: JSON.stringify(123),
    extraBody: {a: 1},
    expectedBody: JSON.stringify(123),
    expectedWarning:
      'includeExtraBodyToRequestInit: Original request body is valid JSON but not a non-array object. Skip applying extraBody to the request body.',
  },
  {
    testName:
      'should not modify body and warn if original body is invalid JSON string',
    initialBody: 'invalid json',
    extraBody: {a: 1},
    expectedBody: 'invalid json',
    expectedWarning:
      'includeExtraBodyToRequestInit: Original request body is not valid JSON. Skip applying extraBody to the request body.',
  },
  {
    testName: 'should handle extraBody with null values',
    initialBody: JSON.stringify({a: 1}),
    extraBody: {b: null, c: {d: null}},
    expectedBody: JSON.stringify({a: 1, b: null, c: {d: null}}),
    expectedWarning: undefined,
  },
  {
    testName: 'should handle extraBody overwriting with null values',
    initialBody: JSON.stringify({a: 1, b: {c: 2}}),
    extraBody: {b: 'b'},
    expectedBody: JSON.stringify({a: 1, b: 'b'}),
    expectedWarning:
      'includeExtraBodyToRequestInit:deepMerge: Type mismatch for key "b". Original type: object, New type: string. Overwriting.',
  },
  {
    testName:
      'should handle extraBody with undefined values (which get stringified as absent)',
    initialBody: JSON.stringify({a: 1}),
    extraBody: {b: undefined, c: {d: undefined}},
    expectedBody: JSON.stringify({a: 1, c: {}}), // undefined values are not included in JSON.stringify
    expectedWarning: undefined,
  },
];

describe('includeExtraBodyToRequestInit', () => {
  let consoleWarnSpy: jasmine.Spy;

  beforeEach(() => {
    consoleWarnSpy = spyOn(console, 'warn').and.stub(); // or .and.callThrough(); if you want the original to execute
  });

  extraBodyTestCases.forEach(
    ({testName, initialBody, extraBody, expectedBody, expectedWarning}) => {
      it(testName, () => {
        const requestInit: RequestInit = {body: initialBody};
        includeExtraBodyToRequestInit(
          requestInit,
          extraBody as Record<string, unknown>,
        );
        if (
          typeof expectedBody === 'string' &&
          typeof requestInit.body === 'string'
        ) {
          if (expectedBody.startsWith('{') || expectedBody.startsWith('[')) {
            expect(JSON.parse(requestInit.body as string)).toEqual(
              JSON.parse(expectedBody),
            );
          } else {
            expect(requestInit.body).toBe(expectedBody);
          }
        } else {
          expect(requestInit.body).toEqual(expectedBody);
        }
        if (expectedWarning) {
          expect(consoleWarnSpy).toHaveBeenCalledWith(expectedWarning);
        } else {
          expect(consoleWarnSpy).not.toHaveBeenCalled();
        }
      });
    },
  );
});
