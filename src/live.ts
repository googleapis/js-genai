/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Live client.
 *
 * @experimental
 */

import {ApiClient} from './_api_client';
import {Auth} from './_auth';
import * as common from './_common';
import * as t from './_transformers';
import {WebSocket, WebSocketCallbacks, WebSocketFactory} from './_websocket';
import {
  contentFromMldev,
  contentFromVertex,
  contentToMldev,
  contentToVertex,
  toolToMldev,
  toolToVertex,
} from './models';
import * as types from './types';

const FUNCTION_RESPONSE_REQUIRES_ID =
  'FunctionResponse request must have an `id` field from the response of a ToolCall.FunctionalCalls in Google AI.';

function liveConnectConfigToMldev(
  apiClient: ApiClient,
  fromObject: types.LiveConnectConfig,
): types.LiveClientSetup {
  const toObject: Record<string, unknown> = {};

  const fromGenerationConfig = common.getValueByPath(fromObject, [
    'generationConfig',
  ]);
  if (fromGenerationConfig !== undefined) {
    common.setValueByPath(toObject, ['generationConfig'], fromGenerationConfig);
  }

  const fromResponseModalities = common.getValueByPath(fromObject, [
    'responseModalities',
  ]);
  if (fromResponseModalities !== undefined) {
    common.setValueByPath(
      toObject,
      ['generationConfig', 'responseModalities'],
      fromResponseModalities,
    );
  }

  const fromSpeechConfig = common.getValueByPath(fromObject, ['speechConfig']);
  if (fromSpeechConfig !== undefined) {
    common.setValueByPath(
      toObject,
      ['generationConfig', 'speechConfig'],
      fromSpeechConfig,
    );
  }

  const fromSystemInstruction = common.getValueByPath(fromObject, [
    'systemInstruction',
  ]);
  if (fromSystemInstruction !== undefined && fromSystemInstruction !== null) {
    common.setValueByPath(
        toObject,
        ['systemInstruction'],
        contentToMldev(apiClient, fromSystemInstruction),
    );
  }

  const fromTools = common.getValueByPath(fromObject, ['tools']);
  if (
    fromTools !== undefined &&
    fromTools !== null &&
    Array.isArray(fromTools)
  ) {
    common.setValueByPath(
        toObject,
        ['tools'],
        fromTools.map((item: types.Tool) => {
          return toolToMldev(apiClient, item);
        }),
    );
  }

  return toObject;
}

function liveConnectConfigToVertex(
  apiClient: ApiClient,
  fromObject: types.LiveConnectConfig,
): types.LiveClientSetup {
  const toObject: Record<string, unknown> = {};

  const fromGenerationConfig = common.getValueByPath(fromObject, [
    'generationConfig',
  ]);
  if (fromGenerationConfig !== undefined) {
    common.setValueByPath(toObject, ['generationConfig'], fromGenerationConfig);
  }

  const fromResponseModalities = common.getValueByPath(fromObject, [
    'responseModalities',
  ]);
  if (fromResponseModalities !== undefined) {
    common.setValueByPath(
      toObject,
      ['generationConfig', 'responseModalities'],
      fromResponseModalities,
    );
  } else {
    // Set default to AUDIO to align with MLDev API.
    common.setValueByPath(
      toObject,
      ['generationConfig', 'responseModalities'],
      ['AUDIO'],
    );
  }

  const fromSpeechConfig = common.getValueByPath(fromObject, ['speechConfig']);
  if (fromSpeechConfig !== undefined) {
    common.setValueByPath(
      toObject,
      ['generationConfig', 'speechConfig'],
      fromSpeechConfig,
    );
  }

  const fromSystemInstruction = common.getValueByPath(fromObject, [
    'systemInstruction',
  ]);
  if (fromSystemInstruction !== undefined && fromSystemInstruction !== null) {
    common.setValueByPath(
        toObject,
        ['systemInstruction'],
        contentToVertex(apiClient, fromSystemInstruction),
    );
  }

  const fromTools = common.getValueByPath(fromObject, ['tools']);
  if (
    fromTools !== undefined &&
    fromTools !== null &&
    Array.isArray(fromTools)
  ) {
    common.setValueByPath(
        toObject,
        ['tools'],
        fromTools.map((item: types.Tool) => {
          return toolToVertex(apiClient, item);
        }),
    );
  }

  return toObject;
}

