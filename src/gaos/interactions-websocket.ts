/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * g3-prettier-ignore-file
 */

import type {
  WebSocket,
  WebSocketCallbacks,
  WebSocketFactory,
} from "../_websocket.js";
import { GoogleGenAICore } from "./core.js";
import type { GoogleGenAIRequestOptions } from "./google-genai.js";
import { GOOGLE_GENAI_API_REVISION } from "./hooks/google-genai-auth.js";
import type { InteractionWebRTCTransport } from "./interactions-webrtc.js";
import { APIConnectionError } from "./lib/compat-errors.js";
import { encodeJSON, encodeSimple } from "./lib/encodings.js";
import { type Fetcher, matchStatusCode } from "./lib/http.js";
import * as M from "./lib/matchers.js";
import { compactMap } from "./lib/primitives.js";
import { RequestOptions } from "./lib/sdks.js";
import { extractSecurity, resolveGlobalSecurity } from "./lib/security.js";
import { pathToFunc } from "./lib/url.js";
import { GoogleGenAiError } from "./models/errors/google-gen-ai-error.js";
import {
  ConnectionError,
  InvalidRequestError,
  RequestAbortedError,
  RequestTimeoutError,
  UnexpectedClientError,
} from "./models/errors/http-client-errors.js";
import type { Content } from "./models/interactions/content.js";
import type { Empty } from "./models/interactions/empty.js";
import type { Environment } from "./models/interactions/environment.js";
import type { ErrorEvent } from "./models/interactions/error-event.js";
import type { ImageContent } from "./models/interactions/image-content.js";
import type { ResponseFormat } from "./models/interactions/response-format.js";
import type { ResponseModality } from "./models/interactions/response-modality.js";
import type { ServiceTier } from "./models/interactions/service-tier.js";
import type { Status } from "./models/interactions/status.js";
import type { Step } from "./models/interactions/step.js";
import type { StepDelta } from "./models/interactions/step-delta.js";
import type { StepStart } from "./models/interactions/step-start.js";
import type { StepStop } from "./models/interactions/step-stop.js";
import type { TextContent } from "./models/interactions/text-content.js";
import type { Tool } from "./models/interactions/tool.js";
import type { WebhookConfig } from "./models/interactions/webhook-config.js";
import { APICall, APIPromise } from "./types/async.js";
import { Result } from "./types/fp.js";

export type { ErrorEvent, ImageContent, TextContent };

// ---------------------------------------------------------------------------
// Live Interactions Wire Models & Auth Token Operations
// ---------------------------------------------------------------------------

export type InteractionAuthToken = {
  /**
   * The auth token.
   */
  auth_token?: string | undefined;
  /**
   * Expiration time of the auth token.
   */
  expires_at?: string | undefined;
};

export type InteractionAuthTokenCreateParams = {
  /**
   * Hard deadline - messages rejected after this time.
   */
  expire_time?: string | undefined;
};

export type CreateInteractionAuthTokenParams =
  InteractionAuthTokenCreateParams & {
    api_version?: string | undefined;
  };

export type DeleteInteractionAuthTokenParams = {
  api_version?: string | undefined;
};

