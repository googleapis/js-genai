/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Live music client.
 *
 * @experimental
 */

import {ApiClient} from './_api_client.js';
import {Auth} from './_auth.js';
import * as t from './_transformers.js';
import {WebSocket, WebSocketCallbacks, WebSocketFactory} from './_websocket.js';
import * as converters from './converters/_live_converters.js';
import * as types from './types.js';

/**
 * Handles incoming messages from the WebSocket.
 *
 * @remarks
 * This function is responsible for parsing incoming messages, transforming them
 * into LiveMusicServerMessage, and then calling the onmessage callback.
 * Note that the first message which is received from the server is a
 * setupComplete message.
 *
 * @param apiClient The ApiClient instance.
 * @param onmessage The user-provided onmessage callback (if any).
 * @param event The MessageEvent from the WebSocket.
 */
async function handleWebSocketMessage(
  apiClient: ApiClient,
  onmessage: (msg: types.LiveMusicServerMessage) => void,
  event: MessageEvent,
): Promise<void> {
  const serverMessage: types.LiveMusicServerMessage =
    new types.LiveMusicServerMessage();
  let data: types.LiveMusicServerMessage;
  if (event.data instanceof Blob) {
    data = JSON.parse(await event.data.text()) as types.LiveMusicServerMessage;
  } else {
    data = JSON.parse(event.data) as types.LiveMusicServerMessage;
  }
  const response = converters.liveMusicServerMessageFromMldev(data);
  Object.assign(serverMessage, response);
  onmessage(serverMessage);
}

/**
   LiveMusic class encapsulates the configuration for live music
   generation via Lyria Live models.

   @experimental
  */
export class LiveMusic {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly auth: Auth,
    private readonly webSocketFactory: WebSocketFactory,
  ) {}

  /**
     Establishes a connection to the specified model and returns a
     LiveMusicSession object representing that connection.

     @experimental

     @remarks

     @param params - The parameters for establishing a connection to the model.
     @return A live session.

     @example
     ```ts
     let model = 'models/lyria-realtime-exp';
     const session = await ai.live.music.connect({
       model: model,
       callbacks: {
         onmessage: (e: MessageEvent) => {
           console.log('Received message from the server: %s\n', debug(e.data));
         },
         onerror: (e: ErrorEvent) => {
           console.log('Error occurred: %s\n', debug(e.error));
         },
         onclose: (e: CloseEvent) => {
           console.log('Connection closed.');
         },
       },
     });
     ```
    */
  async connect(
    params: types.LiveMusicConnectParameters,
  ): Promise<LiveMusicSession> {
    if (this.apiClient.isVertexAI()) {
      throw new Error('Live music is not supported for Vertex AI.');
    }
    console.warn(
      'Live music generation is experimental and may change in future versions.',
    );

    const websocketBaseUrl = this.apiClient.getWebsocketBaseUrl();
    const apiVersion = this.apiClient.getApiVersion();
    const headers = mapToHeaders(this.apiClient.getDefaultHeaders());
    const apiKey = this.apiClient.getApiKey();
    const url = `${websocketBaseUrl}/ws/google.ai.generativelanguage.${
      apiVersion
    }.GenerativeService.BidiGenerateMusic?key=${apiKey}`;

    let onopenResolve: (value: unknown) => void = () => {};
    const onopenPromise = new Promise((resolve: (value: unknown) => void) => {
      onopenResolve = resolve;
    });

    const callbacks: types.LiveMusicCallbacks = params.callbacks;

    const onopenAwaitedCallback = function () {
      onopenResolve({});
    };

    const apiClient = this.apiClient;
    const websocketCallbacks: WebSocketCallbacks = {
      onopen: onopenAwaitedCallback,
      onmessage: (event: MessageEvent) => {
        void handleWebSocketMessage(apiClient, callbacks.onmessage, event);
      },
      onerror:
        callbacks?.onerror ??
        function (e: ErrorEvent) {
          void e;
        },
      onclose:
        callbacks?.onclose ??
        function (e: CloseEvent) {
          void e;
        },
    };

    const conn = this.webSocketFactory.create(
      url,
      headersToMap(headers),
      websocketCallbacks,
    );
    conn.connect();
    // Wait for the websocket to open before sending requests.
    await onopenPromise;

    const model = t.tModel(this.apiClient, params.model);
    const setup = converters.liveMusicClientSetupToMldev({
      model,
    });
    const clientMessage = converters.liveMusicClientMessageToMldev({setup});
    conn.send(JSON.stringify(clientMessage));

    return new LiveMusicSession(conn, this.apiClient);
  }
}

