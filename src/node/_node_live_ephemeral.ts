/**
 * @fileoverview A description of this module.  What would someone
 * new to your team want to know about the code in this file?
 */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Live client.
 *
 * @experimental
 */

import * as t from '../_transformers.js';
import * as converters from '../converters/_live_converters.js';
import {
  handleWebSocketMessage,
  headersToMap,
  mapToHeaders,
  Session,
} from '../live.js';
import {hasMcpToolUsage, setMcpUsageHeader} from '../mcp/_mcp.js';
import * as types from '../types.js';

import {WebSocketCallbacks} from '../_websocket.js';
import {GoogleGenAI} from './node_client.js';

/**
     Establishes a connection with the ephermeral token to the specified model
   with the given configuration and returns a Session object representing that
   connection.

     @experimental

     @remarks

     @param params - The parameters for establishing a connection to the model.
     @return A live session.

     @example
     ```ts
     let model: string;
     model = 'gemini-2.0-flash-live-001';

     const session = await liveEphemeralConnect({
       accessToken: 'auth_tokens/123',
       model: model,
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
export async function liveEphemeralConnect(
  params: types.LiveEphemeralConnectParameters,
): Promise<Session> {
  let httpOptions: types.HttpOptions | undefined;
  if (params.config?.httpOptions) {
    httpOptions = params.config?.httpOptions;
  }
  let baseUrl: string;
  if (httpOptions && httpOptions?.baseUrl) {
    baseUrl = httpOptions?.baseUrl;
  } else {
    baseUrl = 'https://generativelanguage.googleapis.com';
  }
  let apiVersion: string;
  if (httpOptions && httpOptions?.apiVersion) {
    apiVersion = httpOptions?.apiVersion;
  } else {
    apiVersion = 'v1beta';
  }

  const internalClient = new GoogleGenAI({
    vertexai: false,
    apiKey: 'DUMMY_KEY',
    apiVersion: apiVersion,
    httpOptions: {apiVersion: apiVersion, baseUrl: baseUrl},
  });

  const websocketBaseUrl = internalClient['apiClient'].getWebsocketBaseUrl();

  const defaultHeaders = internalClient['apiClient'].getDefaultHeaders();
  if (
    params.config &&
    params.config.tools &&
    hasMcpToolUsage(params.config.tools)
  ) {
    setMcpUsageHeader(defaultHeaders);
  }
  const headers = mapToHeaders(internalClient['apiClient'].getDefaultHeaders());
  const authToken = params.accessToken;
  const url: string = `${websocketBaseUrl}/ws/google.ai.generativelanguage.${
    apiVersion
  }.GenerativeService.BidiGenerateContentConstrained?access_token=${authToken}`;

  let onopenResolve: (value: unknown) => void = () => {};
  const onopenPromise = new Promise((resolve: (value: unknown) => void) => {
    onopenResolve = resolve;
  });

  const callbacks: types.LiveCallbacks = params.callbacks;

  const onopenAwaitedCallback = function () {
    callbacks?.onopen?.();
    onopenResolve({});
  };

  const websocketCallbacks: WebSocketCallbacks = {
    onopen: onopenAwaitedCallback,
    onmessage: (event: MessageEvent) => {
      void handleWebSocketMessage(
        internalClient['apiClient'],
        callbacks.onmessage,
        event,
      );
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
  const conn = internalClient.live.webSocketFactory.create(
    url,
    headersToMap(headers),
    websocketCallbacks,
  );
  conn.connect();
  // Wait for the websocket to open before sending requests.
  await onopenPromise;
  const transformedModel = t.tModel(internalClient['apiClient'], params.model);

  if (params.config?.generationConfig) {
    // Raise deprecation warning for generationConfig.
    console.warn(
      'Setting `LiveConnectConfig.generation_config` is deprecated, please set the fields on `LiveConnectConfig` directly. This will become an error in a future version (not before Q3 2025).',
    );
  }
  const liveConnectParameters: types.LiveConnectParameters = {
    model: transformedModel,
    config: params.config,
    callbacks: params.callbacks,
  };
  let clientMessage: Record<string, unknown> = {};
  clientMessage = converters.liveConnectParametersToMldev(
    internalClient['apiClient'],
    liveConnectParameters,
  );
  delete clientMessage['config'];
  conn.send(JSON.stringify(clientMessage));
  return new Session(conn, internalClient['apiClient']);
}