/**
 * Creates a new auth token for an interaction.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export function interactionsAuthTokensCreate(
  client: GoogleGenAICore,
  id: string,
  body: InteractionAuthTokenCreateParams,
  api_version?: string | undefined,
  options?: RequestOptions,
): APIPromise<
  Result<
    InteractionAuthToken,
    | GoogleGenAiError
    | ConnectionError
    | RequestAbortedError
    | RequestTimeoutError
    | InvalidRequestError
    | UnexpectedClientError
  >
> {
  return new APIPromise($doAuthTokensCreate(client, id, body, api_version, options));
}

async function $doAuthTokensCreate(
  client: GoogleGenAICore,
  id: string,
  body: InteractionAuthTokenCreateParams,
  api_version?: string | undefined,
  options?: RequestOptions,
): Promise<
  [
    Result<
      InteractionAuthToken,
      | GoogleGenAiError
      | ConnectionError
      | RequestAbortedError
      | RequestTimeoutError
      | InvalidRequestError
      | UnexpectedClientError
    >,
    APICall,
  ]
> {
  const payload = {
    id,
    body,
    api_version,
  };

  const bodyPayload = encodeJSON("body", payload.body, { explode: true });

  const pathParams = {
    api_version: encodeSimple(
      "api_version",
      payload.api_version ?? client._options.api_version,
      { explode: false, charEncoding: "percent" },
    ),
    interactionsId: encodeSimple("interactionsId", payload.id, {
      explode: false,
      charEncoding: "percent",
    }),
  };
  const path = pathToFunc(
    "/{api_version}/interactions/{interactionsId}/auth_tokens",
  )(pathParams);

  const headers = new Headers(
    compactMap({
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
  );

  const securityInput = await extractSecurity(client._options.security);
  const requestSecurity = resolveGlobalSecurity(securityInput);

  const context = {
    options: client._options,
    base_url: options?.server_url ?? client._baseURL ?? "",
    operation_id: "createInteractionAuthToken",
    o_auth2_scopes: null,
    resolved_security: requestSecurity,
    security_source: client._options.security,
    retry_config:
      options?.retries ||
      client._options.retry_config || {
        strategy: "attempt-count-backoff",
        backoff: {
          initialInterval: 500,
          maxInterval: 8000,
          exponent: 2,
          maxElapsedTime: 30000,
        },
        retryConnectionErrors: true,
        maxRetries: 4,
      } || { strategy: "none" },
    retry_codes: options?.retry_codes || ["408", "409", "429", "5XX"],
  };

  const requestRes = client._createRequest(
    context,
    {
      security: requestSecurity,
      method: "POST",
      baseURL: options?.server_url,
      path: path,
      headers: headers,
      body: bodyPayload,
      userAgent: client._options.user_agent,
      timeout_ms: options?.timeout_ms || client._options.timeout_ms || -1,
    },
    options,
  );
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;

  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode: number) =>
      matchStatusCode({ status: statusCode } as Response, ["4XX", "5XX"]),
    retryConfig: context.retry_config,
    retryCodes: context.retry_codes,
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;

  const responseFields = {
    httpMeta: { response: response, request: req },
  };

  const [result] = await M.match<
    InteractionAuthToken,
    | GoogleGenAiError
    | ConnectionError
    | RequestAbortedError
    | RequestTimeoutError
    | InvalidRequestError
    | UnexpectedClientError
  >(
    M.json<InteractionAuthToken>(200),
    M.fail(["4XX", "5XX"]),
  )(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }

  return [result, { status: "complete", request: req, response }];
}

/**
 * Deletes an auth token for an interaction.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export function interactionsAuthTokensDelete(
  client: GoogleGenAICore,
  id: string,
  auth_token: string,
  api_version?: string | undefined,
  options?: Omit<RequestOptions, "extra_body">,
): APIPromise<
  Result<
    Empty,
    | GoogleGenAiError
    | ConnectionError
    | RequestAbortedError
    | RequestTimeoutError
    | InvalidRequestError
    | UnexpectedClientError
  >
> {
  return new APIPromise(
    $doAuthTokensDelete(client, id, auth_token, api_version, options),
  );
}

async function $doAuthTokensDelete(
  client: GoogleGenAICore,
  id: string,
  auth_token: string,
  api_version?: string | undefined,
  options?: Omit<RequestOptions, "extra_body">,
): Promise<
  [
    Result<
      Empty,
      | GoogleGenAiError
      | ConnectionError
      | RequestAbortedError
      | RequestTimeoutError
      | InvalidRequestError
      | UnexpectedClientError
    >,
    APICall,
  ]
> {
  const payload = {
    id,
    auth_token,
    api_version,
  };

  const pathParams = {
    api_version: encodeSimple(
      "api_version",
      payload.api_version ?? client._options.api_version,
      { explode: false, charEncoding: "percent" },
    ),
    auth_tokensId: encodeSimple("auth_tokensId", payload.auth_token, {
      explode: false,
      charEncoding: "percent",
    }),
    interactionsId: encodeSimple("interactionsId", payload.id, {
      explode: false,
      charEncoding: "percent",
    }),
  };
  const path = pathToFunc(
    "/{api_version}/interactions/{interactionsId}/auth_tokens/{auth_tokensId}",
  )(pathParams);

  const headers = new Headers(
    compactMap({
      Accept: "application/json",
    }),
  );

  const securityInput = await extractSecurity(client._options.security);
  const requestSecurity = resolveGlobalSecurity(securityInput);

  const context = {
    options: client._options,
    base_url: options?.server_url ?? client._baseURL ?? "",
    operation_id: "deleteInteractionAuthToken",
    o_auth2_scopes: null,
    resolved_security: requestSecurity,
    security_source: client._options.security,
    retry_config:
      options?.retries ||
      client._options.retry_config || {
        strategy: "attempt-count-backoff",
        backoff: {
          initialInterval: 500,
          maxInterval: 8000,
          exponent: 2,
          maxElapsedTime: 30000,
        },
        retryConnectionErrors: true,
        maxRetries: 4,
      } || { strategy: "none" },
    retry_codes: options?.retry_codes || ["408", "409", "429", "5XX"],
  };

  const requestRes = client._createRequest(
    context,
    {
      security: requestSecurity,
      method: "DELETE",
      baseURL: options?.server_url,
      path: path,
      headers: headers,
      body: null,
      userAgent: client._options.user_agent,
      timeout_ms: options?.timeout_ms || client._options.timeout_ms || -1,
    },
    options,
  );
  if (!requestRes.ok) {
    return [requestRes, { status: "invalid" }];
  }
  const req = requestRes.value;

  const doResult = await client._do(req, {
    context,
    isErrorStatusCode: (statusCode: number) =>
      matchStatusCode({ status: statusCode } as Response, ["4XX", "5XX"]),
    retryConfig: context.retry_config,
    retryCodes: context.retry_codes,
  });
  if (!doResult.ok) {
    return [doResult, { status: "request-error", request: req }];
  }
  const response = doResult.value;

  const responseFields = {
    httpMeta: { response: response, request: req },
  };

  const [result] = await M.match<
    Empty,
    | GoogleGenAiError
    | ConnectionError
    | RequestAbortedError
    | RequestTimeoutError
    | InvalidRequestError
    | UnexpectedClientError
  >(
    M.json<Empty>(200),
    M.fail(["4XX", "5XX"]),
  )(response, req, { extraFields: responseFields });
  if (!result.ok) {
    return [result, { status: "complete", request: req, response }];
  }

  return [result, { status: "complete", request: req, response }];
}


export type InputDeliveryMode = "queue" | "immediate" | "silent" | "blocking";

export type AudioStream = {
  id?: string | undefined;
  mime_type?: string | undefined;
};

export type VadMode = "auto" | "manual" | (string & {});

export type AudioConfig = {
  input_streams?: Array<AudioStream> | undefined;
  vad_mode?: VadMode | undefined;
};

export type AudioStreamAppend = {
  data?: string | undefined;
  event_type: "input.audio.append";
  seq_num?: string | undefined;
  stream_id?: string | undefined;
  timestamp_micros?: string | undefined;
};

export type CancelInteractionEvent = {
  event_type: "interaction.cancel";
};

export type CompleteInteractionEvent = {
  event_type: "interaction.complete";
};

export type CreateInteractionEventEnvironment = Environment | string;

export type CreateInteractionEventInput =
  | Content
  | Array<Step>
  | Array<Content>
  | string;

export type CreateInteractionEventResponseFormat =
  | ResponseFormat
  | Array<ResponseFormat>;

export type CreateInteractionEvent = {
  background?: boolean | undefined;
  environment?: Environment | string | undefined;
  event_type: "interaction.create";
  input?: Content | Array<Step> | Array<Content> | string | undefined;
  model?: string | undefined;
  previous_interaction_id?: string | undefined;
  response_format?: ResponseFormat | Array<ResponseFormat> | undefined;
  response_modalities?: Array<ResponseModality> | undefined;
  service_tier?: ServiceTier | undefined;
  store?: boolean | undefined;
  system_instruction?: string | undefined;
  tools?: Array<Tool> | undefined;
  webhook_config?: WebhookConfig | undefined;
};

export type DisconnectEvent = {
  event_type: "interaction.disconnect";
};

export type FunctionInvocation = {
  arguments?: { [k: string]: any } | undefined;
  call_id?: string | undefined;
  event_type: "function_invocation";
  name?: string | undefined;
  seq_num?: string | undefined;
  timestamp_micros?: string | undefined;
};

export type FunctionResultEvent = {
  call_id?: string | undefined;
  event_type: "function_result";
  is_error?: boolean | undefined;
  name?: string | undefined;
  result?: any | undefined;
  seq_num?: string | undefined;
  timestamp_micros?: string | undefined;
};

export type InputCommitEvent = {
  event_type: "input.commit";
  seq_num?: string | undefined;
  timestamp_micros?: string | undefined;
};

export type InputEvent = {
  content?: Array<Content> | undefined;
  event_type: "input";
  mode?: InputDeliveryMode | undefined;
  seq_num?: string | undefined;
  timestamp_micros?: string | undefined;
};

export type InteractionReconnectedEvent = {
  event_type: "interaction.connected";
};

export type LiveInteractionCompletedEvent = {
  created?: string | undefined;
  event_type: "interaction.completed";
  status?: Status | undefined;
  updated?: string | undefined;
};

export type LiveInteractionCreatedEvent = {
  event_type: "interaction.created";
  interaction_id?: string | undefined;
};

export type ReconnectInteractionEvent = {
  background?: boolean | undefined;
  event_type: "interaction.connect";
  id?: string | undefined;
};

export type ClientEvent =
  | (AudioStreamAppend & { event_type: "input.audio.append" })
  | (CancelInteractionEvent & { event_type: "interaction.cancel" })
  | (CompleteInteractionEvent & { event_type: "interaction.complete" })
  | (CreateInteractionEvent & { event_type: "interaction.create" })
  | (DisconnectEvent & { event_type: "interaction.disconnect" })
  | (FunctionResultEvent & { event_type: "function_result" })
  | (InputCommitEvent & { event_type: "input.commit" })
  | (InputEvent & { event_type: "input" })
  | (ReconnectInteractionEvent & { event_type: "interaction.connect" });

export type ClientEventList = {
  events: Array<ClientEvent>;
};

export type ClientEventBatch = ClientEventList | ClientEvent;

export type ServerEvent =
  | (FunctionInvocation & { event_type: "function_invocation" })
  | (InteractionReconnectedEvent & { event_type: "interaction.connected" })
  | (LiveInteractionCompletedEvent & { event_type: "interaction.completed" })
  | (LiveInteractionCreatedEvent & { event_type: "interaction.created" })
  | StepDelta
  | StepStart
  | StepStop;

/** Default connection setup timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000;

const LIVE_INTERACTIONS_EXPERIMENTAL_WARNING =
  "GoogleGenAI.interactions: Live Interactions usage is experimental and may change in future versions.";

let liveInteractionsExperimentalWarned = false;

/**
 * Emits a one-time-per-process warning when a Live Interactions entry point is used.
 */