function liveConnectParametersToMldev(
  apiClient: ApiClient,
  fromObject: types.LiveConnectParameters,
): types.LiveClientMessage {
  const toObject: Record<string, unknown> = {};

  const fromConfig = common.getValueByPath(fromObject, ['config']);
  if (fromConfig !== undefined && fromConfig !== null) {
    common.setValueByPath(
      toObject,
      ['setup'],
      liveConnectConfigToMldev(apiClient, fromConfig),
    );
  }

  const fromModel = common.getValueByPath(fromObject, ['model']);
  if (fromModel !== undefined) {
    common.setValueByPath(toObject, ['setup', 'model'], fromModel);
  }

  return toObject;
}

function liveConnectParametersToVertex(
  apiClient: ApiClient,
  fromObject: types.LiveConnectParameters,
): types.LiveClientMessage {
  const toObject: Record<string, unknown> = {};

  const fromConfig = common.getValueByPath(fromObject, ['config']);
  if (fromConfig !== undefined && fromConfig !== null) {
    common.setValueByPath(
      toObject,
      ['setup'],
      liveConnectConfigToVertex(apiClient, fromConfig),
    );
  }

  const fromModel = common.getValueByPath(fromObject, ['model']);
  if (fromModel !== undefined) {
    common.setValueByPath(toObject, ['setup', 'model'], fromModel);
  }

  return toObject;
}

function liveServerContentFromMldev(
  apiClient: ApiClient,
  fromObject: types.LiveServerContent,
): types.LiveServerContent {
  const toObject: Record<string, unknown> = {};

  const fromModelTurn = common.getValueByPath(fromObject, ['modelTurn']);
  if (fromModelTurn !== undefined && fromModelTurn !== null) {
    common.setValueByPath(
        toObject,
        ['modelTurn'],
        contentFromMldev(apiClient, fromModelTurn),
    );
  }

  const fromTurnComplete = common.getValueByPath(fromObject, ['turnComplete']);
  if (fromTurnComplete !== undefined) {
    common.setValueByPath(toObject, ['turnComplete'], fromTurnComplete);
  }

  const fromInterrupted = common.getValueByPath(fromObject, ['interrupted']);
  if (fromInterrupted !== undefined) {
    common.setValueByPath(toObject, ['interrupted'], fromInterrupted);
  }

  return toObject;
}

function liveServerContentFromVertex(
  apiClient: ApiClient,
  fromObject: types.LiveServerContent,
): types.LiveServerContent {
  const toObject: Record<string, unknown> = {};

  const fromModelTurn = common.getValueByPath(fromObject, ['modelTurn']);
  if (fromModelTurn !== undefined && fromModelTurn !== null) {
    common.setValueByPath(
        toObject,
        ['modelTurn'],
        contentFromVertex(apiClient, fromModelTurn),
    );
  }

  const fromTurnComplete = common.getValueByPath(fromObject, ['turnComplete']);
  if (fromTurnComplete !== undefined) {
    common.setValueByPath(toObject, ['turnComplete'], fromTurnComplete);
  }

  const fromInterrupted = common.getValueByPath(fromObject, ['interrupted']);
  if (fromInterrupted !== undefined) {
    common.setValueByPath(toObject, ['interrupted'], fromInterrupted);
  }

  return toObject;
}

function functionCallFromMldev(
  apiClient: ApiClient,
  fromObject: types.FunctionCall,
): types.FunctionCall {
  const toObject: Record<string, unknown> = {};

  const fromId = common.getValueByPath(fromObject, ['id']);
  if (fromId !== undefined) {
    common.setValueByPath(toObject, ['id'], fromId);
  }

  const fromArgs = common.getValueByPath(fromObject, ['args']);
  if (fromArgs !== undefined) {
    common.setValueByPath(toObject, ['args'], fromArgs);
  }

  const fromName = common.getValueByPath(fromObject, ['name']);
  if (fromName !== undefined) {
    common.setValueByPath(toObject, ['name'], fromName);
  }

  return toObject;
}

