/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient, SDK_VERSION} from '../../src/_api_client.js';
import {WebSocketCallbacks} from '../../src/_websocket.js';
import {CrossDownloader} from '../../src/cross/_cross_downloader.js';
import {CrossUploader} from '../../src/cross/_cross_uploader.js';
import {LiveMusic, LiveMusicSession} from '../../src/music.js';
import * as types from '../../src/types.js';
import {FakeAuth} from '../_fake_auth.js';
import {FakeWebSocket, FakeWebSocketFactory} from '../_fake_websocket.js';

describe('LiveMusic', () => {
  let apiClient: ApiClient;
  let websocketFactory: FakeWebSocketFactory;
  let music: LiveMusic;
  let fakeWebSocket: FakeWebSocket;
  let webSocketSendSpy: jasmine.Spy;

  beforeEach(() => {
    apiClient = new ApiClient({
      auth: new FakeAuth(),
      apiKey: 'test-api-key',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    websocketFactory = new FakeWebSocketFactory();
    music = new LiveMusic(apiClient, new FakeAuth(), websocketFactory);

    // Setup spy on websocket creation and send method
    spyOn(websocketFactory, 'create').and.callFake(
      (
        url: string,
        headers: Record<string, string>,
        callbacks: WebSocketCallbacks,
      ) => {
        fakeWebSocket = new FakeWebSocket(url, headers, callbacks);
        spyOn(fakeWebSocket, 'connect').and.callThrough();
        webSocketSendSpy = spyOn(fakeWebSocket, 'send').and.callThrough();
        spyOn(fakeWebSocket, 'close').and.callThrough();
        return fakeWebSocket;
      },
    );
  });

  describe('connect', () => {
    it('uses default callbacks if not provided', async () => {
      // Default callbacks are used.
      const session = await music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onmessage: (msg: types.LiveMusicServerMessage) => {
            void msg;
          }, // onmessage is required
        },
      });
      const websocketCreateSpy = websocketFactory.create as jasmine.Spy;
      const websocketFactorySpyCall = websocketCreateSpy.calls.all()[0];
      expect(websocketFactorySpyCall.args[0]).toBe(
        'wss://generativelanguage.googleapis.com//ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateMusic?key=test-api-key',
      );
      expect(JSON.stringify(websocketFactorySpyCall.args[1])).toBe(
        `{"content-type":"application/json","user-agent":"google-genai-sdk/${
          SDK_VERSION
        } undefined","x-goog-api-client":"google-genai-sdk/${
          SDK_VERSION
        } undefined"}`,
      );
      // Check that the onopen callback is wrapped to call the provided
      // callbacks and then resolve the onopen promise.
      const onopenString = websocketFactorySpyCall.args[2].onopen.toString();
      expect(onopenString).toContain('onopenResolve({});');
      // Default error/close handlers just ignore the event
      expect(websocketFactorySpyCall.args[2].onerror.toString()).toContain(
        'void e;',
      );
      expect(websocketFactorySpyCall.args[2].onclose.toString()).toContain(
        'void e;',
      );
      expect(session).toBeDefined();
      expect(session.conn).toBe(fakeWebSocket); // Ensure the session holds the created websocket
    });

    it('should rely on provided callbacks', async () => {
      // LiveMusicCallbacks
      let customOnErrorCalled = false;
      let customOnCloseCalled = false;

      const customOnError = (e: ErrorEvent) => {
        void e;
        customOnErrorCalled = true;
      };
      const customOnClose = (e: CloseEvent) => {
        void e;
        customOnCloseCalled = true;
      };

      await music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onmessage: (msg: types.LiveMusicServerMessage) => {
            void msg;
          },
          onerror: customOnError,
          onclose: customOnClose,
        },
      });

      const websocketCreateSpy = websocketFactory.create as jasmine.Spy;
      const websocketFactorySpyCall = websocketCreateSpy.calls.all()[0];

      // Trigger the callbacks manually for testing
      websocketFactorySpyCall.args[2].onopen(); // Trigger internal onopen for connection resolution
      websocketFactorySpyCall.args[2].onerror(new Error('error'));
      websocketFactorySpyCall.args[2].onclose('close');

      expect(customOnErrorCalled).toBeTrue();
      expect(customOnCloseCalled).toBeTrue();
    });

    it('should send setup message after connect', async () => {
      await music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onmessage: (msg: types.LiveMusicServerMessage) => {
            void msg;
          },
        },
      });

      expect(fakeWebSocket.connect).toHaveBeenCalled();
      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const setupMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(setupMessage).toEqual({
        setup: {
          model: 'models/lyria-realtime-exp',
        },
      });
    });

    it('should transform model name for non-Vertex', async () => {
      await music.connect({
        model: 'lyria-realtime-exp', // Short model name
        callbacks: {
          onmessage: (msg: types.LiveMusicServerMessage) => {
            void msg;
          },
        },
      });
      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const setupMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(setupMessage).toEqual({
        setup: {
          model: 'models/lyria-realtime-exp', // Expect transformed name
        },
      });
    });

    it('should throw error if Vertex AI is configured', async () => {
      apiClient = new ApiClient({
        auth: new FakeAuth(),
        apiKey: 'test-api-key',
        uploader: new CrossUploader(),
        downloader: new CrossDownloader(),
        vertexai: true, // Enable Vertex AI
        project: 'test-project',
        location: 'test-location',
      });
      music = new LiveMusic(apiClient, new FakeAuth(), websocketFactory);

      await expectAsync(
        music.connect({
          model: 'models/lyria-realtime-exp',
          callbacks: {
            onmessage: (msg: types.LiveMusicServerMessage) => {
              void msg;
            },
          },
        }),
      ).toBeRejectedWithError('Live music is not supported for Vertex AI.');
    });

    it('should handle incoming messages via onmessage callback', async () => {
      const incomingMessages: types.LiveMusicServerMessage[] = [];
      await music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onmessage: (msg: types.LiveMusicServerMessage) => {
            incomingMessages.push(msg);
          },
        },
      });

      // Simulate receiving messages from the WebSocket
      // Define data for server messages as plain objects
      const testSetupCompleteMessageData = {setupComplete: {}};
      const testMessage1Data = {
        serverContent: {audioChunks: [{data: 'chunk1'}]},
      };
      const testMessage2Data = {
        serverContent: {audioChunks: [{data: 'chunk2'}]},
      };

      // Access the internal onmessage handler attached to the fake websocket
      const websocketCreateSpy = websocketFactory.create as jasmine.Spy;
      const websocketFactorySpyCall = websocketCreateSpy.calls.all()[0];
      const internalOnMessageHandler =
        websocketFactorySpyCall.args[2].onmessage;

      // Send messages - wrap in MessageEvent using the plain data objects
      // These will be converted to LiveMusicServerMessage instances by
      // handleWebSocketMessage
      await internalOnMessageHandler(
        new MessageEvent('message', {
          data: JSON.stringify(testSetupCompleteMessageData),
        }),
      );
      await internalOnMessageHandler(
        new MessageEvent('message', {data: JSON.stringify(testMessage1Data)}),
      );
      await internalOnMessageHandler(
        new MessageEvent('message', {data: JSON.stringify(testMessage2Data)}),
      );

      // Create expected LiveMusicServerMessage instances for comparison
      const expectedSetupCompleteMessage = new types.LiveMusicServerMessage();

      // Use Object.assign to populate properties
      // from the test data into the created objects.

      Object.assign(expectedSetupCompleteMessage, testSetupCompleteMessageData);

      const expectedMessage1 = new types.LiveMusicServerMessage();
      Object.assign(expectedMessage1, testMessage1Data);

      const expectedMessage2 = new types.LiveMusicServerMessage();
      Object.assign(expectedMessage2, testMessage2Data);

      // Note that the setup message is sent during connect(). The fake
      // websocket will forward this message to the callback, so exclude it from
      // the incoming messages.
      incomingMessages.shift(); // Assumes the first message is from the initial client

      // setup message due to FakeWebSocket behavior
      expect(incomingMessages.length).toBe(3);
      // Compare received instances with expected instances
      expect(incomingMessages[0]).toEqual(expectedSetupCompleteMessage);
      expect(incomingMessages[1]).toEqual(expectedMessage1);
      expect(incomingMessages[2]).toEqual(expectedMessage2);
    });
  });

  describe('LiveMusicServerMessage', () => {
    it('audioChunk accessor should return the first audio chunk when serverContent and audioChunks are present', () => {
      const message = new types.LiveMusicServerMessage();
      const firstChunk = {data: 'first_audio_sample'};
      const secondChunk = {data: 'second_audio_sample'};
      message.serverContent = {
        audioChunks: [firstChunk, secondChunk],
      };
      // Assuming LiveMusicServerMessage has a getter like:
      // get audioChunk() { return this.serverContent?.audioChunks?.[0]; }
      expect(message.audioChunk).toEqual(firstChunk);
    });

    it('audioChunk accessor should return undefined if audioChunks is empty', () => {
      const message = new types.LiveMusicServerMessage();
      message.serverContent = {
        audioChunks: [],
      };
      expect(message.audioChunk).toBeUndefined();
    });

    it('audioChunk accessor should return undefined if audioChunks is missing from serverContent', () => {
      const message = new types.LiveMusicServerMessage();
      message.serverContent = {
        // audioChunks property is deliberately omitted
      };
      expect(message.audioChunk).toBeUndefined();
    });

    it('audioChunk accessor should return undefined if serverContent is missing', () => {
      const message = new types.LiveMusicServerMessage();
      // serverContent property is deliberately omitted
      expect(message.audioChunk).toBeUndefined();
    });

    it('audioChunk accessor should return undefined if LiveMusicServerMessage is empty', () => {
      const message = new types.LiveMusicServerMessage();
      expect(message.audioChunk).toBeUndefined();
    });
  });

  describe('LiveMusicSession', () => {
    let session: LiveMusicSession;

    beforeEach(async () => {
      // Establish a connection before each session test
      session = await music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onmessage: (msg: types.LiveMusicServerMessage) => {
            void msg;
          },
        },
      });
      // Reset spy count after the initial setup message during connect
      webSocketSendSpy.calls.reset();
    });

    it('setWeightedPrompts sends weightedPrompts', async () => {
      const weightedPrompts: types.WeightedPrompt[] = [
        {
          text: 'minimal',
          weight: 0.4,
        },
        {text: 'ambient', weight: 0.6},
      ];
      await session.setWeightedPrompts({weightedPrompts});

      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(sentMessage).toEqual({
        clientContent: {weightedPrompts},
      });
    });

    describe('setMusicGenerationConfig', () => {
      it('sets musicGenerationConfig', async () => {
        const config: types.LiveMusicGenerationConfig = {
          temperature: 0.5,
          topK: 100,
          guidance: 3.0,
          bpm: 140,
          density: 0.5,
          brightness: 0.5,
          scale: types.Scale.C_MAJOR_A_MINOR,
          muteBass: true,
          muteDrums: true,
          onlyBassAndDrums: true,
          musicGenerationMode: types.MusicGenerationMode.QUALITY,
        };
        await session.setMusicGenerationConfig({musicGenerationConfig: config});

        expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
        const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
        expect(sentMessage).toEqual({
          musicGenerationConfig: config,
        });
      });

      it('sends empty config if musicGenerationConfig property is an empty object', async () => {
        await session.setMusicGenerationConfig({musicGenerationConfig: {}});

        expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
        const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
        expect(sentMessage).toEqual({
          musicGenerationConfig: {},
        });
      });
    });

    it('play sends correct playbackControl message', async () => {
      await session.play();
      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(sentMessage).toEqual({
        playbackControl: types.LiveMusicPlaybackControl.PLAY,
      });
    });

    it('pause sends correct playbackControl message', async () => {
      await session.pause();
      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(sentMessage).toEqual({
        playbackControl: types.LiveMusicPlaybackControl.PAUSE,
      });
    });

    it('stop sends correct playbackControl message', async () => {
      await session.stop();
      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(sentMessage).toEqual({
        playbackControl: types.LiveMusicPlaybackControl.STOP,
      });
    });

    it('resetContext sends correct playbackControl message', async () => {
      await session.resetContext();
      expect(webSocketSendSpy).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(webSocketSendSpy.calls.all()[0].args[0]);
      expect(sentMessage).toEqual({
        playbackControl: types.LiveMusicPlaybackControl.RESET_CONTEXT,
      });
    });

    it('close calls websocket close', () => {
      session.close();
      expect(fakeWebSocket.close).toHaveBeenCalledTimes(1);
    });
  });
});
