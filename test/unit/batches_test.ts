/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/client.js';
import * as types from '../../src/types.js';

describe('Batches inlined responses', () => {
  let client: GoogleGenAI;
  let originalGeminiBaseUrl: string | undefined;
  let originalVertexBaseUrl: string | undefined;

  const BATCH_OPERATION = {
    name: 'batches/inline-name',
    metadata: {
      '@type':
        'type.googleapis.com/google.ai.generativelanguage.v1main.GenerateContentBatch',
      model: 'models/gemini-2.5-flash',
      state: 'BATCH_STATE_SUCCEEDED',
      output: {
        inlinedResponses: {
          inlinedResponses: [
            {
              response: {
                candidates: [
                  {
                    content: {
                      role: 'model',
                      parts: [
                        {text: 'thinking', thought: true},
                        {text: 'Hello'},
                        {text: ' world'},
                      ],
                    },
                    finishReason: 'STOP',
                    index: 0,
                  },
                ],
              },
              metadata: {key: 'request-1'},
            },
            {
              error: {code: 400, message: 'Invalid request'},
              metadata: {key: 'request-2'},
            },
          ],
        },
      },
    },
    done: true,
  };

  const okResponse = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });

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

  // The declared type promises the getters, so `text` must work on results.
  it('get returns GenerateContentResponse instances for inlined responses', async () => {
    spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(okResponse(BATCH_OPERATION)),
    );

    const job = await client.batches.get({name: 'batches/inline-name'});
    const inlinedResponses = job.dest?.inlinedResponses ?? [];

    expect(
      inlinedResponses[0].response instanceof types.GenerateContentResponse,
    ).toBeTrue();
    expect(inlinedResponses[0].response?.text).toEqual('Hello world');
    expect(inlinedResponses[0].metadata).toEqual({key: 'request-1'});
  });

  // List items go through the same converter path as get.
  it('list returns GenerateContentResponse instances for inlined responses', async () => {
    spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(okResponse({operations: [BATCH_OPERATION]})),
    );

    const pager = await client.batches.list();
    const response = pager.page[0].dest?.inlinedResponses?.[0].response;

    expect(response instanceof types.GenerateContentResponse).toBeTrue();
    expect(response?.text).toEqual('Hello world');
  });

  // An entry that holds only an error must not gain a response object.
  it('leaves error-only inlined responses without a response', async () => {
    spyOn(global, 'fetch').and.returnValue(
      Promise.resolve(okResponse(BATCH_OPERATION)),
    );

    const job = await client.batches.get({name: 'batches/inline-name'});
    const inlinedResponses = job.dest?.inlinedResponses ?? [];

    expect(inlinedResponses[1].response).toBeUndefined();
    expect(inlinedResponses[1].error?.message).toEqual('Invalid request');
    expect(inlinedResponses[1].metadata).toEqual({key: 'request-2'});
    expect(
      inlinedResponses[0].response instanceof types.GenerateContentResponse,
    ).toBeTrue();
  });
});
