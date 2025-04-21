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
      model: 'models/gemini-2.0-flash-live-001',
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
        model: 'models/gemini-2.0-flash-live-001',
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
      model: 'models/gemini-2.0-flash-live-001',
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
      '{"setup":{"model":"models/gemini-2.0-flash-live-001"}}',
    );
    expect(session).toBeDefined();
  });

  it('connect Gemini should fail with setup message using transparent', async () => {
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
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
      (url, headers, callbacks) => {
        // Update the websocket spy instance with callbacks provided by
        // the websocket factory.
        websocket = new FakeWebSocket(url, headers, callbacks);
        spyOn(websocket, 'connect').and.callThrough();
        return websocket;
      },
    );

    try {
      await live.connect({
        model: 'models/gemini-2.0-flash-live-001',
        config: {
          sessionResumption: {
            handle: 'test_handle',
            transparent: true,
          },
        },
        callbacks: {
          onmessage: function (e: types.LiveServerMessage) {
            void e;
          },
        },
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toBe(
          'transparent parameter is not supported in Gemini API.',
        );
      }
    }
  });

  it('connect Vertex should send setup message with session resumption config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
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
      model: 'models/gemini-2.0-flash-live-preview-04-09',
      config: {
        sessionResumption: {
          handle: 'test_handle',
          transparent: true,
        },
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-live-preview-04-09","generationConfig":{"responseModalities":["AUDIO"]},"sessionResumption":{"handle":"test_handle","transparent":true}}}',
    );
    expect(session).toBeDefined();
  });

  it('connect should send setup message with context window compression config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
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
      model: 'models/gemini-2.0-flash-live-001',
      config: {
        contextWindowCompression: {
          triggerTokens: '1000',
          slidingWindow: {
            targetTokens: '10',
          },
        },
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-live-001","generationConfig":{"responseModalities":["AUDIO"]},"contextWindowCompression":{"triggerTokens":"1000","slidingWindow":{"targetTokens":"10"}}}}',
    );
    expect(session).toBeDefined();
  });

  it('connect should send setup message with realtime input config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
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
      model: 'models/gemini-2.0-flash-live-001',
      config: {
        realtimeInputConfig: {
          automaticActivityDetection: {
            startOfSpeechSensitivity:
              types.StartSensitivity.START_SENSITIVITY_HIGH,
            endOfSpeechSensitivity: types.EndSensitivity.END_SENSITIVITY_HIGH,
          },
          activityHandling: types.ActivityHandling.NO_INTERRUPTION,
          turnCoverage: types.TurnCoverage.TURN_INCLUDES_ALL_INPUT,
        },
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-live-001","generationConfig":{"responseModalities":["AUDIO"]},"realtimeInputConfig":{"automaticActivityDetection":{"startOfSpeechSensitivity":"START_SENSITIVITY_HIGH","endOfSpeechSensitivity":"END_SENSITIVITY_HIGH"},"activityHandling":"NO_INTERRUPTION","turnCoverage":"TURN_INCLUDES_ALL_INPUT"}}}',
    );
    expect(session).toBeDefined();
  });

  it('connect should send setup message with top level generation config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
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
      model: 'models/gemini-2.0-flash-live-001',
      config: {
        temperature: 0.5,
        seed: 12,
        topP: 0.9,
        topK: 3,
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-live-001","generationConfig":{"responseModalities":["AUDIO"],"temperature":0.5,"topP":0.9,"topK":3,"seed":12}}}',
    );
    expect(session).toBeDefined();
  });

  it('connect should send setup message with speech config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
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
      model: 'models/gemini-2.0-flash-live-001',
      config: {
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'en-default',
            },
          },
          languageCode: 'en-US',
        },
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-live-001","generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":"en-default"}},"languageCode":"en-US"}}}}',
    );
    expect(session).toBeDefined();
  });

  it('session should return goAway message', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    spyOn(websocketFactory, 'create').and.callFake(
      (url, headers, callbacks) => {
        const websocket = new FakeWebSocket(url, headers, callbacks);
        websocket.send('{"goAway":{"timeLeft":"10s"}}');
        return websocket;
      },
    );

    const incomingMessages: types.LiveServerMessage[] = [];

    await live.connect({
      model: 'models/gemini-2.0-flash-live-001',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          incomingMessages.push(e);
        },
      },
    });

    expect(incomingMessages.length).toBe(2); // Setup message and goAway message.
    const liveServerMessage = incomingMessages[0];
    expect(liveServerMessage.goAway).toBeDefined();
    expect(liveServerMessage.goAway!.timeLeft).toBe('10s');
  });

  it('connect should send setup message with audio transcription config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      vertexai: true,
      project: 'test-project',
      location: 'test-location',
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let websocket = new FakeWebSocket(
      '',
      {},
      {
        onopen: function () {},
        onmessage: function (_e: MessageEvent) {},
        onerror: function (_e: ErrorEvent) {},
        onclose: function (_e: CloseEvent) {},
      },
    );
    spyOn(websocket, 'connect').and.callThrough();
    let websocketSpy = spyOn(websocket, 'send').and.callThrough();
    spyOn(websocketFactory, 'create').and.callFake(
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
      model: 'models/gemini-2.0-flash-live-001',
      config: {
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(websocketSpyCall.args[0]).toBe(
      '{"setup":{"model":"models/gemini-2.0-flash-live-001","generationConfig":{"responseModalities":["AUDIO"]},"inputAudioTranscription":{},"outputAudioTranscription":{}}}',
    );
    expect(session).toBeDefined();
  });

  it('session should return session resumption update message', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    spyOn(websocketFactory, 'create').and.callFake(
      (url, headers, callbacks) => {
        const websocket = new FakeWebSocket(url, headers, callbacks);
        websocket.send(
          '{"sessionResumptionUpdate":{"newHandle": "test_handle", "resumable": true, "lastConsumedClientMessageIndex": "123456789"}}',
        );
        return websocket;
      },
    );

    const incomingMessages: types.LiveServerMessage[] = [];

    await live.connect({
      model: 'models/gemini-2.0-flash-live-001',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          incomingMessages.push(e);
        },
      },
    });

    expect(incomingMessages.length).toBe(2); // Setup message and session resumption update message.
    const liveServerMessage = incomingMessages[0];
    expect(liveServerMessage.sessionResumptionUpdate).toBeDefined();
    expect(liveServerMessage.sessionResumptionUpdate!.newHandle).toBe(
      'test_handle',
    );
    expect(liveServerMessage.sessionResumptionUpdate!.resumable).toBe(true);
    expect(
      liveServerMessage.sessionResumptionUpdate!.lastConsumedClientMessageIndex,
    ).toBe('123456789');
  });
});

// TODO: b/395958466 - Add unit tests for Session.
