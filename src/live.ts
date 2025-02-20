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
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

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
  if (fromSystemInstruction !== undefined) {
    common.setValueByPath(
      toObject,
      ['systemInstruction'],
      contentToMldev(apiClient, fromSystemInstruction, toObject),
    );
  }

  const fromTools = common.getValueByPath(fromObject, ['tools']);
  if (fromTools !== undefined && fromTools !== null) {
    common.setValueByPath(
      toObject,
      ['tools'],
      fromTools.map((item: any) => {
        return toolToMldev(apiClient, item, toObject);
      }),
    );
  }

  return toObject;
}

function liveConnectConfigToVertex(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

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
  if (fromSystemInstruction !== undefined) {
    common.setValueByPath(
      toObject,
      ['systemInstruction'],
      contentToVertex(apiClient, fromSystemInstruction, toObject),
    );
  }

  const fromTools = common.getValueByPath(fromObject, ['tools']);
  if (fromTools !== undefined && fromTools !== null) {
    common.setValueByPath(
      toObject,
      ['tools'],
      fromTools.map((item: any) => {
        return toolToVertex(apiClient, item, toObject);
      }),
    );
  }

  return toObject;
}

function liveConnectParametersToMldev(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromConfig = common.getValueByPath(fromObject, ['config']);
  if (fromConfig !== undefined) {
    common.setValueByPath(
      toObject,
      ['setup'],
      liveConnectConfigToMldev(apiClient, fromConfig, toObject),
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
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromConfig = common.getValueByPath(fromObject, ['config']);
  if (fromConfig !== undefined) {
    common.setValueByPath(
      toObject,
      ['setup'],
      liveConnectConfigToVertex(apiClient, fromConfig, toObject),
    );
  }

  const fromModel = common.getValueByPath(fromObject, ['model']);
  if (fromModel !== undefined) {
    common.setValueByPath(toObject, ['setup', 'model'], fromModel);
  }

  return toObject;
}

function liveServerSetupCompleteFromMldev(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  return toObject;
}

function liveServerSetupCompleteFromVertex(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  return toObject;
}

function liveServercontentFromMldev(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromModelTurn = common.getValueByPath(fromObject, ['modelTurn']);
  if (fromModelTurn !== undefined) {
    common.setValueByPath(
      toObject,
      ['modelTurn'],
      contentFromMldev(apiClient, fromModelTurn, toObject),
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

function liveServercontentFromVertex(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromModelTurn = common.getValueByPath(fromObject, ['modelTurn']);
  if (fromModelTurn !== undefined) {
    common.setValueByPath(
      toObject,
      ['modelTurn'],
      contentFromVertex(apiClient, fromModelTurn, toObject),
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
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

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
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

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
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromFunctionCalls = common.getValueByPath(fromObject, [
    'functionCalls',
  ]);
  if (fromFunctionCalls !== undefined && fromFunctionCalls !== null) {
    common.setValueByPath(
      toObject,
      ['functionCalls'],
      fromFunctionCalls.map((item: any) => {
        return functionCallFromMldev(apiClient, item, toObject);
      }),
    );
  }

  return toObject;
}

function liveServerToolCallFromVertex(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromFunctionCalls = common.getValueByPath(fromObject, [
    'functionCalls',
  ]);
  if (fromFunctionCalls !== undefined && fromFunctionCalls !== null) {
    common.setValueByPath(
      toObject,
      ['functionCalls'],
      fromFunctionCalls.map((item: any) => {
        return functionCallFromVertex(apiClient, item, toObject);
      }),
    );
  }

  return toObject;
}

function liveServerToolCallCancellationFromMldev(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromIds = common.getValueByPath(fromObject, ['ids']);
  if (fromIds !== undefined) {
    common.setValueByPath(toObject, ['ids'], fromIds);
  }

  return toObject;
}

function liveServerToolCallCancellationFromVertex(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromIds = common.getValueByPath(fromObject, ['ids']);
  if (fromIds !== undefined) {
    common.setValueByPath(toObject, ['ids'], fromIds);
  }

  return toObject;
}

function liveServerMessageFromMldev(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromSetupComplete = common.getValueByPath(fromObject, [
    'setupComplete',
  ]);
  if (fromSetupComplete !== undefined) {
    common.setValueByPath(
      toObject,
      ['setupComplete'],
      liveServerSetupCompleteFromMldev(apiClient, fromSetupComplete, toObject),
    );
  }

  const fromServerContent = common.getValueByPath(fromObject, [
    'serverContent',
  ]);
  if (fromServerContent !== undefined) {
    common.setValueByPath(
      toObject,
      ['serverContent'],
      liveServercontentFromMldev(apiClient, fromServerContent, toObject),
    );
  }

  const fromToolCall = common.getValueByPath(fromObject, ['toolCall']);
  if (fromToolCall !== undefined) {
    common.setValueByPath(
      toObject,
      ['toolCall'],
      liveServerToolCallFromMldev(apiClient, fromToolCall, toObject),
    );
  }

  const fromToolCallCancellation = common.getValueByPath(fromObject, [
    'toolCallCancellation',
  ]);
  if (fromToolCallCancellation !== undefined) {
    common.setValueByPath(
      toObject,
      ['toolCallCancellation'],
      liveServerToolCallCancellationFromMldev(
        apiClient,
        fromToolCallCancellation,
        toObject,
      ),
    );
  }

  return toObject;
}

function liveServerMessageFromVertex(
  apiClient: ApiClient,
  fromObject: any,
  parentObject?: any,
): Record<string, any> {
  const toObject: Record<string, any> = {};

  const fromSetupComplete = common.getValueByPath(fromObject, [
    'setupComplete',
  ]);
  if (fromSetupComplete !== undefined) {
    common.setValueByPath(
      toObject,
      ['setupComplete'],
      liveServerSetupCompleteFromVertex(apiClient, fromSetupComplete, toObject),
    );
  }

  const fromServerContent = common.getValueByPath(fromObject, [
    'serverContent',
  ]);
  if (fromServerContent !== undefined) {
    common.setValueByPath(
      toObject,
      ['serverContent'],
      liveServercontentFromVertex(apiClient, fromServerContent, toObject),
    );
  }

  const fromToolCall = common.getValueByPath(fromObject, ['toolCall']);
  if (fromToolCall !== undefined) {
    common.setValueByPath(
      toObject,
      ['toolCall'],
      liveServerToolCallFromVertex(apiClient, fromToolCall, toObject),
    );
  }

  const fromToolCallCancellation = common.getValueByPath(fromObject, [
    'toolCallCancellation',
  ]);
  if (fromToolCallCancellation !== undefined) {
    common.setValueByPath(
      toObject,
      ['toolCallCancellation'],
      liveServerToolCallCancellationFromVertex(
        apiClient,
        fromToolCallCancellation,
        toObject,
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

     @param model - Model to use for the Live session.
     @param config - Configuration parameters for the Live session.
     @param callbacks - Optional callbacks for websocket events. If not
         provided, default no-op callbacks will be used. Generally, prefer to
         provide explicit callbacks to allow for proper handling of websocket
         events (e.g. connection errors).
    */
  async connect(
    model: string,
    config: types.LiveConnectConfig,
    callbacks?: WebSocketCallbacks,
  ): Promise<Session> {
    const websocketBaseUrl = this.apiClient.getWebsocketBaseUrl();
    const apiVersion = this.apiClient.getApiVersion();
    let url: string;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
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

    let onopenResolve: () => void;
    const onopenPromise = new Promise((resolve: any) => {
      onopenResolve = resolve;
    });

    const onopenAwaitedCallback = function () {
      callbacks?.onopen?.();
      onopenResolve();
    };

    const websocketCallbacks: WebSocketCallbacks = {
      onopen: onopenAwaitedCallback,
      onmessage: callbacks?.onmessage ?? function (e: any) {},
      onerror: callbacks?.onerror ?? function (e: any) {},
      onclose: callbacks?.onclose ?? function (e: any) {},
    };

    const conn = this.webSocketFactory.create(
      url,
      headersToMap(headers),
      websocketCallbacks,
    );
    conn.connect();
    // Wait for the websocket to open before sending requests.
    await onopenPromise;

    let transformedModel = t.tModel(this.apiClient, model);
    if (
      this.apiClient.isVertexAI() &&
      transformedModel.startsWith('publishers/')
    ) {
      const project = this.apiClient.getProject();
      const location = this.apiClient.getLocation();
      transformedModel =
        `projects/${project}/locations/${location}/` + transformedModel;
    }

    let clientMessage: Record<string, any> = {};
    const kwargs: Record<string, any> = {};
    kwargs['model'] = transformedModel;
    kwargs['config'] = config;
    if (this.apiClient.isVertexAI()) {
      clientMessage = liveConnectParametersToVertex(this.apiClient, kwargs);
    } else {
      clientMessage = liveConnectParametersToMldev(this.apiClient, kwargs);
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
    conn.setOnMessageCallback((event: any) => {
      try {
        void this.handleMessage(event);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private async handleMessage(event: any) {
    if (!this.onmessage) {
      return;
    }
    let serverMessage: Record<string, any> = {};
    let data: any;
    if (event.data instanceof Blob) {
      data = JSON.parse(await event.data.text());
    } else {
      data = JSON.parse(event.data);
    }
    if (this.apiClient.isVertexAI()) {
      serverMessage = liveServerMessageFromVertex(this.apiClient, data);
    } else {
      serverMessage = liveServerMessageFromMldev(this.apiClient, data);
    }
    this.onmessage(serverMessage);
  }

  private parseClientContent(
    apiClient: ApiClient,
    input: types.ContentListUnion | types.LiveClientContent,
    turnComplete: boolean = false,
  ): Record<string, any> {
    if (typeof input === 'string') {
      input = [input];
    }

    let clientMessage: Record<string, any> = input;
    if (Array.isArray(input) && input.some((c) => typeof c === 'string')) {
      const toObject: Record<string, any> = {};
      const contents = apiClient.isVertexAI()
        ? t
            .tContents(apiClient, input as types.ContentListUnion)
            .map((item) => contentToVertex(apiClient, item, toObject))
        : t
            .tContents(apiClient, input as types.ContentListUnion)
            .map((item) => contentToMldev(apiClient, item, toObject));

      clientMessage = {
        clientContent: {turns: contents, turnComplete: turnComplete},
      };
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'content' in input
    ) {
      clientMessage = {clientContent: input};
    } else if (
      typeof input === 'object' &&
      input !== null &&
      'turns' in input
    ) {
      // LiveClientContent
      clientMessage = {clientContent: input};
    } else {
      throw new Error(
        `Unsupported input type '${typeof input}' or input content '${input}'.`,
      );
    }

    return clientMessage;
  }

  private parseRealtimeInput(
    apiClient: ApiClient,
    input: types.LiveClientRealtimeInput,
  ): Record<string, any> {
    let clientMessage: Record<string, any> = input;
    if (typeof input === 'object' && input !== null && 'mediaChunks' in input) {
      // LiveClientRealtimeInput
      clientMessage = {realtimeInput: input};
    } else {
      throw new Error(
        `Unsupported input type '${typeof input}' or input content '${input}'.`,
      );
    }

    return clientMessage;
  }

  private parseToolResponse(
    apiClient: ApiClient,
    input:
      | types.LiveClientToolResponse
      | types.FunctionResponse
      | types.FunctionResponse[],
  ): Record<string, any> {
    if (
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

    let clientMessage: Record<string, any> = input;
    if (
      Array.isArray(input) &&
      input.some(
        (c) =>
          typeof c === 'object' && c !== null && 'name' in c && 'response' in c,
      )
    ) {
      // ToolResponse.FunctionResponse
      clientMessage = {toolResponse: {functionResponses: input}};
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
          functionResponses: input.map((c) => c),
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
   */
  sendClientContent(
    message: types.ContentListUnion | types.LiveClientContent,
    turnComplete: boolean = false,
  ) {
    const clientMessage: Record<string, any> = this.parseClientContent(
      this.apiClient,
      message,
      turnComplete,
    );
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
     Transmits a message over the established websocket connection.

     @experimental
   */
  sendRealtimeInput(message: types.LiveClientRealtimeInput) {
    const clientMessage: Record<string, any> = this.parseRealtimeInput(
      this.apiClient,
      message,
    );
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
     Transmits a message over the established websocket connection.

     @experimental
   */
  sendToolResponse(
    message:
      | types.LiveClientToolResponse
      | types.FunctionResponse
      | types.FunctionResponse[],
    turnComplete: boolean = false,
  ) {
    const clientMessage: Record<string, any> = this.parseToolResponse(
      this.apiClient,
      message,
    );
    this.conn.send(JSON.stringify(clientMessage));
  }

  /**
     Close terminates the websocket connection.

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
