/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * g3-prettier-ignore-file
 */

import * as agents from "./models/agents/index.js";
import * as interactions from "./models/interactions/index.js";
import * as operations from "./models/operations/index.js";
import * as webhooks from "./models/webhooks/index.js";

import type { APICall, APIPromise } from "./types/async.js";
import {
  GOOGLE_GENAI_API_REVISION,
  GoogleGenAISecurityProvider,
} from "./hooks/google-genai-auth.js";

import { wrapSDKError } from "./lib/compat-errors.js";
import { Stream } from "./lib/event-streams.js";
import { GoogleGenAI } from "./sdk/sdk.js";
import type {
  CreateAgentInteractionParamsNonStreaming,
  CreateAgentInteractionParamsStreaming,
  CreateAgentParams,
  CreateInteractionParams,
  CreateInteractionParamsNonStreaming,
  CreateInteractionParamsStreaming,
  CreateModelInteractionParamsNonStreaming,
  CreateModelInteractionParamsStreaming,
  DeleteAgentParams,
  GetAgentParams,
  GetInteractionByIdParams,
  GetInteractionByIdParamsNonStreaming,
  GetInteractionByIdParamsStreaming,
  ListAgentsParams as _ListAgentsRequest,
} from "./models/operations/method-params.js";
import { RequestOptions } from "./lib/sdks.js";
import type { Result } from "./types/fp.js";
import { SDKOptions } from "./lib/config.js";
import { agentsCreate } from "./funcs/agents-create.js";
import { agentsDelete } from "./funcs/agents-delete.js";
import { agentsGet } from "./funcs/agents-get.js";
import { agentsList } from "./funcs/agents-list.js";
import { interactionsCancel } from "./funcs/interactions-cancel.js";
import { interactionsCreate } from "./funcs/interactions-create.js";
import { interactionsGet } from "./funcs/interactions-get.js";
import { webhooksCreate } from "./funcs/webhooks-create.js";
import { webhooksDelete } from "./funcs/webhooks-delete.js";
import { webhooksGet } from "./funcs/webhooks-get.js";
import { webhooksList } from "./funcs/webhooks-list.js";
import { webhooksPing } from "./funcs/webhooks-ping.js";
import { webhooksRotateSigningSecret } from "./funcs/webhooks-rotate-signing-secret.js";
import { webhooksUpdate } from "./funcs/webhooks-update.js";

const LEGACY_LYRIA_MODELS: ReadonlySet<string> = new Set([
  "lyria-3-pro-preview",
  "lyria-3-clip-preview",
]);

export { GOOGLE_GENAI_API_REVISION };

export interface GoogleGenAIParentClient {
  isVertexAI(): boolean;
  getProject(): string | undefined;
  getLocation(): string | undefined;
  getBaseUrl(): string;
  getApiVersion(): string;
  getDefaultHeaders?(): Record<string, string>;
  getAuthHeaders(url?: string): Headers | Promise<Headers>;
}

export function getGoogleGenAIServerURL(
  parentClient: GoogleGenAIParentClient,
): string {
  const serverURL = parentClient.getBaseUrl();
  if (!serverURL) {
    throw new Error("Base URL must be set.");
  }

  return serverURL.replace(/\/+$/, "");
}

export function getGoogleGenAIAPIVersion(
  parentClient: GoogleGenAIParentClient,
): string {
  const apiVersion = trimSlashes(parentClient.getApiVersion());
  const project = parentClient.getProject();
  const location = parentClient.getLocation();

  if (parentClient.isVertexAI() && apiVersion && project && location) {
    return (
      `${apiVersion}/projects/${encodeURIComponent(project)}` +
      `/locations/${encodeURIComponent(location)}`
    );
  }

  return apiVersion;
}

export function buildGoogleGenAIClient(
  parentClient: GoogleGenAIParentClient,
  options: SDKOptions = {},
): GoogleGenAI {
  const sdk = new GoogleGenAI({
    ...options,
    api_version: options.api_version ?? getGoogleGenAIAPIVersion(parentClient),
    security:
      options.security ??
      (new GoogleGenAISecurityProvider({
        defaultHeaders: parentClient.getDefaultHeaders?.(),
        getAuthHeaders: (url) => parentClient.getAuthHeaders(url),
      }) as SDKOptions["security"]),
    server_url: options.server_url ?? getGoogleGenAIServerURL(parentClient),
  });
  return sdk;
}

