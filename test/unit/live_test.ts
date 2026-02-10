/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient, SDK_VERSION} from '../../src/_api_client.js';
import {WebSocketCallbacks} from '../../src/_websocket.js';
import * as converters from '../../src/converters/_live_converters.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import {Live} from '../../src/live.js';
import {mcpToTool} from '../../src/mcp/_mcp.js';
import * as types from '../../src/types.js';
import {FakeAuth} from '../_fake_auth.js';
import {FakeWebSocket, FakeWebSocketFactory} from '../_fake_websocket.js';

import {spinUpPrintingServer} from './test_mcp_server.js';

describe('live', () => {
  it('connect uses default callbacks if not provided', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    // Default callbacks are used.
    const session = await live.connect({
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(websocketFactorySpyCall.args[1]).toEqual({
      'content-type': 'application/json',
      'user-agent': `google-genai-sdk/${SDK_VERSION} undefined`,
      'x-goog-api-client': `google-genai-sdk/${SDK_VERSION} undefined`,
    });
    // Check that the onopen callback is wrapped to call the provided callbacks
    // and then resolve the onopen promise. The string is not fully checked to
    // avoid issues with whitespace.
    const onopenString = JSON.stringify(
      websocketFactorySpyCall.args[2].onopen.toString(),
    );
    expect(onopenString).toContain('onopen');
    expect(onopenString).toContain('onopenResolve({})');
    expect(
      JSON.stringify(websocketFactorySpyCall.args[2].onclose.toString()),
    ).toContain('void e');
    expect(session).toBeDefined();
  });

  it('connect should use access_token and BidiGenerateContentConstrained when apiKey starts with auth_tokens/', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'auth_tokens/test-access-token',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    await live.connect({
      model: 'models/gemini-live-2.5-flash-preview',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketFactorySpyCall = websocketFactorySpy.calls.all()[0];
    expect(websocketFactorySpyCall.args[0]).toBe(
      'wss://generativelanguage.googleapis.com//ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=auth_tokens/test-access-token',
    );
  });

  it('connect should use key and BidiGenerateContent when apiKey does not start with auth_tokens/', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    await live.connect({
      model: 'models/gemini-live-2.5-flash-preview',
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
  });

  it('connect should rely on provided callbacks', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    try {
      await live.connect({
        model: 'models/gemini-live-2.5-flash-preview',
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
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(websocketFactorySpyCall.args[1]).toEqual({
      'content-type': 'application/json',
      'user-agent': `google-genai-sdk/${SDK_VERSION} undefined`,
      'x-goog-api-client': `google-genai-sdk/${SDK_VERSION} undefined`,
    });
    // Check that the onopen callback is wrapped to call the provided callbacks
    // and then resolve the onopen promise. The string is not fully checked to
    // avoid issues with whitespace.
    const onopenString = JSON.stringify(
      websocketFactorySpyCall.args[2].onopen.toString(),
    );
    expect(onopenString).toContain('onopen');
    expect(onopenString).toContain('onopenResolve({})');
    expect(
      JSON.stringify(websocketFactorySpyCall.args[2].onerror.toString()),
    ).toContain('void e');
    expect(
      JSON.stringify(websocketFactorySpyCall.args[2].onclose.toString()),
    ).toContain('void e');
    expect(websocket.connect).toHaveBeenCalled();
    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {model: 'models/gemini-live-2.5-flash-preview'},
    });
    expect(session).toBeDefined();
  });

  it('connect should handle ArrayBuffer message', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    let capturedCallbacks: WebSocketCallbacks | undefined;
    const websocketFactorySpy = spyOn(websocketFactory, 'create').and.callFake(
      (url, headers, callbacks) => {
        capturedCallbacks = callbacks;
        return new FakeWebSocket(url, headers, callbacks);
      },
    );

    const onMessageSpy = jasmine.createSpy('onmessage');
    await live.connect({
      model: 'models/gemini-live-2.5-flash-preview',
      callbacks: {
        onmessage: onMessageSpy,
      },
    });

    // We expect the factory to have been called.
    expect(websocketFactorySpy).toHaveBeenCalled();
    if (!capturedCallbacks) {
      throw new Error('WebSocket callbacks were not captured');
    }

    // The FakeWebSocket's send method calls onmessage, so we reset the spy
    // to ignore the initial message exchange during connect().
    onMessageSpy.calls.reset();

    const testMessage = {setupComplete: {}};
    const jsonString = JSON.stringify(testMessage);
    const buffer = new TextEncoder().encode(jsonString);
    const arrayBuffer = buffer.buffer;

    // Manually trigger the onmessage with an ArrayBuffer using the captured callback
    capturedCallbacks.onmessage({
      data: arrayBuffer,
    } as MessageEvent);

    // Allow the async handleWebSocketMessage to complete
    await new Promise(process.nextTick);

    expect(onMessageSpy).toHaveBeenCalledTimes(1);
    const receivedMessage = onMessageSpy.calls.argsFor(0)[0];
    expect(receivedMessage.setupComplete).toBeDefined();
  });

  it('connect Gemini should fail with setup message using transparent', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
        model: 'models/gemini-live-2.5-flash-preview',
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
      downloader: new CrossDownloader(),
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
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-2.0-flash-live-preview-04-09',
        generationConfig: {responseModalities: ['AUDIO']},
        sessionResumption: {handle: 'test_handle', transparent: true},
      },
    });
    expect(session).toBeDefined();
  });

  it('connect should send setup message with context window compression config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-live-2.5-flash-preview',
        generationConfig: {responseModalities: ['AUDIO']},
        contextWindowCompression: {
          triggerTokens: '1000',
          slidingWindow: {targetTokens: '10'},
        },
      },
    });
    expect(session).toBeDefined();
  });

  it('connect should send setup message with realtime input config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-live-2.5-flash-preview',
        generationConfig: {responseModalities: ['AUDIO']},
        realtimeInputConfig: {
          automaticActivityDetection: {
            startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
            endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
          },
          activityHandling: 'NO_INTERRUPTION',
          turnCoverage: 'TURN_INCLUDES_ALL_INPUT',
        },
      },
    });
    expect(session).toBeDefined();
  });

  it('connect should send setup message with top level generation config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-live-2.5-flash-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          temperature: 0.5,
          topP: 0.9,
          topK: 3,
          seed: 12,
        },
      },
    });
    expect(session).toBeDefined();
  });

  it('connect should send setup message with speech config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-live-2.5-flash-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'en-default'}},
            languageCode: 'en-US',
          },
        },
      },
    });
    expect(session).toBeDefined();
  });

  it('connect should reject multi speaker speech config', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
    spyOn(websocketFactory, 'create').and.callFake(
      (url, headers, callbacks) => {
        // Update the websocket spy instance with callbacks provided by
        // the websocket factory.
        websocket = new FakeWebSocket(url, headers, callbacks);
        spyOn(websocket, 'connect').and.callThrough();
        const _websocketSpy = spyOn(websocket, 'send').and.callThrough();
        return websocket;
      },
    );

    try {
      const _ = await live.connect({
        model: 'models/gemini-live-2.5-flash-preview',
        config: {
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Alice',
                  voiceConfig: {prebuiltVoiceConfig: {voiceName: 'leda'}},
                },
                {
                  speaker: 'Bob',
                  voiceConfig: {prebuiltVoiceConfig: {voiceName: 'kore'}},
                },
              ],
            },
          },
        },
        callbacks: {
          onmessage: function (e: types.LiveServerMessage) {
            void e;
          },
        },
      });
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).toBe(
          'multiSpeakerVoiceConfig is not supported in the live API.',
        );
      }
    }
  });

  it('connect should send setup message with MCP tools', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
        expect(headers['x-goog-api-client']).toContain('mcp_used/');
        expect(headers['x-goog-api-client']).toContain('google-genai-sdk/');
        // Update the websocket spy instance with callbacks provided by
        // the websocket factory.
        websocket = new FakeWebSocket(url, headers, callbacks);
        spyOn(websocket, 'connect').and.callThrough();
        websocketSpy = spyOn(websocket, 'send').and.callThrough();
        return websocket;
      },
    );

    const callableTool = mcpToTool(await spinUpPrintingServer(), {
      behavior: types.Behavior.NON_BLOCKING,
    });

    const session = await live.connect({
      model: 'models/gemini-live-2.5-flash-preview',
      config: {
        tools: [callableTool],
      },
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-live-2.5-flash-preview',
        tools: [
          {
            functionDeclarations: [
              {
                name: 'print',
                parametersJsonSchema: {
                  type: 'object',
                  properties: {
                    text: {type: 'string'},
                    color: {
                      type: 'string',
                      pattern: 'red|blue|green|white',
                    },
                  },
                  required: ['text', 'color'],
                  additionalProperties: false,
                  $schema: 'http://json-schema.org/draft-07/schema#',
                },
                behavior: 'NON_BLOCKING',
              },
            ],
          },
        ],
      },
    });
    expect(session).toBeDefined();
  });

  it('session should return goAway message', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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
    expect(JSON.parse(websocketSpyCall.args[0])).toEqual({
      setup: {
        model: 'models/gemini-live-2.5-flash-preview',
        generationConfig: {responseModalities: ['AUDIO']},
        outputAudioTranscription: {},
      },
    });
    expect(session).toBeDefined();
  });

  it('session should return session resumption update message', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
      model: 'models/gemini-live-2.5-flash-preview',
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

  it('Converters should block bad MimeTypes', async () => {
    expect(() => {
      converters.liveSendRealtimeInputParametersToMldev({
        audio: {data: 'AAAA', mimeType: 'image/png'},
      } as types.LiveSendRealtimeInputParameters);
    }).toThrowError(Error, 'Unsupported mime type: image/png');
  });

  it('connect with custom base url and no auth (Vertex)', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      httpOptions: {
        baseUrl: 'wss://custom-gateway.com/full/path',
      },
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    // No project/location provided.
    await live.connect({
      model: 'models/gemini-2.0-flash-live-preview-04-09',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketFactorySpyCall = websocketFactorySpy.calls.all()[0];
    // Should use the custom base URL exactly as is
    expect(websocketFactorySpyCall.args[0]).toBe(
      'wss://custom-gateway.com/full/path',
    );
  });

  it('connect with custom base url and auth (Vertex)', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      project: 'test-project',
      location: 'us-central1',
      httpOptions: {
        baseUrl: 'https://custom-gateway.com', // http will be converted to wss
      },
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    await live.connect({
      model: 'models/gemini-2.0-flash-live-preview-04-09',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketFactorySpyCall = websocketFactorySpy.calls.all()[0];
    // Should append the standard path to the custom base URL
    // And convert https to wss
    expect(websocketFactorySpyCall.args[0]).toBe(
      'wss://custom-gateway.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent',
    );
  });

  it('connect with project but no location defaults to global (Vertex)', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      project: 'test-project',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const websocketFactory = new FakeWebSocketFactory();
    const live = new Live(apiClient, new FakeAuth(), websocketFactory);

    const websocketFactorySpy = spyOn(
      websocketFactory,
      'create',
    ).and.callThrough();

    await live.connect({
      model: 'models/gemini-2.0-flash-live-preview-04-09',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketFactorySpyCall = websocketFactorySpy.calls.all()[0];
    // Should use the global endpoint because location defaults to 'global'
    expect(websocketFactorySpyCall.args[0]).toBe(
      'wss://aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent',
    );
  });

  it('connect with apiKey for Vertex Express mode does not mis-prefix model (Vertex)', async () => {
    const apiClient = new ApiClient({
      auth: new FakeAuth(),
      vertexai: true,
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
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
        websocket = new FakeWebSocket(url, headers, callbacks);
        spyOn(websocket, 'connect').and.callThrough();
        websocketSpy = spyOn(websocket, 'send').and.callThrough();
        return websocket;
      },
    );

    await live.connect({
      model: 'publishers/google/models/gemini-2.0-flash-live-preview-04-09',
      callbacks: {
        onmessage: function (e: types.LiveServerMessage) {
          void e;
        },
      },
    });

    const websocketSpyCall = websocketSpy.calls.all()[0];
    // Model should NOT be prefixed with projects/undefined/locations/undefined/
    expect(JSON.parse(websocketSpyCall.args[0]).setup.model).toBe(
      'publishers/google/models/gemini-2.0-flash-live-preview-04-09',
    );
  });
});

// TODO: b/395958466 - Add unit tests for Session.
