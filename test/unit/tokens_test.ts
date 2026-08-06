/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient, HttpRequest} from '../../src/_api_client.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import {Tokens} from '../../src/tokens.js';
import * as types from '../../src/types.js';
import {FakeAuth} from '../_fake_auth.js';

function createTokens(): {tokens: Tokens; requestSpy: jasmine.Spy} {
  const apiClient = new ApiClient({
    auth: new FakeAuth(),
    apiKey: 'test-api-key',
    uploader: new CrossUploader(),
    downloader: new CrossDownloader(),
  });
  const requestSpy = spyOn(apiClient, 'request').and.callFake(
    async (_request: HttpRequest) =>
      new types.HttpResponse(new Response(JSON.stringify({name: 'token'}))),
  );
  return {tokens: new Tokens(apiClient), requestSpy};
}

describe('tokens', () => {
  it('generates top-level proto field mask paths for live constraints', async () => {
    const {tokens, requestSpy} = createTokens();

    await tokens.create({
      config: {
        uses: 1,
        liveConnectConstraints: {
          model: 'gemini-2.0-flash-live-001',
          config: {
            responseModalities: [types.Modality.AUDIO],
            systemInstruction: 'You are a helpful assistant.',
            tools: [{functionDeclarations: [{name: 'test_fn'}]}],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            sessionResumption: {},
          },
        },
        lockAdditionalFields: [],
      },
    });

    const body = JSON.parse(requestSpy.calls.mostRecent().args[0].body);
    const fieldMask = body.fieldMask.split(',');

    expect(fieldMask).toContain('model');
    expect(fieldMask).toContain('generation_config');
    expect(fieldMask).toContain('system_instruction');
    expect(fieldMask).toContain('tools');
    expect(fieldMask).toContain('input_audio_transcription');
    expect(fieldMask).toContain('output_audio_transcription');
    expect(fieldMask).toContain('session_resumption');
    expect(fieldMask).not.toContain('tools.0');
    expect(fieldMask).not.toContain('system_instruction.parts');
    expect(fieldMask).not.toContain('generation_config.response_modalities');
  });

  it('maps additional generation config fields to proto field paths', async () => {
    const {tokens, requestSpy} = createTokens();

    await tokens.create({
      config: {
        liveConnectConstraints: {
          model: 'gemini-2.0-flash-live-001',
          config: {
            responseModalities: [types.Modality.AUDIO],
          },
        },
        lockAdditionalFields: ['temperature', 'topK', 'systemInstruction'],
      },
    });

    const body = JSON.parse(requestSpy.calls.mostRecent().args[0].body);
    const fieldMask = body.fieldMask.split(',');

    expect(fieldMask).toContain('generation_config');
    expect(fieldMask).toContain('generation_config.temperature');
    expect(fieldMask).toContain('generation_config.top_k');
    expect(fieldMask).toContain('system_instruction');
    expect(fieldMask).not.toContain('generationConfig.temperature');
    expect(fieldMask).not.toContain('generationConfig.topK');
  });
});