function functionCallFromVertex(
  apiClient: ApiClient,
  fromObject: types.FunctionCall,
): types.FunctionCall {
  const toObject: Record<string, unknown> = {};

  const fromArgs = common.getValueByPath(fromObject, ['args']);
  if (fromArgs !== undefined) {
    common.setValueByPath(toObject, ['args'], fromArgs);
  }

  const fromName = common.getValueByPath(fromObject, ['name']);
  if (fromName !== undefined) {
    common.setValueByPath(toObject, ['name'], fromName);
  }

  return toObject;
}

function liveServerToolCallFromMldev(
  apiClient: ApiClient,
  fromObject: types.LiveServerToolCall,
): types.LiveServerToolCall {
  const toObject: Record<string, unknown> = {};

  const fromFunctionCalls = common.getValueByPath(fromObject, [
    'functionCalls',
  ]);
  if (
    fromFunctionCalls !== undefined &&
    fromFunctionCalls !== null &&
    Array.isArray(fromFunctionCalls)
  ) {
    common.setValueByPath(
      toObject,
      ['functionCalls'],
      fromFunctionCalls.map((item: types.FunctionCall) => {
        return functionCallFromMldev(apiClient, item);
      }),
    );
  }

  return toObject;
}

function liveServerToolCallFromVertex(
  apiClient: ApiClient,
  fromObject: types.LiveServerToolCall,
): types.LiveServerToolCall {
  const toObject: Record<string, unknown> = {};

  const fromFunctionCalls = common.getValueByPath(fromObject, [
    'functionCalls',
  ]);
  if (
    fromFunctionCalls !== undefined &&
    fromFunctionCalls !== null &&
    Array.isArray(fromFunctionCalls)
  ) {
    common.setValueByPath(
      toObject,
      ['functionCalls'],
      fromFunctionCalls.map((item: types.FunctionCall) => {
        return functionCallFromVertex(apiClient, item);
      }),
    );
  }

  return toObject;
}

function liveServerToolCallCancellationFromMldev(
  apiClient: ApiClient,
  fromObject: types.LiveServerToolCallCancellation,
): types.LiveServerToolCallCancellation {
  const toObject: Record<string, unknown> = {};

  const fromIds = common.getValueByPath(fromObject, ['ids']);
  if (fromIds !== undefined) {
    common.setValueByPath(toObject, ['ids'], fromIds);
  }

  return toObject;
}

function liveServerToolCallCancellationFromVertex(
  apiClient: ApiClient,
  fromObject: types.LiveServerToolCallCancellation,
): types.LiveServerToolCallCancellation {
  const toObject: Record<string, unknown> = {};

  const fromIds = common.getValueByPath(fromObject, ['ids']);
  if (fromIds !== undefined) {
    common.setValueByPath(toObject, ['ids'], fromIds);
  }

  return toObject;
}

function liveServerMessageFromMldev(
  apiClient: ApiClient,
  fromObject: types.LiveServerMessage,
): types.LiveServerMessage {
  const toObject: Record<string, unknown> = {};

  const fromSetupComplete = common.getValueByPath(fromObject, [
    'setupComplete',
  ]);
  if (fromSetupComplete !== undefined) {
    common.setValueByPath(toObject, ['setupComplete'], fromSetupComplete);
  }

  const fromServerContent = common.getValueByPath(fromObject, [
    'serverContent',
  ]);
  if (fromServerContent !== undefined && fromServerContent !== null) {
    common.setValueByPath(
      toObject,
      ['serverContent'],
      liveServerContentFromMldev(apiClient, fromServerContent),
    );
  }

  const fromToolCall = common.getValueByPath(fromObject, ['toolCall']);
  if (fromToolCall !== undefined && fromToolCall !== null) {
    common.setValueByPath(
      toObject,
      ['toolCall'],
      liveServerToolCallFromMldev(apiClient, fromToolCall),
    );
  }

  const fromToolCallCancellation = common.getValueByPath(fromObject, [
    'toolCallCancellation',
  ]);
  if (
    fromToolCallCancellation !== undefined &&
    fromToolCallCancellation !== null
  ) {
    common.setValueByPath(
      toObject,
      ['toolCallCancellation'],
      liveServerToolCallCancellationFromMldev(
        apiClient,
        fromToolCallCancellation,
      ),
    );
  }

  return toObject;
}

