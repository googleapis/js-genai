/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {NodeWebSocketFactory} from '../../src/node/_node_websocket';
import {ApiClient} from '../../src/_api_client';
import {FakeAuth} from '../../src/_fake_auth';
import {Live} from '../../src/live';
import {CrossUploader} from '../../src/cross/_cross_uploader';


describe('live', () => {
  it('create a websocket', async () => {
    console.log('hello?')
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const live = new Live(apiClient, new FakeAuth(), new NodeWebSocketFactory());
  });
});
