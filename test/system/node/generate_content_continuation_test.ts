/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../../src/node/node_client.js';
import {FinishReason, HttpOptions} from '../../../src/types.js';
import {setupTestServer, shutdownTestServer} from '../test_server.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'test-api-key';
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000; // 10 seconds

describe('GenerateContentContinuationTest', () => {
  let testName = '';
  let httpOptions: HttpOptions;

  beforeAll(async () => {
    await setupTestServer();
    jasmine.getEnv().addReporter({
      specStarted: function (result) {
        testName = result.fullName.replace(' ', '.');
      },
    });
  });

  afterAll(async () => {
    await shutdownTestServer();
  });

  beforeEach(() => {
    httpOptions = {headers: {'Test-Name': testName}};
  });

  it('GenerateContentAutomaticContinuationGeminiTest', async () => {
    const client = new GoogleGenAI({
      vertexai: false,
      apiKey: GOOGLE_API_KEY,
      httpOptions,
    });
    const response = await client.models.generateContent({
      model: 'REDACTED',
      contents:
        'Write an exhaustive, multi-chapter textbook on compiler design that is around 40,000 tokens long.',
      config: {
        automaticContinuation: true,
      },
    });

    expect(response).toBeDefined();
    expect(response.candidates).toBeDefined();
    expect(response.candidates![0].finishReason).toBe(FinishReason.STOP);
    expect(response.candidates![0].continuationToken).toBeUndefined();

    const usage = response.usageMetadata;
    const outputTokens =
      (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
    expect(outputTokens).toBeGreaterThan(32768);
  });

  it('GenerateContentAutomaticContinuationVertexTest', async () => {
    const client = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
      httpOptions,
    });
    const response = await client.models.generateContent({
      model: 'REDACTED',
      contents:
        'Write an exhaustive, multi-chapter textbook on compiler design that is around 40,000 tokens long.',
      config: {
        automaticContinuation: true,
      },
    });

    expect(response).toBeDefined();
    expect(response.candidates).toBeDefined();
    expect(response.candidates![0].finishReason).toBe(FinishReason.STOP);
    expect(response.candidates![0].continuationToken).toBeUndefined();

    const usage = response.usageMetadata;
    const outputTokens =
      (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
    expect(outputTokens).toBeGreaterThan(32768);
  });
});