function liveServerMessageFromVertex(
  apiClient: ApiClient,
  fromObject: types.LiveServerMessage,
): types.LiveServerMessage {
  const toObject: Record<string, unknown> = {};

  const fromSetupComplete = common.getValueByPath(fromObject, [
    'setupComplete',
  ]);
  if (fromSetupComplete !== undefined) {
    common.setValueByPath(toObject, ['setupComplete'], fromSetupComplete);
  }

  const fromServerContent = common.getValueByPath(fromObject, [
    'serverContent',
  ]);
  if (fromServerContent !== undefined && fromServerContent !== null) {
    common.setValueByPath(
      toObject,
      ['serverContent'],
      liveServerContentFromVertex(apiClient, fromServerContent),
    );
  }

  const fromToolCall = common.getValueByPath(fromObject, ['toolCall']);
  if (fromToolCall !== undefined && fromToolCall !== null) {
    common.setValueByPath(
      toObject,
      ['toolCall'],
      liveServerToolCallFromVertex(apiClient, fromToolCall),
    );
  }

  const fromToolCallCancellation = common.getValueByPath(fromObject, [
    'toolCallCancellation',
  ]);
  if (
    fromToolCallCancellation !== undefined &&
    fromToolCallCancellation !== null
  ) {
    common.setValueByPath(
      toObject,
      ['toolCallCancellation'],
      liveServerToolCallCancellationFromVertex(
        apiClient,
        fromToolCallCancellation,
      ),
    );
  }

  return toObject;
}

/**
   Live class encapsulates the configuration for live interaction with the
   Generative Language API. It embeds ApiClient for general API settings.

   @experimental
  */
export class Live {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly auth: Auth,
    private readonly webSocketFactory: WebSocketFactory,
  ) {}

  /**
     Establishes a connection to the specified model with the given
     configuration and returns a Session object representing that connection.

     @experimental

     @param model - Model to use for the Live session.
     @param config - Configuration parameters for the Live session.
     @param callbacks - Optional callbacks for websocket events. If not
         provided, default no-op callbacks will be used. Generally, prefer to
         provide explicit callbacks to allow for proper handling of websocket
         events (e.g. connection errors).

     @example
     ```ts
     const session = await client.live.connect({
       model: 'gemini-2.0-flash-exp',
       config: {
         responseModalities: [Modality.AUDIO],
       },
       callbacks: {
         onopen: () => {
           console.log('Connected to the socket.');
         },
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
    params: types.LiveConnectParameters,
    callbacks?: WebSocketCallbacks,
  ): Promise<Session> {
    const websocketBaseUrl = this.apiClient.getWebsocketBaseUrl();
    const apiVersion = this.apiClient.getApiVersion();
    let url: string;
    const headers = mapToHeaders(this.apiClient.getDefaultHeaders());
    if (this.apiClient.isVertexAI()) {
      url = `${websocketBaseUrl}/ws/google.cloud.aiplatform.${
        apiVersion
      }.LlmBidiService/BidiGenerateContent`;
      await this.auth.addAuthHeaders(headers);
    } else {
      const apiKey = this.apiClient.getApiKey();
      url = `${websocketBaseUrl}/ws/google.ai.generativelanguage.${
        apiVersion
      }.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    }

    let onopenResolve: (value: unknown) => void = () => {};
    const onopenPromise = new Promise((resolve: (value: unknown) => void) => {
      onopenResolve = resolve;
    });

    const onopenAwaitedCallback = function () {
      callbacks?.onopen?.();
      onopenResolve({});
    };

    const websocketCallbacks: WebSocketCallbacks = {
      onopen: onopenAwaitedCallback,
      onmessage: callbacks?.onmessage ??
          function(e: MessageEvent) {
            void e;
          },
      onerror: callbacks?.onerror ??
          function(e: ErrorEvent) {
            void e;
          },
      onclose: callbacks?.onclose ??
          function(e: CloseEvent) {
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

    let transformedModel = t.tModel(this.apiClient, params.model);
    if (
      this.apiClient.isVertexAI() &&
      transformedModel.startsWith('publishers/')
    ) {
      const project = this.apiClient.getProject();
      const location = this.apiClient.getLocation();
      transformedModel =
        `projects/${project}/locations/${location}/` + transformedModel;
    }

    let clientMessage: types.LiveClientMessage = {};
    const liveConnectParameters: types.LiveConnectParameters = {
      model: transformedModel,
      config: params.config,
    };
    if (this.apiClient.isVertexAI()) {
      clientMessage = liveConnectParametersToVertex(
        this.apiClient,
        liveConnectParameters,
      );
    } else {
      clientMessage = liveConnectParametersToMldev(
        this.apiClient,
        liveConnectParameters,
      );
    }

    conn.send(JSON.stringify(clientMessage));
    return new Session(conn, this.apiClient);
  }
}

/**
   Represents a connection to the API.

   @experimental
  */