export function warnLiveInteractionsExperimental(): void {
  if (!liveInteractionsExperimentalWarned) {
    liveInteractionsExperimentalWarned = true;
    console.warn(LIVE_INTERACTIONS_EXPERIMENTAL_WARNING);
  }
}

/** Resets the one-time experimental warning; for tests only. */
export function resetLiveInteractionsExperimentalWarningForTesting(): void {
  liveInteractionsExperimentalWarned = false;
}

/**
 * Parameters for connecting to an interaction.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export interface InteractionConnectParams {
  /** Optional API version override (for example, `"v1alpha"` or `"v1beta"`). */
  api_version?: string;
  /**
   * Transport protocol to use for the live interaction.
   * Defaults to `"websocket"`. Pass `"webrtc"` or an `InteractionWebRTCTransport`
   * instance to connect via the `:webrtc` SDP exchange + `"events"` data channel.
   */
  transport?: "websocket" | "webrtc" | InteractionWebRTCTransport;
}

/** Internal parent client interface for Live Interactions. */
export interface InteractionParentClient {
  isVertexAI(): boolean;
  getBaseUrl(): string;
  getWebsocketBaseUrl?(): string;
  getApiVersion(): string;
  getApiKey?(): string | undefined;
  getDefaultHeaders?(): Record<string, string>;
  getHeaders?(): Record<string, string> | undefined;
  getAuthHeaders(url?: string): Headers | Promise<Headers>;
  getFetch?(): Fetcher | undefined;
  getTimeout?(): number | undefined;
}

