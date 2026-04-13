/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/client.js';
import * as types from '../../src/types.js';

describe('Batch Embedding', () => {
  let client: GoogleGenAI;
  let originalGeminiBaseUrl: string | undefined;
  let originalVertexBaseUrl: string | undefined;

  // Constants mirroring python tests
  const MLDEV_EMBEDDING_BATCH_INLINE_OPERATION_NAME =
    'batches/inline-embedding-name';
  const MLDEV_EMBEDDING_BATCH_FILE_OPERATION_NAME =
    'batches/embedding-file-name';
  const DISPLAY_NAME = 'test_batch';
  const MLDEV_EMBEDDING_MODEL = 'gemini-embedding-001';
  const EMBEDDING_FILE_NAME = 'files/rwu0rbghjmh7';
  const INLINED_EMBEDDING_REQUESTS: types.EmbedContentBatch = {
    config: {outputDimensionality: 5},
    contents: [
      {parts: [{text: '1'}]},
      {parts: [{text: '2'}]},
      {parts: [{text: '3'}]},
    ],
  };

  beforeEach(() => {
    originalGeminiBaseUrl = process.env['GOOGLE_GEMINI_BASE_URL'];
    originalVertexBaseUrl = process.env['GOOGLE_VERTEX_BASE_URL'];
    delete process.env['GOOGLE_GEMINI_BASE_URL'];
    delete process.env['GOOGLE_VERTEX_BASE_URL'];

    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
  });

  afterEach(() => {
    if (originalGeminiBaseUrl !== undefined) {
      process.env['GOOGLE_GEMINI_BASE_URL'] = originalGeminiBaseUrl;
    } else {
      delete process.env['GOOGLE_GEMINI_BASE_URL'];
    }
    if (originalVertexBaseUrl !== undefined) {
      process.env['GOOGLE_VERTEX_BASE_URL'] = originalVertexBaseUrl;
    } else {
      delete process.env['GOOGLE_VERTEX_BASE_URL'];
    }
  });

  // Mock response helpers
  const createOkResponse = (name: string) =>
    new Response(
      JSON.stringify({
        name,
        metadata: {
          '@type':
            'type.googleapis.com/google.ai.generativelanguage.v1main.EmbedContentBatch',
          model: `models/${MLDEV_EMBEDDING_MODEL}`,
          displayName: DISPLAY_NAME,
          state: 'BATCH_STATE_PENDING',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        },
      }),
      {status: 200, headers: {'Content-Type': 'application/json'}},
    );

  const getInlineOkResponse = new Response(
    JSON.stringify({
      'name': MLDEV_EMBEDDING_BATCH_INLINE_OPERATION_NAME,
      'metadata': {
        '@type':
          'type.googleapis.com/google.ai.generativelanguage.v1main.EmbedContentBatch',
        'model': 'models/gemini-embedding-001',
        'output': {
          'inlinedResponses': {
            'inlinedResponses': [
              {
                'response': {
                  'embedding': {'values': [0.1, 0.2]},
                  'tokenCount': '1',
                },
              },
            ],
          },
        },
        'createTime': '2025-08-30T00:44:07.900645097Z',
        'endTime': '2025-08-30T00:52:50.970984334Z',
        'updateTime': '2025-08-30T00:52:50.970984280Z',
        'batchStats': {'requestCount': '3', 'successfulRequestCount': '3'},
        'state': 'BATCH_STATE_SUCCEEDED',
        'name': MLDEV_EMBEDDING_BATCH_INLINE_OPERATION_NAME,
      },
      'done': true,
      'response': {
        '@type':
          'type.googleapis.com/google.ai.generativelanguage.v1main.EmbedContentBatchOutput',
        'inlinedResponses': {
          'inlinedResponses': [
            {
              'response': {
                'embedding': {'values': [0.1, 0.2]},
                'tokenCount': '1',
              },
            },
          ],
        },
      },
    }),
    {status: 200, headers: {'Content-Type': 'application/json'}},
  );

  const getFileOkResponse = new Response(
    JSON.stringify({
      'name': MLDEV_EMBEDDING_BATCH_FILE_OPERATION_NAME,
      'metadata': {
        '@type':
          'type.googleapis.com/google.ai.generativelanguage.v1main.EmbedContentBatch',
        'model': 'models/gemini-embedding-001',
        'inputConfig': {'fileName': 'files/7t2beg32d5er'},
        'output': {'responsesFile': 'files/batch-output-file'},
        'createTime': '2025-08-30T00:46:33.378015678Z',
        'endTime': '2025-08-30T00:52:51.317741426Z',
        'updateTime': '2025-08-30T00:52:51.317741386Z',
        'batchStats': {'requestCount': '3', 'successfulRequestCount': '3'},
        'state': 'BATCH_STATE_SUCCEEDED',
        'name': MLDEV_EMBEDDING_BATCH_FILE_OPERATION_NAME,
      },
      'done': true,
      'response': {
        '@type':
          'type.googleapis.com/google.ai.generativelanguage.v1main.EmbedContentBatchOutput',
        'responsesFile': 'files/batch-output-file',
      },
    }),
    {status: 200, headers: {'Content-Type': 'application/json'}},
  );

  describe('Create Batch Embedding', () => {
    it('should create from inlined requests', async () => {
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(createOkResponse('batches/some-id-inline')),
      );
      const batchJob = await client.batches.createEmbeddings({
        model: MLDEV_EMBEDDING_MODEL,
        src: {inlinedRequests: INLINED_EMBEDDING_REQUESTS},
        config: {displayName: DISPLAY_NAME},
      });
      expect(batchJob.name).toMatch(/^batches\/.+/);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const requestArgs = fetchSpy.calls.mostRecent().args;
      expect(requestArgs[0]).toContain(
        `${MLDEV_EMBEDDING_MODEL}:asyncBatchEmbedContent`,
      );
      expect(requestArgs[1]?.method).toEqual('POST');

      const expectedBody = {
        batch: {
          inputConfig: {
            requests: {
              requests: [
                {
                  request: {
                    content: {parts: [{text: '1'}]},
                    outputDimensionality: 5,
                  },
                },
                {
                  request: {
                    content: {parts: [{text: '2'}]},
                    outputDimensionality: 5,
                  },
                },
                {
                  request: {
                    content: {parts: [{text: '3'}]},
                    outputDimensionality: 5,
                  },
                },
              ],
            },
          },
          displayName: DISPLAY_NAME,
        },
      };
      const requestBody = requestArgs[1]?.body;
      expect(typeof requestBody).toBe('string');
      expect(JSON.parse(requestBody as string)).toEqual(expectedBody);
    });

    it('should create from file name', async () => {
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(createOkResponse('batches/some-id-file')),
      );
      const batchJob = await client.batches.createEmbeddings({
        model: MLDEV_EMBEDDING_MODEL,
        src: {fileName: EMBEDDING_FILE_NAME},
        config: {displayName: DISPLAY_NAME},
      });

      expect(batchJob.name).toMatch(/^batches\/.+/);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const requestArgs = fetchSpy.calls.mostRecent().args;
      expect(requestArgs[0]).toContain(
        `${MLDEV_EMBEDDING_MODEL}:asyncBatchEmbedContent`,
      );
      expect(requestArgs[1]?.method).toEqual('POST');

      const expectedBody = {
        batch: {
          inputConfig: {
            file_name: EMBEDDING_FILE_NAME,
          },
          displayName: DISPLAY_NAME,
        },
      };
      const requestBody = requestArgs[1]?.body;
      expect(typeof requestBody).toBe('string');
      expect(JSON.parse(requestBody as string)).toEqual(expectedBody);
    });
  });

  describe('Get Batch Embedding', () => {
    it('should get results for inline source', async () => {
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(getInlineOkResponse),
      );
      const batchJob = await client.batches.get({
        name: MLDEV_EMBEDDING_BATCH_INLINE_OPERATION_NAME,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(batchJob.name).toEqual(
        MLDEV_EMBEDDING_BATCH_INLINE_OPERATION_NAME,
      );
      expect(batchJob.dest?.inlinedEmbedContentResponses).toBeDefined();
      expect(batchJob.dest?.inlinedEmbedContentResponses?.length).toBe(1);
      expect(
        batchJob.dest?.inlinedEmbedContentResponses?.[0].response?.embedding
          ?.values,
      ).toEqual([0.1, 0.2]);
    });

    it('should get results for file source', async () => {
      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(getFileOkResponse),
      );
      const batchJob = await client.batches.get({
        name: MLDEV_EMBEDDING_BATCH_FILE_OPERATION_NAME,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(batchJob.name).toEqual(MLDEV_EMBEDDING_BATCH_FILE_OPERATION_NAME);
      expect(batchJob.dest?.fileName).toEqual('files/batch-output-file');
    });
  });
});