export type GoogleGenAIRequestOptions = RequestOptions & {
  timeout?: number;
  maxRetries?: number;
  defaultBaseURL?: string;
  fetchOptions?: Omit<RequestInit, "method" | "body">;
  query?: unknown;
  body?: unknown;
};

export type GoogleGenAISdkHttpResponse = {
  headers?: Record<string, string>;
  responseInternal: Response;
  json(): Promise<unknown>;
};

export type GoogleGenAIResponseWithSdkHttpResponse<T> = T & {
  sdkHttpResponse?: GoogleGenAISdkHttpResponse;
};

// `steps` is wire-optional (Vertex Lyria envelopes can omit it) but the
// bridge normalizes every interaction response to carry an array, so the
// public type matches the baseline SDK's required `steps`.
export type GoogleGenAIInteraction = GoogleGenAIResponseWithSdkHttpResponse<
  Omit<interactions.Interaction, "steps"> & { steps: interactions.Step[] }
>;

export type GoogleGenAIInteractionSSEEvent = interactions.InteractionSSEEvent;

export type InteractionCreateParams = CreateInteractionParams;

export type InteractionCreateParamsNonStreaming =
  CreateInteractionParamsNonStreaming;

export type InteractionCreateParamsStreaming = CreateInteractionParamsStreaming;

export type InteractionGetParams = GetInteractionByIdParams;

export type InteractionGetParamsNonStreaming =
  GetInteractionByIdParamsNonStreaming;

export type InteractionGetParamsStreaming = GetInteractionByIdParamsStreaming;

export type ListAgentsParams = {
  api_version?: string;
  pageSize?: number;
  pageToken?: string;
  parent?: string;
};

export type WebhookListParams = {
  api_version?: string;
  page_size?: number;
  page_token?: string;
};

export type WebhookUpdateParams = {
  api_version?: string;
  update_mask?: string;
} & webhooks.WebhookUpdate;

export type WebhookRotateSigningSecretParams =
  webhooks.RotateSigningSecretRequest & { api_version?: string };

export type WebhookPingParams = {
  api_version?: string;
  body?: webhooks.PingWebhookRequest;
};

export class GeminiNextGenInteractions {
  private sdk: GoogleGenAI | undefined;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {}