/** Internal marker for local misuse; not re-exported from the public package entrypoint. */
export class LocalUsageError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when a live interaction WebSocket connection or frame fails. */
export class APIWebSocketError extends APIConnectionError {
  /** WebSocket close code, when the connection closed with a frame or abnormal closure. */
  readonly closeCode?: number | undefined;
  /** HTTP status code when the WebSocket upgrade handshake was rejected. */
  readonly httpStatus?: number | undefined;
  /** Sanitized upstream server error code, when reported. */
  readonly serverCode?: string | undefined;

  constructor(
    options: {
      message?: string | undefined;
      closeCode?: number | undefined;
      httpStatus?: number | undefined;
      serverCode?: string | undefined;
    } = {},
  ) {
    super({ message: options.message ?? "WebSocket connection error." });
    this.closeCode = options.closeCode;
    this.httpStatus = options.httpStatus;
    this.serverCode = options.serverCode;
  }
}

/** Sanitizes an upstream error code for setup diagnostics. */
export function setupServerCode(value: unknown): string | undefined {
  const code =
    typeof value === "number" || typeof value === "string" ? String(value) : "";
  return /^[a-zA-Z0-9_.-]{1,64}$/.test(code) ? code : undefined;
}

function validHttpStatus(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 599
    ? value
    : undefined;
}

function statusFromRecord(record: Record<string, unknown>): number | undefined {
  const direct =
    validHttpStatus(record["httpStatus"]) ??
    validHttpStatus(record["statusCode"]) ??
    validHttpStatus(record["status"]);
  if (direct !== undefined) return direct;
  if (isRecord(record["response"])) {
    const resp = record["response"];
    const fromResp =
      validHttpStatus(resp["statusCode"]) ?? validHttpStatus(resp["status"]);
    if (fromResp !== undefined) return fromResp;
  }
  if (typeof record["message"] === "string") {
    const match = /^Unexpected server response: (\d{3})$/.exec(
      record["message"].trim(),
    );
    if (match) {
      return validHttpStatus(Number(match[1]));
    }
  }
  return undefined;
}

