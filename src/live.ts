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
     configuration. It returns a Session object representing the connection.

     @experimental

         As this is an experimental API, you need to specify API version
     "v1alpha" when creating the client as shown below:

     ```ts
      const client = new WebClient({
        apiKey,
        httpOptions: {
          apiVersion: 'v1alpha',
        },
      });
     ```

     @param model - Model to use for the Live session.
     @param config - Configuration parameters for the Live session.
     @param callbacks - Optional callbacks for websocket events. If not
         provided, default no-op callbacks will be used. Generally, prefer to
         provide explicit callbacks to allow for proper handling of websocket
         events (e.g. connection errors).

     @example
     ```ts
      const session = await client.live.connect(
        {
          model: 'gemini-2.0-flash-exp',
          config: {
            //responseModalities: [types.Modality.AUDIO],
          },
        },
        {
          onopen: () => {
            console.log('Connected to the socket.');
          },
          onmessage: (e: MessageEvent) => {
            console.log('Received message from the server: %s\n', e.data);
          },
          onerror: (e: ErrorEvent) => {
            console.log('Error occurred: %s\n', e.error);
          },
          onclose: (e: CloseEvent) => {
            console.log('Connection closed.');
          },
        },
      );
      session.send('Hello what should we talk about?', true);
      const setupMessage = await receive(session);

      const message = await receive(session);

      session.close();
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
      onmessage: callbacks?.onmessage ?? function (e: MessageEvent) {},
      onerror: callbacks?.onerror ?? function (e: ErrorEvent) {},
      onclose: callbacks?.onclose ?? function (e: CloseEvent) {},
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
   Session class represents a connection to the API.

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

  private parseClientMessage(
    apiClient: ApiClient,
    input:
      | types.ContentListUnion
      | types.LiveClientContent
      | types.LiveClientRealtimeInput
      | types.LiveClientToolResponse
      | types.FunctionResponse
      | types.FunctionResponse[],
    turnComplete: boolean = false,
  ): types.LiveClientMessage {
    if (typeof input === 'object' && input !== null && 'setup' in input) {
      throw new Error(
        "Message type 'setup' is not supported in send(). Use connect() instead.",
      );
    }
    if (typeof input === 'string') {
      input = [input];
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'name' in input &&
      'response' in input
    ) {
      // ToolResponse.FunctionResponse
      if (!apiClient.isVertexAI() && !('id' in input)) {
        throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
      }
      input = [input];
    }

    let clientMessage: types.LiveClientMessage = {};
    if (
      Array.isArray(input) &&
      input.some(
        (c) =>
          typeof c === 'object' && c !== null && 'name' in c && 'response' in c,
      )
    ) {
      // ToolResponse.FunctionResponse
      clientMessage = {
        toolResponse: {functionResponses: input as types.FunctionResponse[]},
      };
    } else if (
      Array.isArray(input) &&
      input.some((c) => typeof c === 'string')
    ) {
      const contents = apiClient.isVertexAI()
        ? t
            .tContents(apiClient, input as types.ContentListUnion)
            .map((item) => contentToVertex(apiClient, item))
        : t
            .tContents(apiClient, input as types.ContentListUnion)
            .map((item) => contentToMldev(apiClient, item));

      clientMessage = {
        clientContent: {turns: contents, turnComplete: turnComplete},
      };
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'content' in input
    ) {
      clientMessage = {clientContent: input as types.LiveClientContent};
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'mediaChunks' in input
    ) {
      // LiveClientRealtimeInput
      clientMessage = {realtimeInput: input};
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'turns' in input
    ) {
      // LiveClientContent
      clientMessage = {clientContent: input};
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'functionResponses' in input
    ) {
      // LiveClientToolResponse
      if (!apiClient.isVertexAI() && !input.functionResponses![0].id) {
        throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
      }
      clientMessage = {toolResponse: input};
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'name' in input &&
      'response' in input
    ) {
      // FunctionResponse
      if (!apiClient.isVertexAI() && !input.id) {
        throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
      }
      clientMessage = {
        toolResponse: {
          functionResponses: [input],
        },
      };
    } else if (
      Array.isArray(input) &&
      typeof input[0] === 'object' &&
      input[0] !== null &&
      'name' in input[0] &&
      'response' in input[0]
    ) {
      // FunctionResponse[]
      if (!apiClient.isVertexAI() && !input[0].id) {
        throw new Error(FUNCTION_RESPONSE_REQUIRES_ID);
      }
      clientMessage = {
        toolResponse: {
          functionResponses: input.map((c) => c as types.FunctionResponse),
        },
      };
    } else {
      throw new Error(
        `Unsupported input type '${typeof input}' or input content '${input}'.`,
      );
    }

    return clientMessage;
  }

  /**
     Transmits a message over the established websocket connection.

     @experimental

     @example
     ```ts
     const session = await client.live.connect({
       model: 'gemini-2.0-flash-exp',
       config: {
         responseModalities: [Modality.AUDIO],
       }
     });

     session.send('Hello world!');
     ```
   */
  send(
    message:
      | types.ContentListUnion
      | types.LiveClientContent
      | types.LiveClientRealtimeInput
      | types.LiveClientToolResponse
      | types.FunctionResponse
      | types.FunctionResponse[],
    turnComplete: boolean = false,
  ) {
    const clientMessage: types.LiveClientMessage = this.parseClientMessage(
      this.apiClient,
      message,
      turnComplete,
    );
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
     Close terminates the websocket connection.

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