export class Session {
  onmessage?: (msg: types.LiveServerMessage) => void;

  constructor(
    readonly conn: WebSocket,
    private readonly apiClient: ApiClient,
  ) {
    conn.setOnMessageCallback((event: MessageEvent) => {
      try {
        void this.handleMessage(event);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private async handleMessage(event: MessageEvent) {
    if (!this.onmessage) {
      return;
    }
    let serverMessage: types.LiveServerMessage;
    let data: types.LiveServerMessage;
    if (event.data instanceof Blob) {
      data = JSON.parse(await event.data.text()) as types.LiveServerMessage;
    } else {
      data = JSON.parse(event.data) as types.LiveServerMessage;
    }
    if (this.apiClient.isVertexAI()) {
      serverMessage = liveServerMessageFromVertex(this.apiClient, data);
    } else {
      serverMessage = liveServerMessageFromMldev(this.apiClient, data);
    }
    this.onmessage(serverMessage);
  }

  private tLiveClientContent(
      apiClient: ApiClient,
      params: types.SessionSendClientContentParameters,
      ): types.LiveClientMessage {
    if (params.turns !== null && params.turns !== undefined) {
      let contents: types.Content[] = [];
      try {
        contents = t.tContents(apiClient, params.turns as types.ContentListUnion)
        if (apiClient.isVertexAI()){
            contents = contents.map((item) => contentToVertex(apiClient, item))
        } else {
            contents = contents.map((item) => contentToMldev(apiClient, item))
        }
      } catch {
        throw new Error(
            `Failed to parse client content "turns", type: '${
                typeof params.turns}'`,
        );
      }
      return {
        clientContent: {turns: contents, turnComplete: params.turnComplete},
      };
    }

    return {
        clientContent: {turnComplete: params.turnComplete},
    };
  }

  private tLiveClientRealtimeInput(
      apiClient: ApiClient,
      params: types.SessionSendRealtimeInputParameters,
      ): types.LiveClientMessage {
    let clientMessage: types.LiveClientMessage = {};
    if (!('media' in params) || !params.media){
      throw new Error(
        `Failed to convert realtime input "media", type: '${
            typeof params.media}'`,
      );
    }

    // LiveClientRealtimeInput
    clientMessage = {realtimeInput: {mediaChunks: [params.media]}};
    return clientMessage;
  }

  private tLiveClienttToolResponse(
      apiClient: ApiClient,
      params: types.SessionSendToolResponseParameters,
      ): types.LiveClientMessage {
    let functionResponses: types.FunctionResponse[] = [];

    if (params.functionResponses == null) {
      throw new Error('functionResponses is required.');
    }

    if (!Array.isArray(params.functionResponses)) {
      functionResponses = [params.functionResponses];
    }

    if (functionResponses.length === 0){
      throw new Error('functionResponses is required.');
    }

    for (const functionResponse of functionResponses) {
      if (typeof functionResponse !== 'object' || functionResponse === null ||
          !('name' in functionResponse) || !('response' in functionResponse)) {
            throw new Error(
              `Could not parse function response, type '${
                  typeof functionResponse}'.`,
          );
        }
        if (!apiClient.isVertexAI() && !('id' in functionResponse)) {
          throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
        }
    }

    const clientMessage: types.LiveClientMessage = {
      toolResponse: {functionResponses: functionResponses}
    };
    return clientMessage;
  }

  /**
    Send a message over the established connection.

    @param params - Contains two **optional** properties, `turns` and `turnComplete`. 

      - `turns` will be converted to a `Content[]`
      - `turnComplete: true` indicates that you are done sending content and expect a response.

    @experimental

    @remanks
    There are two ways to send messages to the live API:
    `sendClientContent` and `sendRealtimeInput`.

    `sendClientContent` messages are added to the model context **in order**.
    Having a conversation using `sendClientContent` messages is roughly equivalent to
    using the `Chat.sendMessageStream`,
    except that the state of the `chat` history is stored on the API server instead of locally.

    Because of `sendClientContent`'s order guarantee, the model cannot respons as quickly to
    `sendClientContent` messages as to `sendRealtimeInput` messages. This makes the biggest
    difference when sending objects that have significant preprocessing time (typically images).

    The `sendClientContent` message sends a `Content[]`
    which has more options than the `Blob` sent by `sendRealtimeInput`.

    So the main use-cases for `sendClientContent` over `sendRealtimeInput` are:

    - Sending anything that can't be represented as a `Blob` (text, `sendClientContent({turns="Hello?"}`)).
    - Managing turns when not using audio input and voice activity detection.
      (`sendClientContent({turnComplete:true})` or the short form `sendClientContent()`)
    - Prefilling a conversation context
      ```
      sendClientContent({
          turns: [
            Content({role:user, parts:...}),
            Content({role:user, parts:...}),
            ...
          ]
      })
      ```
    @experimental
   */
  sendClientContent(params: types.SessionSendClientContentParameters) {
    if (params.turns == null && params.turnComplete == null) {
      params = {
        turnComplete: true,
      };
    }
    const clientMessage: types.LiveClientMessage =
        this.tLiveClientContent(this.apiClient, params);
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
    Send a realtime message over the established connection.

    @param params - Contains one property, `media`. 

      - `media` will be converted to a `Blob`

    @experimental

    @remanks
    Use `sendRealtimeInput` for realtime audio chunks and video frames (images).

    With `sendRealtimeInput` the api will respond to audio automatically 
    based on voice activity detection (VAD). 

    `sendRealtimeInput` is optimized for responsivness at the expense of 
    deterministic ordering guarantees. Audio and video tokens are to the
    context when they become available. 

    Note: The Call signature expects a `Blob` object, but only a subset
    of audio and image mimetypes are allowed.
   */
  sendRealtimeInput(params: types.SessionSendRealtimeInputParameters) {
    if (params.media == null) {
      throw new Error('Media is required.');
    }

    const clientMessage: types.LiveClientMessage = this.tLiveClientRealtimeInput(
        this.apiClient,
        params,
    );
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
    Send a function response message over the established connection.

    @param params - Contains property `functionResponses`. 

      - `functionResponses` will be converted to a `functionResponses[]`

    @remanks
    Use `sendFunctionResponse` to reply to `LiveServerToolCall` from the server.

    Use {@link LiveConnectConfig#tools} to configure the callable functions.

    @experimental
   */
  sendToolResponse(params: types.SessionSendToolResponseParameters) {
    if (params.functionResponses == null) {
      throw new Error('Tool response parameters are required.');
    }

    const clientMessage: types.LiveClientMessage = this.tLiveClienttToolResponse(
        this.apiClient,
        params,
    );
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
     Terminates the WebSocket connection.

     @experimental

     @example
     ```ts
     const session = await client.live.connect({
       model: 'gemini-2.0-flash-exp',
       config: {
         responseModalities: [Modality.AUDIO],
       }
     });

     session.close();
     ```
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