/** Extracts an HTTP status code from a handshake or authentication error. */
export function extractUpgradeHttpStatus(value: unknown): number | undefined {
  if (!isRecord(value)) return undefined;
  const direct = statusFromRecord(value);
  if (direct !== undefined) return direct;
  const nested = value["error"];
  if (isRecord(nested)) {
    return statusFromRecord(nested);
  }
  return undefined;
}

class AsyncQueue<T> {
  private readonly values: T[] = [];
  private readonly readers: Array<{
    resolve: (result: IteratorResult<T>) => void;
    reject: (error: Error) => void;
  }> = [];
  private ended = false;
  private failure?: Error;

  push(value: T): void {
    if (this.ended || this.failure) return;
    const reader = this.readers.shift();
    if (reader) {
      reader.resolve({ done: false, value });
    } else {
      this.values.push(value);
    }
  }

  end(clearBuffered = false): void {
    if (this.failure) return;
    if (clearBuffered) {
      this.values.length = 0;
    }
    if (this.ended) return;
    this.ended = true;
    for (const reader of this.readers.splice(0)) {
      reader.resolve({ done: true, value: undefined });
    }
  }

  fail(error: Error): void {
    if (this.ended || this.failure) return;
    this.failure = error;
    for (const reader of this.readers.splice(0)) {
      reader.reject(error);
    }
  }

  next(): Promise<IteratorResult<T>> {
    const value = this.values.shift();
    if (value !== undefined) {
      return Promise.resolve({ done: false, value });
    }
    if (this.failure) return Promise.reject(this.failure);
    if (this.ended) {
      return Promise.resolve({ done: true, value: undefined });
    }
    return new Promise((resolve, reject) => {
      this.readers.push({ resolve, reject });
    });
  }
}

function dataAsText(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(data));
  }
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
  }
  return null;
}

/** Checks whether a value is a non-null plain record object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTerminalServerEvent(eventType: string): boolean {
  return (
    eventType === "interaction.completed" ||
    eventType === "interaction.canceled" ||
    eventType === "interaction.cancelled" ||
    eventType === "reconnection_required"
  );
}

/** Extracts key-value entries from a Fetch Headers instance. */
export function headerEntries(headers: Headers): Array<[string, string]> {
  const values: Array<[string, string]> = [];
  headers.forEach((value, key) => values.push([key, value]));
  return values;
}

/** Sets a header case-insensitively on a header map. */
export function setHeader(
  headers: Record<string, string>,
  name: string,
  value: string,
): void {
  removeHeader(headers, name);
  headers[name] = value;
}

/** Removes a header case-insensitively from a header map. */
export function removeHeader(headers: Record<string, string>, name: string): void {
  for (const candidate of Object.keys(headers)) {
    if (candidate.toLowerCase() === name.toLowerCase()) {
      delete headers[candidate];
    }
  }
}

/** Parsed connection options shared across live transports. */
export interface ParsedConnectOptions {
  timeout: number;
  extraHeaders?: Record<string, string> | undefined;
}

/** Validates interaction ID and extracts timeout and extra headers. */
export function parseConnectOptions(
  parentClient: InteractionParentClient,
  id: string,
  options?: GoogleGenAIRequestOptions,
): ParsedConnectOptions {
  if (!id) {
    throw new LocalUsageError(
      "A non-empty interaction ID is required to connect.",
    );
  }
  const timeout =
    options?.timeout_ms ??
    options?.timeout ??
    parentClient.getTimeout?.() ??
    DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new RangeError("timeout_ms must be positive and finite.");
  }

  let extraHeaders: Record<string, string> | undefined = undefined;
  const rawHeaders =
    options?.headers ??
    options?.fetch_options?.headers ??
    options?.fetchOptions?.headers;
  if (rawHeaders) {
    extraHeaders = {};
    if (rawHeaders instanceof Headers) {
      for (const [k, v] of Array.from(rawHeaders.entries())) {
        extraHeaders[k] = v;
      }
    } else if (Array.isArray(rawHeaders)) {
      for (const [k, v] of rawHeaders) {
        extraHeaders[k] = v;
      }
    } else {
      for (const k of Object.keys(rawHeaders)) {
        extraHeaders[k] = rawHeaders[k];
      }
    }
  }

  return { timeout, extraHeaders };
}

function websocketURL(
  parentClient: InteractionParentClient,
  apiVersion?: string,
  authToken?: string,
): string {
  if (parentClient.isVertexAI()) {
    throw new LocalUsageError(
      "Live Interactions is currently Gemini API only.",
    );
  }
  const websocketBaseUrl = parentClient.getWebsocketBaseUrl?.();
  if (!websocketBaseUrl) {
    throw new LocalUsageError("WebSocket base URL is required.");
  }
  const url = new URL(websocketBaseUrl);
  const version = apiVersion ?? parentClient.getApiVersion();
  const basePath = url.pathname.replace(/\/+$/g, "");
  url.pathname = `${basePath}/${version}/interactions/live`;
  if (authToken !== undefined) {
    url.searchParams.set("auth_token", authToken);
  }
  return url.toString();
}