/**
   Represents a connection to the API.

   @experimental
  */
export class LiveMusicSession {
  constructor(
    readonly conn: WebSocket,
    private readonly apiClient: ApiClient,
  ) {}

  /**
    Sets inputs to steer music generation. Updates the session's current
    weighted prompts.

    @param params - Contains one property, `weightedPrompts`.

      - `weightedPrompts` to send to the model; weights are normalized to
        sum to 1.0.

    @experimental
   */
  async setWeightedPrompts(
    params: types.LiveMusicSetWeightedPromptsParameters,
  ) {
    if (
      !params.weightedPrompts ||
      Object.keys(params.weightedPrompts).length === 0
    ) {
      throw new Error(
        'Weighted prompts must be set and contain at least one entry.',
      );
    }
    const setWeightedPromptsParameters =
      converters.liveMusicSetWeightedPromptsParametersToMldev(params);
    const clientContent = converters.liveMusicClientContentToMldev(
      setWeightedPromptsParameters,
    );
    this.conn.send(JSON.stringify({clientContent}));
  }

  /**
    Sets a configuration to the model. Updates the session's current
    music generation config.

    @param params - Contains one property, `musicGenerationConfig`.

      - `musicGenerationConfig` to set in the model. Passing an empty or
    undefined config to the model will reset the config to defaults.

    @experimental
   */
  async setMusicGenerationConfig(params: types.LiveMusicSetConfigParameters) {
    if (!params.musicGenerationConfig) {
      params.musicGenerationConfig = {};
    }
    const setConfigParameters =
      converters.liveMusicSetConfigParametersToMldev(params);
    const clientMessage =
      converters.liveMusicClientMessageToMldev(setConfigParameters);
    this.conn.send(JSON.stringify(clientMessage));
  }

  private sendPlaybackControl(playbackControl: types.LiveMusicPlaybackControl) {
    const clientMessage = converters.liveMusicClientMessageToMldev({
      playbackControl,
    });
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
   * Start the music stream.
   *
   * @experimental
   */
  play() {
    this.sendPlaybackControl(types.LiveMusicPlaybackControl.PLAY);
  }

  /**
   * Temporarily halt the music stream. Use `play` to resume from the current
   * position.
   *
   * @experimental
   */
  pause() {
    this.sendPlaybackControl(types.LiveMusicPlaybackControl.PAUSE);
  }

  /**
   * Stop the music stream and reset the state. Retains the current prompts
   * and config.
   *
   * @experimental
   */
  stop() {
    this.sendPlaybackControl(types.LiveMusicPlaybackControl.STOP);
  }

  /**
   * Resets the context of the music generation without stopping it.
   * Retains the current prompts and config.
   *
   * @experimental
   */
  resetContext() {
    this.sendPlaybackControl(types.LiveMusicPlaybackControl.RESET_CONTEXT);
  }

  /**
     Terminates the WebSocket connection.

     @experimental
   */
  close() {
    this.conn.close();
  }
}

// Converts an headers object to a "map" object as expected by the WebSocket
// constructor. We use this as the Auth interface works with Headers objects
// while the WebSocket constructor takes a map.
function headersToMap(headers: Headers): Record<string, string> {
  const headerMap: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerMap[key] = value;
  });
  return headerMap;
}

// Converts a "map" object to a headers object. We use this as the Auth
// interface works with Headers objects while the API client default headers
// returns a map.
function mapToHeaders(map: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(map)) {
    headers.append(key, value);
  }
  return headers;
}
