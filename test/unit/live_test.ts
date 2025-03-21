/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient, SDK_VERSION} from '../../src/_api_client';
import {
  WebSocket,
  WebSocketCallbacks,
  WebSocketFactory,
} from '../../src/_websocket';
import {CrossUploader} from '../../src/cross/_cross_uploader';
import {Live} from '../../src/live';
import * as types from '../../src/types';
import {FakeAuth} from '../_fake_auth';

class FakeWebSocketFactory implements WebSocketFactory {
  create(
    url: string,
    headers: Record<string, string>,
    callbacks: WebSocketCallbacks,
  ) {
    return new FakeWebSocket(url, headers, callbacks);
  }
}

class FakeWebSocket implements WebSocket {
  constructor(
    private readonly url: string,
    private readonly headers: Record<string, string>,
    private callbacks: WebSocketCallbacks,
  ) {}

  connect(): void {
    this.callbacks.onopen();
  }
  send(message: string): void {
    this.callbacks.onmessage({data: message});
  }
  close(): void {
    this.callbacks.onclose('');
  }
  setOnMessageCallback(callback: (e: MessageEvent) => void): void {
    this.callbacks.onmessage = callback;
  }
}

describe('live', () => {
  it('connect uses default callbacks if not provided', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    // Default callbacks are used.
    const session = await live.connect({
      model: 'models/gemini-2.0-flash-exp',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketFactorySpyCall = websocketFactorySpy.calls.all()[0];
    expect(websocketFactorySpyCall.args[0]).toBe(
      'wss://generativelanguage.googleapis.com//ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=test-api-key',
    );
    expect(JSON.stringify(websocketFactorySpyCall.args[1])).toBe(
      `{"content-type":"application/json","user-agent":"google-genai-sdk/${SDK_VERSION} undefined","x-goog-api-client":"google-genai-sdk/${SDK_VERSION} undefined"}`,
    );
    // Check that the onopen callback is wrapped to call the provided callbacks
    // and then resolve the onopen promise. The string is not fully checked to
    // avoid issues with whitespace.
    const onopenString = JSON.stringify(
      websocketFactorySpyCall.args[2].onopen.toString(),
    );
    expect(onopenString).toContain(
      '(_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onopen) === null || _a === void 0 ? void 0 : _a.call(callbacks);',
    );
    expect(onopenString).toContain('onopenResolve({});');
    expect(
      JSON.stringify(websocketFactorySpyCall.args[2].onclose.toString()),
    ).toContain('void e;');
    expect(session).toBeDefined();
  });

  it('connect should rely on provided callbacks', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    try {
      await live.connect({
        model: 'models/gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            throw new Error('custom onopen error');
          },
          onmessage: function (e: types.LiveServerMessage) {
            void e;
          },
        },
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toBe('custom onopen error');
      }
    }
  });

  it('connect should send setup message', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (e: MessageEvent) {
          console.debug(e.data);
        },
        onerror: function (e: ErrorEvent) {
          console.debug(e.message);
        },
        onclose: function (e: CloseEvent) {
          console.debug(e.reason);
        },
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    const websocketFactorySpy = spyOn(websocketFactory, 'create').and.callFake(
      (url, headers, callbacks) => {
        // Update the websocket spy instance with callbacks provided by
        // the websocket factory.
        websocket = new FakeWebSocket(url, headers, callbacks);
        spyOn(websocket, 'connect').and.callThrough();
        websocketSpy = spyOn(websocket, 'send').and.callThrough();
        return websocket;
      },
    );

    const session = await live.connect({
      model: 'models/gemini-2.0-flash-exp',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketFactorySpyCall = websocketFactorySpy.calls.all()[0];
    expect(websocketFactorySpyCall.args[0]).toBe(
      'wss://generativelanguage.googleapis.com//ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=test-api-key',
    );
    expect(JSON.stringify(websocketFactorySpyCall.args[1])).toBe(
      `{"content-type":"application/json","user-agent":"google-genai-sdk/${SDK_VERSION} undefined","x-goog-api-client":"google-genai-sdk/${SDK_VERSION} undefined"}`,
    );
    // Check that the onopen callback is wrapped to call the provided callbacks
    // and then resolve the onopen promise. The string is not fully checked to
    // avoid issues with whitespace.
    const onopenString = JSON.stringify(
      websocketFactorySpyCall.args[2].onopen.toString(),
    );
    expect(onopenString).toContain(
      '(_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onopen) === null || _a === void 0 ? void 0 : _a.call(callbacks);',
    );
    expect(onopenString).toContain('onopenResolve({});');
    expect(
      JSON.stringify(websocketFactorySpyCall.args[2].onerror.toString()),
    ).toContain('void e;');
    expect(
      JSON.stringify(websocketFactorySpyCall.args[2].onclose.toString()),
    ).toContain('void e;');
    expect(websocket.connect).toHaveBeenCalled();
    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-exp"}}',
    );
    expect(session).toBeDefined();
  });

  it('connect should throw error if httpOptions is set', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    try {
      await live.connect({
        model: 'models/gemini-2.0-flash-exp',
        config: {httpOptions: {baseUrl: 'test-proxy'}},
        callbacks: {
          onmessage: function(e: types.LiveServerMessage) {
            void e;
          },
        },
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log('handle error')
        expect(e.message).toBe(
            'httpOptions is not supported in LiveConnectParameters.config');
      }
    }
  });
});

// TODO: b/395958466 - Add unit tests for Session.