/** Builds authentication and request headers for a Live Interactions transport. */
export async function buildInteractionHeaders(
  parentClient: InteractionParentClient,
  url: string,
  extraHeaders?: Record<string, string>,
  defaults?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...defaults,
    ...parentClient.getDefaultHeaders?.(),
  };
  const apiKey = parentClient.getApiKey?.();
  if (apiKey) {
    setHeader(headers, "x-goog-api-key", apiKey);
  } else {
    for (const [name, value] of headerEntries(
      await parentClient.getAuthHeaders(url),
    )) {
      setHeader(headers, name, value);
    }
  }
  for (const source of [parentClient.getHeaders?.(), extraHeaders]) {
    for (const [name, value] of Object.entries(source ?? {})) {
      setHeader(headers, name, value);
    }
  }
  if (apiKey?.startsWith("auth_tokens/")) {
    removeHeader(headers, "authorization");
    setHeader(headers, "x-goog-api-key", apiKey);
  }
  return headers;
}

async function websocketHeaders(
  parentClient: InteractionParentClient,
  url: string,
  extraHeaders?: Record<string, string>,
  authToken?: string,
): Promise<Record<string, string>> {
  const headers = await buildInteractionHeaders(
    parentClient,
    url,
    extraHeaders,
    { "api-revision": GOOGLE_GENAI_API_REVISION },
  );
  if (authToken !== undefined) {
    removeHeader(headers, "authorization");
    removeHeader(headers, "x-goog-api-key");
  }
  return headers;
}

/** Shared base class for live interaction connections. */
export class InteractionBaseConnection {
  /** Identifier of the connected interaction. */
  id: string;

  private readonly queue = new AsyncQueue<ServerEvent | ErrorEvent>();
  private socket?: WebSocket & { flush?(): Promise<void> };
  private detached = false;
  private terminal = false;
  private receiving = false;
  private pendingClose?: Promise<void>;
  private connectionError?: APIConnectionError;

  /** @internal */
  constructor(id: string) {
    warnLiveInteractionsExperimental();
    this.id = id;
  }

  /** @internal */
  attach(socket: WebSocket & { flush?(): Promise<void> }): void {
    this.socket = socket;
  }

  private closeSocket(): void {
    const socket = this.socket;
    this.socket = undefined;
    try {
      socket?.close();
    } catch {
      // Transport teardown failures are not actionable.
    }
  }

  private finishTerminal(): void {
    this.markTerminal();
    this.closeSocket();
  }

  private async finishClientCancel(): Promise<void> {
    const socket = this.socket;
    this.markTerminal();
    if (!socket?.flush) {
      this.closeSocket();
      return;
    }
    this.pendingClose = socket.flush().finally(() => this.closeSocket());
    await this.pendingClose;
  }

  /** @internal */
  handleMessage(data: unknown): void {
    if (this.detached || this.terminal || this.connectionError) return;
    const candidates = this.decodeFrameEvents(data);
    if (!candidates) return;

    for (const candidate of candidates) {
      if (!isRecord(candidate) || typeof candidate["event_type"] !== "string") {
        this.failProtocol(
          "Live interaction server events must have an event_type.",
        );
        return;
      }
      const eventType = candidate["event_type"];
      this.queue.push(candidate as ServerEvent | ErrorEvent);
      if (isTerminalServerEvent(eventType)) {
        this.finishTerminal();
        return;
      }
    }
  }

  private markTerminal(): void {
    this.terminal = true;
    this.queue.end();
  }

  private decodeFrameEvents(data: unknown): unknown[] | null {
    const text = dataAsText(data);
    if (text === null) {
      this.failProtocol(
        "Live interaction server frames must contain UTF-8 JSON text.",
      );
      return null;
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(text);
    } catch {
      this.failProtocol(
        "Live interaction server frames must contain valid JSON.",
      );
      return null;
    }
    if (isRecord(decoded) && Array.isArray(decoded["events"])) {
      return decoded["events"];
    }
    return [decoded];
  }

  protected newConnectionError(options: {
    message: string;
    closeCode?: number | undefined;
    httpStatus?: number | undefined;
    serverCode?: string | undefined;
  }): APIConnectionError {
    return new APIWebSocketError(options);
  }

  private failProtocol(message: string): void {
    const error = this.newConnectionError({ message });
    this.connectionError = error;
    this.queue.fail(error);
    this.detach();
  }

