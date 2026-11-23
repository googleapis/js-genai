/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/client.js';
import * as types from '../../src/types.js';

describe('authTokens.create fieldMask', () => {
  let client: GoogleGenAI;
  let fetchSpy: jasmine.Spy;
  let originalGeminiBaseUrl: string | undefined;

  const TOOLS: types.Tool[] = [
    {functionDeclarations: [{name: 'test_fn', description: 'test'}]},
  ];

  beforeEach(() => {
    originalGeminiBaseUrl = process.env['GOOGLE_GEMINI_BASE_URL'];
    delete process.env['GOOGLE_GEMINI_BASE_URL'];

    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
    fetchSpy = spyOn(global, 'fetch').and.callFake(() =>
      Promise.resolve(
        new Response(JSON.stringify({name: 'auth_tokens/fake'}), {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      ),
    );
  });

  afterEach(() => {
    if (originalGeminiBaseUrl !== undefined) {
      process.env['GOOGLE_GEMINI_BASE_URL'] = originalGeminiBaseUrl;
    } else {
      delete process.env['GOOGLE_GEMINI_BASE_URL'];
    }
  });

  async function createAndGetFieldMask(
    config: types.CreateAuthTokenConfig,
  ): Promise<string | undefined> {
    await client.authTokens.create({
      config: {httpOptions: {apiVersion: 'v1alpha'}, uses: 1, ...config},
    });
    const body = JSON.parse(
      fetchSpy.calls.mostRecent().args[1]?.body as string,
    ) as {fieldMask?: string};
    return body.fieldMask;
  }

  // A FieldMask path cannot index into a repeated field, so `tools` must not
  // become `tools.0`.
  it('uses the top-level name for array fields when lockAdditionalFields is empty', async () => {
    const fieldMask = await createAndGetFieldMask({
      liveConnectConstraints: {
        model: 'gemini-live-2.5-flash-preview',
        config: {responseModalities: [types.Modality.AUDIO], tools: TOOLS},
      },
      lockAdditionalFields: [],
    });

    expect(fieldMask).toEqual(
      'model,generationConfig.responseModalities,tools',
    );
  });

  it('uses the top-level name for array fields with lockAdditionalFields', async () => {
    const fieldMask = await createAndGetFieldMask({
      liveConnectConstraints: {
        model: 'gemini-live-2.5-flash-preview',
        config: {responseModalities: [types.Modality.AUDIO], tools: TOOLS},
      },
      lockAdditionalFields: ['temperature'],
    });

    expect(fieldMask).toEqual(
      'model,generationConfig.responseModalities,tools,generationConfig.temperature',
    );
  });

  it('uses the top-level name for safetySettings', async () => {
    const fieldMask = await createAndGetFieldMask({
      liveConnectConstraints: {
        model: 'gemini-live-2.5-flash-preview',
        config: {
          safetySettings: [
            {
              category: types.HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: types.HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: types.HarmBlockThreshold.BLOCK_NONE,
            },
          ],
        },
      },
      lockAdditionalFields: [],
    });

    const paths = (fieldMask ?? '').split(',');
    expect(paths.filter((p) => p === 'safetySettings').length).toEqual(1);
    expect(paths.filter((p) => p.startsWith('safetySettings.'))).toEqual([]);
  });

  // Non-empty objects still expand one level; empty objects stay bare.
  it('still expands nested objects', async () => {
    const fieldMask = await createAndGetFieldMask({
      liveConnectConstraints: {
        model: 'gemini-live-2.5-flash-preview',
        config: {
          responseModalities: [types.Modality.AUDIO],
          temperature: 0.5,
          inputAudioTranscription: {},
          contextWindowCompression: {triggerTokens: '1000'},
        },
      },
      lockAdditionalFields: [],
    });

    expect(fieldMask).toEqual(
      'model,generationConfig.responseModalities,generationConfig.temperature,inputAudioTranscription,contextWindowCompression.triggerTokens',
    );
  });
});
