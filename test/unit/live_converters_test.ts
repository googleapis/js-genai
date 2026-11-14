/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../../src/_api_client.js';
import * as converters from '../../src/converters/_live_converters.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import * as types from '../../src/types.js';
import {FakeAuth} from '../_fake_auth.js';

const CONFIG = {
  responseModalities: [types.Modality.AUDIO],
  historyConfig: {initialHistoryInClientContent: true},
};

describe('live converters historyConfig', () => {
  // Pins that LiveConnectConfig.historyConfig reaches setup.historyConfig.
  it('liveConnectParametersToMldev sends historyConfig in setup', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });

    const result = converters.liveConnectParametersToMldev(apiClient, {
      model: 'models/gemini-live-2.5-flash-preview',
      config: CONFIG,
      callbacks: {onmessage: () => {}},
    });

    expect(result['setup']).toEqual(
      jasmine.objectContaining({
        historyConfig: {initialHistoryInClientContent: true},
      }),
    );
  });

  it('liveConnectParametersToVertex sends historyConfig in setup', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      project: 'test-project',
      location: 'us-central1',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });

    const result = converters.liveConnectParametersToVertex(apiClient, {
      model: 'gemini-live-2.5-flash-preview',
      config: CONFIG,
      callbacks: {onmessage: () => {}},
    });

    expect(result['setup']).toEqual(
      jasmine.objectContaining({
        historyConfig: {initialHistoryInClientContent: true},
      }),
    );
  });

  it('omits historyConfig from setup when it is not set', () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });

    const result = converters.liveConnectParametersToMldev(apiClient, {
      model: 'models/gemini-live-2.5-flash-preview',
      config: {responseModalities: [types.Modality.AUDIO]},
      callbacks: {onmessage: () => {}},
    });

    expect(result['setup']).not.toEqual(
      jasmine.objectContaining({historyConfig: jasmine.anything()}),
    );
  });
});