  /** @internal */
  handleTransportError(): void {
    if (this.detached || this.terminal || this.connectionError) return;
    this.connectionError = this.newConnectionError({
      message: "The live interaction connection closed with code 1006.",
      closeCode: 1006,
    });
    this.queue.fail(this.connectionError);
    this.closeSocket();
  }

  /** @internal */
  handleClose(code = 1006): void {
    if (this.detached || this.terminal) {
      this.queue.end();
    } else if (!this.connectionError) {
      this.connectionError = this.newConnectionError({
        message: `The live interaction connection closed with code ${code}.`,
        closeCode: code,
      });
      this.queue.fail(this.connectionError);
    }
    this.closeSocket();
  }

  private ensureWritable(): WebSocket {
    if (this.connectionError) throw this.connectionError;
    if (this.terminal) {
      throw new Error("This live interaction is already terminal.");
    }
    if (this.detached) {
      throw new Error("This live interaction is detached.");
    }
    if (!this.socket) {
      throw new Error("This live interaction is not connected.");
    }
    return this.socket;
  }

  private sendEvent(event: Record<string, unknown>): void {
    const socket = this.ensureWritable();
    const encoded = JSON.stringify(event);
    try {
      socket.send(encoded);
    } catch (error) {
      if (error instanceof RangeError || error instanceof LocalUsageError) {
        throw error;
      }
      // Delivery is uncertain; fail closed without replaying the frame or
      // exposing transport exceptions that may retain authentication data.
      this.connectionError ??= this.newConnectionError({
        message: "The live interaction connection closed with code 1006.",
        closeCode: 1006,
      });
      this.queue.fail(this.connectionError);
      this.detach();
      throw this.connectionError;
    }
  }

  /** @internal Initial lifecycle frame used only during connect(). */
  sendInitial(event: Record<string, unknown>): void {
    this.sendEvent(event);
  }

  /** Sends text, one client event, or a list of client events. */
  async send(
    input:
      | string
      | ClientEvent
      | (Record<string, unknown> & { event_type: string })
      | Array<ClientEvent | (Record<string, unknown> & { event_type: string })>,
  ): Promise<void> {
    if (typeof input === "string") {
      this.sendEvent({
        event_type: "input",
        content: [{ type: "text", text: input }],
      });
      return;
    }
    if (Array.isArray(input)) {
      if (!input.length) {
        throw new LocalUsageError("Empty client event batch.");
      }
      const events = input.map((event) => ensureRecord(event));
      this.sendEvent({ events });
      if (events.some((event) => event["event_type"] === "interaction.cancel")) {
        await this.finishClientCancel();
      }
      return;
    }
    const record = ensureRecord(input);
    if (
      record["event_type"] === "interaction.cancel" &&
      !this.connectionError &&
      this.terminal
    ) {
      await this.pendingClose;
      return;
    }
    this.sendEvent(record);
    if (record["event_type"] === "interaction.cancel") {
      await this.finishClientCancel();
    }
  }

  /** Yields server events continuously until the interaction terminates or detaches. */
  async *receive(): AsyncGenerator<ServerEvent | ErrorEvent> {
    while (true) {
      if (this.receiving) {
        throw new LocalUsageError(
          "Only one receive iterator may be active at a time.",
        );
      }
      // Scope receiving to awaiting queue.next() rather than across yield so
      // sequential receive().next() calls do not lock out subsequent receive() calls.
      this.receiving = true;
      let result: IteratorResult<ServerEvent | ErrorEvent>;
      try {
        result = await this.queue.next();
      } finally {
        this.receiving = false;
      }
      if (result.done) return;
      yield result.value;
    }
  }

  /** Requests completion on the server while leaving the connection open for acknowledgement. */
  async complete(): Promise<void> {
    if (this.connectionError) throw this.connectionError;
    if (this.terminal) return;
    this.sendEvent({ event_type: "interaction.complete" });
  }

  /** Cancels inference on the server, marks the connection terminal, and closes the transport after flushing. */
  async cancel(): Promise<void> {
    await this.send({ event_type: "interaction.cancel" });
  }

  /** Gracefully detaches from the interaction locally without completing it on the server. */
  detach(): void {
    if (this.detached) return;
    const sendDisconnect = !this.terminal && !this.connectionError;
    this.detached = true;
    this.queue.end(true);
    if (sendDisconnect) {
      try {
        this.socket?.send(
          JSON.stringify({ event_type: "interaction.disconnect" }),
        );
      } catch {
        // Best-effort disconnect frame before closing transport.
      }
    }
    this.closeSocket();
  }
}

/** Async disposal interface for `InteractionBaseConnection`. */
export interface InteractionBaseConnection extends Record<
  typeof Symbol extends {
    readonly asyncDispose: infer SymbolType extends symbol;
  } ? SymbolType : never,
  () => Promise<void>
> {}