  // The per-variant overloads are deliberately non-generic: signature help
  // renders an instantiated type parameter as the inferred object literal,
  // hiding the params type name (and property docs) from editors at matched
  // call sites.
  create(
    params: CreateModelInteractionParamsNonStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  create(
    params: CreateAgentInteractionParamsNonStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  create(
    params: CreateModelInteractionParamsStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<GoogleGenAIInteractionSSEEvent>>;
  create(
    params: CreateAgentInteractionParamsStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<GoogleGenAIInteractionSSEEvent>>;
  create(
    params: InteractionCreateParamsStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<GoogleGenAIInteractionSSEEvent>>;
  create(
    params: InteractionCreateParamsNonStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  create(
    params: InteractionCreateParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<GoogleGenAIInteractionSSEEvent>>;
  async create(
    params: InteractionCreateParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<GoogleGenAIInteractionSSEEvent>> {
    const { api_version, ...request } = params;
    if (request.stream === true) {
      const response = await wrapSDKCall(() =>
        this.getClient(api_version).interactions.create(
          {
            ...(request as operations.CreateInteractionRequestBody),
            stream: true,
            api_version,
          },
          toGoogleGenAIRequestOptions(options, true),
        ),
      );
      return wrapStreamErrors(
        response as Stream<GoogleGenAIInteractionSSEEvent>,
      );
    }

    const response = await unwrapWithSdkHttpResponse(
      interactionsCreate(
        this.getClient(api_version),
        request as operations.CreateInteractionRequestBody,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
    return addOutputPropertiesIfInteraction(response) as GoogleGenAIInteraction;
  }

  get(
    id: string,
    params?: InteractionGetParamsNonStreaming | null,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  get(
    id: string,
    params: InteractionGetParamsStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<GoogleGenAIInteractionSSEEvent>>;
  get(
    id: string,
    params?: InteractionGetParams | null,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<GoogleGenAIInteractionSSEEvent>>;
  async get(
    id: string,
    params: InteractionGetParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<GoogleGenAIInteractionSSEEvent>> {
    const {
      api_version,
      stream = false,
      last_event_id,
      include_input,
    } = params ?? {};
    if (stream === true) {
      const response = await wrapSDKCall(() =>
        this.getClient(api_version).interactions.get(
          id,
          { stream, last_event_id, include_input, api_version },
          toGoogleGenAIRequestOptions(options, true),
        ),
      );
      return wrapStreamErrors(
        response as Stream<GoogleGenAIInteractionSSEEvent>,
      );
    }

    const response = await unwrapWithSdkHttpResponse(
      interactionsGet(
        this.getClient(api_version),
        id,
        stream,
        last_event_id,
        include_input,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
    return addOutputPropertiesIfInteraction(response) as GoogleGenAIInteraction;
  }

  async delete(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<unknown> {
    return wrapSDKCall(() =>
      this.getClient(params?.api_version).interactions.delete(
        id,
        { api_version: params?.api_version },
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async cancel(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction> {
    return addOutputPropertiesIfInteraction(
      await unwrapWithSdkHttpResponse(
        interactionsCancel(
          this.getClient(params?.api_version),
          id,
          params?.api_version,
          toGoogleGenAIRequestOptions(options),
        ),
      ),
    ) as GoogleGenAIInteraction;
  }

  private getClient(apiVersion: string | undefined): GoogleGenAI {
    if (apiVersion) {
      return buildGoogleGenAIClient(this.parentClient, {
        api_version: apiVersion,
      });
    }

    this.sdk ??= buildGoogleGenAIClient(this.parentClient);
    return this.sdk;
  }
}

export class GeminiNextGenAgents {
  private sdk: GoogleGenAI | undefined;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {}

  async create(
    params: CreateAgentParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<agents.Agent> {
    const { api_version, ...body } = params ?? {};
    return unwrapWithSdkHttpResponse(
      agentsCreate(
        this.getClient(api_version),
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async list(
    params: ListAgentsParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<agents.AgentListResponse> {
    const { api_version, pageSize, pageToken, parent } = params ?? {};
    return unwrapWithSdkHttpResponse(
      agentsList(
        this.getClient(api_version),
        api_version,
        pageSize,
        pageToken,
        parent,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async get(
    id: string,
    params: GetAgentParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<agents.Agent> {
    return unwrapWithSdkHttpResponse(
      agentsGet(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: DeleteAgentParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<interactions.Empty> {
    return unwrapWithSdkHttpResponse(
      agentsDelete(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  private getClient(apiVersion: string | undefined): GoogleGenAI {
    if (apiVersion) {
      return buildGoogleGenAIClient(this.parentClient, {
        api_version: apiVersion,
      });
    }

    this.sdk ??= buildGoogleGenAIClient(this.parentClient);
    return this.sdk;
  }
}

export class GeminiNextGenWebhooks {
  private sdk: GoogleGenAI | undefined;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {}

  async create(
    params: webhooks.WebhookInput & { api_version?: string },
    options?: GoogleGenAIRequestOptions,
  ): Promise<webhooks.Webhook> {
    const { api_version, ...body } = params;
    return unwrapWithSdkHttpResponse(
      webhooksCreate(
        this.getClient(),
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async list(
    params: WebhookListParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<webhooks.WebhookListResponse> {
    const { api_version, page_size, page_token } = params ?? {};

    return unwrapWithSdkHttpResponse(
      webhooksList(
        this.getClient(),
        api_version,
        page_size,
        page_token,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async get(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<webhooks.Webhook> {
    return unwrapWithSdkHttpResponse(
      webhooksGet(
        this.getClient(),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async update(
    id: string,
    params: WebhookUpdateParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<webhooks.Webhook> {
    const { api_version, update_mask, ...body } = params ?? {};

    return unwrapWithSdkHttpResponse(
      webhooksUpdate(
        this.getClient(),
        id,
        api_version,
        update_mask,
        body,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<interactions.Empty> {
    return unwrapWithSdkHttpResponse(
      webhooksDelete(
        this.getClient(),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async rotateSigningSecret(
    id: string,
    params: WebhookRotateSigningSecretParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<webhooks.WebhookRotateSigningSecretResponse> {
    const { api_version, ...body } = params ?? {};
    return unwrapWithSdkHttpResponse(
      webhooksRotateSigningSecret(
        this.getClient(),
        id,
        api_version,
        body,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async ping(
    id: string,
    params: WebhookPingParams | null | undefined = undefined,
    options?: GoogleGenAIRequestOptions,
  ): Promise<webhooks.WebhookPingResponse> {
    const { api_version, body } = params ?? {};
    return unwrapWithSdkHttpResponse(
      webhooksPing(
        this.getClient(),
        id,
        api_version,
        body,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  private getClient(): GoogleGenAI {
    this.sdk ??= buildGoogleGenAIClient(this.parentClient);
    return this.sdk;
  }
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function toGoogleGenAIRequestOptions(
  options: GoogleGenAIRequestOptions | undefined,
  streaming = false,
): RequestOptions | undefined {
  if (!options && !streaming) {
    return undefined;
  }

  const {
    timeout,
    maxRetries,
    defaultBaseURL,
    query,
    body,
    fetchOptions,
    ...rest
  } = options ?? {};

  const nextOptions: RequestOptions = {
    ...rest,
  };

  if (isPlainObject(query)) {
    nextOptions.extra_query = query;
  } else {
    warnIgnoredOption("query", query);
  }
  if (isPlainObject(body)) {
    nextOptions.extra_body = body;
  } else {
    warnIgnoredOption("body", body);
  }

  const fetch_options = rest.fetch_options ?? fetchOptions;
  if (fetch_options) {
    nextOptions.fetch_options = fetch_options;
  }
  const server_url = rest.server_url ?? defaultBaseURL;
  if (server_url) {
    nextOptions.server_url = server_url;
  }
  const timeout_ms = rest.timeout_ms ?? timeout;
  if (timeout_ms !== undefined) {
    nextOptions.timeout_ms = timeout_ms;
  }
  if (maxRetries !== undefined) {
    nextOptions.retries = {
      strategy: "attempt-count-backoff",
      retryConnectionErrors: true,
      maxRetries,
    };
  }
  if (streaming) {
    const headers = new Headers(nextOptions.headers ?? fetch_options?.headers);
    headers.set("Accept", "text/event-stream");
    nextOptions.headers = headers;
  }

  return nextOptions;
}

function warnIgnoredOption(name: string, value: unknown): void {
  if (value !== undefined && value !== null) {
    console.warn(
      `GoogleGenAI.interactions: request option ${name} is not supported by the Google GenAI interactions bridge and will be ignored.`,
    );
  }
}

async function unwrapWithSdkHttpResponse<T>(
  promise: APIPromise<Result<T, unknown>>,
): Promise<GoogleGenAIResponseWithSdkHttpResponse<T>> {
  const [result, call] = await promise.$inspect();
  if (!result.ok) {
    throw wrapSDKError(result.error);
  }

  return attachSdkHttpResponse(result.value, call);
}

async function wrapSDKCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw wrapSDKError(error);
  }
}

function wrapStreamErrors<T>(stream: Stream<T>): Stream<T> {
  const asyncIterable = stream as AsyncIterable<T>;
  return new Proxy(stream, {
    get(target, property) {
      if (property !== Symbol.asyncIterator) {
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      }

      return function wrappedAsyncIterator() {
        const iterator = asyncIterable[Symbol.asyncIterator]();
        return {
          async next(...args: [] | [undefined]) {
            try {
              return await iterator.next(...args);
            } catch (error) {
              throw wrapSDKError(error);
            }
          },
          async return(value?: unknown) {
            if (!iterator.return) {
              return { done: true, value } as IteratorReturnResult<unknown>;
            }
            try {
              return await iterator.return(value as never);
            } catch (error) {
              throw wrapSDKError(error);
            }
          },
          async throw(error?: unknown) {
            if (!iterator.throw) {
              throw wrapSDKError(error);
            }
            try {
              return await iterator.throw(error as never);
            } catch (caught) {
              throw wrapSDKError(caught);
            }
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        } satisfies AsyncIterableIterator<T>;
      };
    },
  });
}

function attachSdkHttpResponse<T>(
  value: T,
  call: APICall,
): GoogleGenAIResponseWithSdkHttpResponse<T> {
  if (!isPlainObject(value) || call.status !== "complete") {
    return value as GoogleGenAIResponseWithSdkHttpResponse<T>;
  }

  return {
    ...value,
    sdkHttpResponse: createSdkHttpResponse(call.response, value),
  } as GoogleGenAIResponseWithSdkHttpResponse<T>;
}

function createSdkHttpResponse(
  response: Response,
  parsedBody: unknown,
): GoogleGenAISdkHttpResponse {
  const headers: Record<string, string> = {};
  for (const [key, value] of response.headers.entries()) {
    headers[key] = value;
  }

  return {
    headers,
    responseInternal: response,
    json: async () => parsedBody,
  };
}

function addOutputPropertiesIfInteraction(value: unknown): unknown {
  const interaction = normalizeInteractionShape(value);
  if (!interaction) {
    return value;
  }

  return addOutputProperties(interaction);
}

function normalizeInteractionShape(
  value: unknown,
): Record<string, any> | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  if (Array.isArray(value["steps"])) {
    return value;
  }

  if (isLegacyLyriaInteraction(value)) {
    const outputs = value["outputs"];
    if (Array.isArray(outputs)) {
      const { outputs: _outputs, ...rest } = value;
      return {
        ...rest,
        steps: [{ type: "model_output", content: outputs }],
      };
    }
  }

  // Every interaction response carries a steps array on the public surface
  // even when the wire payload omits it (e.g. Lyria envelopes).
  return {
    ...value,
    steps: [],
  };
}

function isLegacyLyriaInteraction(value: Record<string, unknown>): boolean {
  const model = value["model"];
  return typeof model === "string" && LEGACY_LYRIA_MODELS.has(model);
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addOutputProperties(interaction: Record<string, any>): unknown {
  const normalized = normalizeInteractionDates(interaction);
  const steps = normalized["steps"] ?? [];
  const textParts: string[] = [];
  let collecting = false;

  outer: for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i]!;
    if (step.type === "user_input") {
      break;
    }
    if (step.type !== "model_output" || !step.content) {
      if (collecting) {
        break;
      }
      continue;
    }

    const content = step.content;
    for (let j = content.length - 1; j >= 0; j--) {
      const item = content[j]!;
      if (item.type === "text") {
        collecting = true;
        textParts.push(item.text ?? "");
      } else if (collecting) {
        break outer;
      }
    }
  }

  let output_image: unknown;
  let output_audio: unknown;
  let output_video: unknown;

  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i]!;
    if (step.type === "user_input") {
      break;
    }
    if (step.type === "model_output" && step.content) {
      for (let j = step.content.length - 1; j >= 0; j--) {
        const content = step.content[j]!;
        if (content.type === "image" && !output_image) {
          output_image = content;
        }
        if (content.type === "audio" && !output_audio) {
          output_audio = content;
        }
        if (content.type === "video" && !output_video) {
          output_video = content;
        }
      }
    }
  }

  const output_text = textParts.reverse().join("");
  return {
    ...normalized,
    ...(output_text && { output_text }),
    ...(output_image ? { output_image } : {}),
    ...(output_audio ? { output_audio } : {}),
    ...(output_video ? { output_video } : {}),
  };
}

function normalizeInteractionDates(
  interaction: Record<string, any>,
): Record<string, any> {
  return {
    ...interaction,
    created: normalizeDateLike(interaction["created"]),
    updated: normalizeDateLike(interaction["updated"]),
  };
}

function normalizeDateLike(value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}