const asyncDisposeSymbol = (Symbol as unknown as {
  readonly asyncDispose?: symbol;
}).asyncDispose;
if (asyncDisposeSymbol) {
  (
    InteractionBaseConnection.prototype as unknown as Record<
      symbol,
      () => Promise<void>
    >
  )[asyncDisposeSymbol] = async function (
    this: InteractionBaseConnection,
  ): Promise<void> {
    this.detach();
  };
}

/**
 * An interaction connection over WebSocket.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export class InteractionWebSocketConnection extends InteractionBaseConnection {
  /** @internal */
  constructor(id: string) {
    super(id);
  }
}

/**
 * Connects a live interaction over WebSocket.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export async function connectWebSocketInteraction(
  parentClient: InteractionParentClient,
  webSocketFactory: WebSocketFactory | undefined,
  id: string,
  params: InteractionConnectParams = {},
  options?: GoogleGenAIRequestOptions,
): Promise<InteractionWebSocketConnection> {
  warnLiveInteractionsExperimental();
  const { timeout, extraHeaders } = parseConnectOptions(
    parentClient,
    id,
    options,
  );
  if (!webSocketFactory) {
    throw new LocalUsageError(
      "Live Interactions WebSocket support requires a platform WebSocket factory.",
    );
  }
  const clientApiKey = parentClient.getApiKey?.();
  const authToken = clientApiKey?.startsWith("auth_tokens/")
    ? clientApiKey
    : undefined;
  const useQueryAuthToken = webSocketFactory.supportsHeaders === false;
  if (useQueryAuthToken) {
    if (authToken === undefined) {
      throw new LocalUsageError(
        "Browser WebSocket connections cannot send authentication headers; pass an auth token as apiKey to the GoogleGenAI client.",
      );
    }
    if (extraHeaders && Object.keys(extraHeaders).length > 0) {
      throw new LocalUsageError(
        "Browser WebSocket connections cannot send extra_headers.",
      );
    }
  }
  const queryAuthToken = useQueryAuthToken ? authToken : undefined;
  const url = websocketURL(parentClient, params.api_version, queryAuthToken);
  let headers: Record<string, string>;
  try {
    headers = await websocketHeaders(
      parentClient,
      url,
      extraHeaders,
      queryAuthToken,
    );
  } catch (error) {
    throw new APIWebSocketError({
      message: "Live authentication setup failed.",
      httpStatus: extractUpgradeHttpStatus(error),
    });
  }

  const connection = new InteractionWebSocketConnection(id);

  await new Promise<void>((resolve, reject) => {
    let opened = false;
    let settled = false;
    let socket: WebSocket | undefined;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const clearOpenTimer = () => {
      if (openTimer !== undefined) clearTimeout(openTimer);
    };
    const settleError = (
      options: {
        closeCode?: number | undefined;
        httpStatus?: number | undefined;
      } = { closeCode: 1006 },
    ) => {
      if (opened || settled) return;
      settled = true;
      clearOpenTimer();
      reject(
        new APIWebSocketError({
          message: "WebSocket upgrade failed.",
          closeCode: options.closeCode,
          httpStatus: options.httpStatus,
        }),
      );
      connection.detach();
    };
    const callbacks: WebSocketCallbacks = {
      onopen: () => {
        if (settled) return;
        opened = true;
        settled = true;
        clearOpenTimer();
        resolve();
      },
      onerror: (event: unknown) => {
        if (!opened) {
          const httpStatus = extractUpgradeHttpStatus(event);
          settleError(
            httpStatus !== undefined ? { httpStatus } : { closeCode: 1006 },
          );
        } else {
          connection.handleTransportError();
        }
      },
      onmessage: (event: { data?: unknown }) =>
        connection.handleMessage(event?.data),
      onclose: (event: { code?: number }) => {
        const code = typeof event?.code === "number" ? event.code : 1006;
        if (!opened) settleError({ closeCode: code });
        connection.handleClose(code);
      },
    };
    try {
      socket = webSocketFactory.create(url, headers, callbacks);
      connection.attach(socket);
      openTimer = setTimeout(() => {
        settleError({ closeCode: 1006 });
        try {
          socket?.close();
        } catch {
          // The public failure is already settled and intentionally redacted.
        }
      }, timeout);
      socket.connect();
    } catch (error) {
      const httpStatus = extractUpgradeHttpStatus(error);
      settleError(
        httpStatus !== undefined ? { httpStatus } : { closeCode: 1006 },
      );
    }
  });

  try {
    connection.sendInitial({ event_type: "interaction.connect", id });
    return connection;
  } catch (error) {
    connection.detach();
    if (error instanceof APIConnectionError) throw error;
    throw new APIWebSocketError({ message: "Failed to send live setup." });
  }
}

function ensureRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new LocalUsageError("Live client events must be JSON objects.");
  }
  return value;
}
