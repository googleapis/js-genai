/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * g3-prettier-ignore-file
 */

import type { WebSocketFactory } from "../_websocket.js";
import {
  CallDeadline,
  ContinuationTimeoutError,
  continueStream,
  continueUnaryInteraction,
  hopBody,
  prepareCreateRequest,
  warnIfIncompleteUnary,
  withIncompleteStreamWarning,
} from "../_interactions_continuation.js";
import * as operations from "./models/operations/index.js";
import type {
  Agents,
  Credentials,
  Environments,
  Interactions,
  Triggers,
  Voices,
  Webhooks,
} from "./resources.js";

import type { APICall, APIPromise } from "./types/async.js";
import {
  GOOGLE_GENAI_API_REVISION,
  GoogleGenAISecurityProvider,
} from "./hooks/google-genai-auth.js";

import {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  wrapSDKError,
} from "./lib/compat-errors.js";
import { Stream } from "./lib/event-streams.js";
import { HTTPClient, type Fetcher } from "./lib/http.js";
import { GoogleGenAI } from "./sdk/sdk.js";
import type { RetryConfig } from "./lib/retries.js";
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
import { triggersCreate } from "./funcs/triggers-create.js";
import { triggersDelete } from "./funcs/triggers-delete.js";
import { triggersGet } from "./funcs/triggers-get.js";
import { triggersListExecutions } from "./funcs/triggers-list-executions.js";
import { triggersList } from "./funcs/triggers-list.js";
import { triggersRun } from "./funcs/triggers-run.js";
import { triggersUpdate } from "./funcs/triggers-update.js";
import { webhooksCreate } from "./funcs/webhooks-create.js";
import { webhooksDelete } from "./funcs/webhooks-delete.js";
import { webhooksGet } from "./funcs/webhooks-get.js";
import { webhooksList } from "./funcs/webhooks-list.js";
import { webhooksPing } from "./funcs/webhooks-ping.js";
import { webhooksRotateSigningSecret } from "./funcs/webhooks-rotate-signing-secret.js";
import { webhooksUpdate } from "./funcs/webhooks-update.js";
import { environmentsCreateEnvironment } from "./funcs/environments-create-environment.js";
import { environmentsDeleteEnvironment } from "./funcs/environments-delete-environment.js";
import { environmentsFilesList } from "./funcs/environments-files-list.js";
import { environmentsGetEnvironment } from "./funcs/environments-get-environment.js";
import { environmentsInternalStartUpload } from "./funcs/environments-internal-start-upload.js";
import { environmentsListEnvironments } from "./funcs/environments-list-environments.js";
import { credentialsCreate } from "./funcs/credentials-create.js";
import { credentialsDelete } from "./funcs/credentials-delete.js";
import { credentialsGet } from "./funcs/credentials-get.js";
import { credentialsList } from "./funcs/credentials-list.js";
import { credentialsUpdate } from "./funcs/credentials-update.js";
import { voicesCreate } from "./funcs/voices-create.js";
import { voicesDelete } from "./funcs/voices-delete.js";
import { voicesGet } from "./funcs/voices-get.js";
import { voicesList } from "./funcs/voices-list.js";

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
  getHeaders?(): Record<string, string> | undefined;
  getAuthHeaders(url?: string): Headers | Promise<Headers>;
  getFetch?(): Fetcher | undefined;
  getTimeout?(): number | undefined;
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
  options: SDKOptions & { timeout?: number } = {},
): GoogleGenAI {
  const { timeout, ...rest } = options;
  const fetchFn = rest.http_client ? undefined : parentClient.getFetch?.();
  const httpClient =
    rest.http_client ??
    (fetchFn ? new HTTPClient({ fetcher: fetchFn }) : undefined);
  const timeout_ms = rest.timeout_ms ?? timeout ?? parentClient.getTimeout?.();

  const sdk = new GoogleGenAI({
    ...rest,
    http_client: httpClient,
    api_version: rest.api_version ?? getGoogleGenAIAPIVersion(parentClient),
    security:
      rest.security ??
      (new GoogleGenAISecurityProvider({
        defaultHeaders: {
          ...parentClient.getDefaultHeaders?.(),
          ...parentClient.getHeaders?.(),
        },
        getAuthHeaders: (url) => parentClient.getAuthHeaders(url),
      }) as SDKOptions["security"]),
    server_url: rest.server_url ?? getGoogleGenAIServerURL(parentClient),
    timeout_ms,
  });
  return sdk;
}

export type GoogleGenAIRequestOptions = {
  /**
   * Sets a timeout, in milliseconds, on HTTP requests made by an SDK method. If
   * `fetchOptions.signal` is set then it will take precedence over this option.
   *
   * For `interactions.create()` with automatic continuation enabled (the
   * default), this bounds the whole call across continuation hops: each hop is
   * sent with the time left, and once it runs out the call stops with a
   * `ContinuationInterruptedError`. See `AutomaticContinuationOption`.
   */
  timeout_ms?: number;
  /**
   * Set or override a retry policy on HTTP calls.
   */
  retries?: RetryConfig;
  /**
   * Specifies the status codes which should be retried using the given retry policy.
   */
  retry_codes?: string[];
  /**
   * Overrides the base server URL that will be used by an operation.
   */
  server_url?: string | URL;
  /**
   * @deprecated `fetchOptions` has been flattened into `GoogleGenAIRequestOptions`.
   *
   * Sets various request options on the `fetch` call made by an SDK method.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options|Request}
   */
  fetch_options?: Omit<RequestInit, "method" | "body">;
  /**
   * Additional query parameters to set on the request URL. Entries replace
   * any query parameters of the same name produced by the operation. Entries
   * with null or undefined values are skipped, array values are encoded as
   * repeated keys and plain object values are JSON-encoded.
   */
  extra_query?: Record<string, unknown>;
  /**
   * Additional fields to merge into the JSON object request body. Entries
   * replace any fields of the same name produced by the operation. Entries
   * with undefined values are skipped. Setting this option on an operation
   * whose request body is not a JSON object results in an error.
   */
  extra_body?: Record<string, unknown>;
  timeout?: number;
  maxRetries?: number;
  defaultBaseURL?: string;
  fetchOptions?: Omit<RequestInit, "method" | "body">;
  query?: unknown;
  body?: unknown;
} & Omit<RequestInit, "method" | "body">;

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
  Omit<Interactions.Interaction, "steps"> & { steps: Interactions.Step[] }
>;

/**
 * SDK-only option of `interactions.create()` controlling automatic
 * continuation of long decodes.
 */
export type AutomaticContinuationOption = {
  /**
   * Defaults to `true`. When `true`, the SDK automatically resumes decoding
   * across multiple continuation hops whenever a response or stream stops at
   * the per-request decode token limit (`status: 'requires_continuation'`
   * with a `continuation_token`) until the interaction completes, reaches
   * `incomplete` (e.g. `max_output_tokens`), requires action, or fails. Pass
   * `automatic_continuation: false` to disable: the single server response is
   * then returned untouched (so callers can drive continuation themselves),
   * with a one-time console warning when it stops at `requires_continuation`.
   *
   * - For `stream: true`, the events of all continuation hops are yielded
   *   verbatim and in order on the returned `Stream`, including each hop's
   *   `interaction.created` and intermediate `interaction.completed` (with
   *   `status: 'requires_continuation'`); check `status` on
   *   `interaction.completed` events rather than treating the first one as the
   *   end of the output. A hop that drops before any output was yielded since
   *   its latest checkpoint is resumed from that checkpoint (up to 3
   *   consecutive reconnects without progress).
   * - For unary calls, each continuation hop is a separate interaction on the
   *   server that only contains that hop's output. The SDK merges the hops
   *   into one `Interaction`: `steps` are concatenated in hop order, `usage`
   *   token counts are summed across hops (with `usage.initial_input_tokens`
   *   set to the first hop's input tokens), and all other fields (`id`,
   *   `status`, ...) come from the final hop; the final hop's `id` can be
   *   passed as `previous_interaction_id` to continue the conversation.
   *   `continuation_ids` lists the ids of every hop in order (the last one is
   *   `id`); note that `interactions.get(id)` and `interactions.delete(id)`
   *   act on the final hop only. `previous_interaction_id`, `created` and
   *   `input` come from the first hop.
   * - With `store` enabled (the default), each continuation hop sends the hop
   *   that issued the `continuation_token` as `previous_interaction_id` and
   *   omits `input` (the server already has it). With `store: false`, the
   *   original `input` is resent with the token.
   * - Client-side continuation is skipped for `background: true` and agent
   *   interactions (`agent` / `agent_config`), whose loops are managed by the
   *   server. `background: true` with an explicit
   *   `automatic_continuation: false` is rejected.
   * - Timeouts: a numeric per-request `timeout_ms` (or `timeout`) in the
   *   request options is a wall-clock budget for the whole `create()` call.
   *   Each hop is sent with the time left, and once it runs out the call stops
   *   with a `ContinuationInterruptedError` (see below) so the work so far can
   *   be resumed. The client-level `httpOptions.timeout` and the retry options
   *   apply to each hop separately: transient errors on a continuation hop
   *   retry that hop using the latest `continuation_token` without restarting
   *   from the initial request.
   * - Billing note: with `background: false`, each continuation hop
   *   re-prefills the conversation and generated prefix, so input tokens are
   *   billed on every hop (and summed in `usage.total_input_tokens`). If an
   *   unrecoverable error occurs after one or more hops have completed, those
   *   completed hops are still billed. For server-managed continuation without
   *   client-side hop loops, use `background: true` (with `store: true`).
   * - Errors: a failure on the first request is thrown as usual. A failure
   *   after progress (a later hop, or a stream after a resumable checkpoint)
   *   is thrown as `ContinuationInterruptedError` (with the failure as
   *   `cause`) carrying `continuationToken`, `interactionId` and
   *   `continuationIds`, plus `partialInteraction` (the completed hops merged,
   *   for unary calls), so the output already produced is not lost and the
   *   call can be resumed manually. Running out of the per-request timeout
   *   after progress is reported the same way.
   */
  automatic_continuation?: boolean | undefined;
};

type CreateInteractionParamsWithOptions = Interactions.InteractionCreateParams &
  AutomaticContinuationOption;

export class GeminiNextGenInteractions {
  private sdk: GoogleGenAI | undefined;

  constructor(
    private readonly parentClient: GoogleGenAIParentClient,
    _webSocketFactory?: WebSocketFactory,
  ) {}

  // The per-variant overloads are deliberately non-generic: signature help
  // renders an instantiated type parameter as the inferred object literal,
  // hiding the params type name (and property docs) from editors at matched
  // call sites.
  /**
   * Creates a model interaction. Long decodes are continued automatically
   * across hops and merged into one interaction unless
   * `automatic_continuation: false` is passed; see
   * {@link AutomaticContinuationOption}.
   */
  create(
    params: Interactions.InteractionCreateParams.CreateModelInteractionParamsNonStreaming &
      AutomaticContinuationOption,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  /**
   * Creates an agent interaction. Agent loops are managed by the server, so
   * `automatic_continuation` has no effect; see
   * {@link AutomaticContinuationOption}.
   */
  create(
    params: Interactions.InteractionCreateParams.CreateAgentInteractionParamsNonStreaming &
      AutomaticContinuationOption,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  /**
   * Creates a streaming model interaction. Long decodes are continued
   * automatically: the returned stream yields the events of every hop unless
   * `automatic_continuation: false` is passed; see
   * {@link AutomaticContinuationOption}.
   */
  create(
    params: Interactions.InteractionCreateParams.CreateModelInteractionParamsStreaming &
      AutomaticContinuationOption,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<Interactions.InteractionSSEEvent>>;
  /**
   * Creates a streaming agent interaction. Agent loops are managed by the
   * server, so `automatic_continuation` has no effect; see
   * {@link AutomaticContinuationOption}.
   */
  create(
    params: Interactions.InteractionCreateParams.CreateAgentInteractionParamsStreaming &
      AutomaticContinuationOption,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<Interactions.InteractionSSEEvent>>;
  /**
   * Creates a streaming interaction; see {@link AutomaticContinuationOption}.
   */
  create(
    params: Interactions.InteractionCreateParams.InteractionCreateParamsStreaming &
      AutomaticContinuationOption,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<Interactions.InteractionSSEEvent>>;
  /**
   * Creates an interaction; see {@link AutomaticContinuationOption}.
   */
  create(
    params: Interactions.InteractionCreateParams.InteractionCreateParamsNonStreaming &
      AutomaticContinuationOption,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  /**
   * Creates an interaction; see {@link AutomaticContinuationOption}.
   */
  create(
    params: CreateInteractionParamsWithOptions,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<Interactions.InteractionSSEEvent>>;
  async create(
    params: CreateInteractionParamsWithOptions,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<Interactions.InteractionSSEEvent>> {
    const { api_version, automatic_continuation, ...request } = params;
    // Throws before any request when background: true is combined with an
    // explicit automatic_continuation: false.
    const prepared = prepareCreateRequest(
      request as Record<string, unknown>,
      automatic_continuation,
    );
    // A numeric per-request timeout bounds the whole call (all hops) when
    // continuation runs; otherwise request options are passed through as-is.
    const deadline = new CallDeadline(options?.timeout_ms ?? options?.timeout, {
      enabled: prepared.enableContinuation,
    });
    const hopOptions = (): GoogleGenAIRequestOptions | undefined => {
      if (!deadline.bounded) {
        return options;
      }
      const { timeout: _timeout, ...rest } = options ?? {};
      return { ...rest, timeout_ms: deadline.hopTimeoutMs() };
    };
    const client = this.getClient(api_version);

    if (prepared.stream) {
      const openHop = async (
        token?: string,
        tokenOwnerId?: string,
      ): Promise<Stream<Interactions.InteractionSSEEvent>> => {
        const response = await wrapSDKCall(() =>
          client.interactions.create(
            {
              ...(hopBody(
                prepared,
                token,
                tokenOwnerId,
              ) as operations.CreateInteractionRequestBody),
              stream: true,
              api_version,
            },
            toGoogleGenAIRequestOptions(hopOptions(), true),
          ),
        );
        return wrapStreamErrors(
          response as Stream<Interactions.InteractionSSEEvent>,
        );
      };

      const firstHop = await openHop();
      if (!prepared.enableContinuation) {
        if (prepared.callerToken) {
          return firstHop;
        }
        return streamFromAsyncIterable(withIncompleteStreamWarning(firstHop));
      }
      return streamFromAsyncIterable(
        continueStream(firstHop, openHop, {
          initialContinuationToken: prepared.callerToken,
          isConnectionError: (error) =>
            error instanceof APIConnectionError &&
            !(error instanceof APIUserAbortError),
          isFatalError: (error) => error instanceof APIUserAbortError,
          wrapIterationError: wrapStreamTransportError,
          deadline,
          store: prepared.body['store'] !== false,
        }),
      );
    }

    const sendOnce = async (
      token?: string,
      tokenOwnerId?: string,
    ): Promise<unknown> =>
      unwrapWithSdkHttpResponse(
        interactionsCreate(
          client,
          hopBody(
            prepared,
            token,
            tokenOwnerId,
          ) as operations.CreateInteractionRequestBody,
          api_version,
          toGoogleGenAIRequestOptions(hopOptions()),
        ),
      );

    const response = await sendOnce();
    if (prepared.enableContinuation) {
      return (await continueUnaryInteraction(response, sendOnce, {
        initialContinuationToken: prepared.callerToken,
        normalizeInteraction: normalizeInteractionShape,
        finalizeInteraction: addOutputProperties,
        deadline,
        store: prepared.body['store'] !== false,
      })) as GoogleGenAIInteraction;
    }
    const result = addOutputPropertiesIfInteraction(
      response,
    ) as GoogleGenAIInteraction;
    if (!prepared.callerToken) {
      warnIfIncompleteUnary(result);
    }
    return result;
  }

  get(
    id: string,
    params?: Interactions.InteractionGetParamsNonStreaming | null,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction>;
  get(
    id: string,
    params: Interactions.InteractionGetParamsStreaming,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Stream<Interactions.InteractionSSEEvent>>;
  get(
    id: string,
    params?: Interactions.InteractionGetParams | null,
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<Interactions.InteractionSSEEvent>>;
  async get(
    id: string,
    params: Interactions.InteractionGetParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<GoogleGenAIInteraction | Stream<Interactions.InteractionSSEEvent>> {
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
        response as Stream<Interactions.InteractionSSEEvent>,
      );
    }

    const response = await unwrapWithSdkHttpResponse(
      interactionsGet(
        this.getClient(api_version),
        id,
        api_version,
        include_input,
        last_event_id,
        stream,
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
    params: Agents.AgentCreateParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Agents.Agent> {
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
    params: Agents.AgentListParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Agents.AgentListResponse> {
    const { api_version, page_size, page_token, parent } = params ?? {};
    return unwrapWithSdkHttpResponse(
      agentsList(
        this.getClient(api_version),
        api_version,
        page_size,
        page_token,
        parent,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async get(
    id: string,
    params: Agents.AgentGetParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Agents.Agent> {
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
    params: Agents.AgentDeleteParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Agents.AgentDeleteResponse> {
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
    params: Webhooks.WebhookInput & { api_version?: string },
    options?: GoogleGenAIRequestOptions,
  ): Promise<Webhooks.Webhook> {
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
    params: Webhooks.WebhookListParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Webhooks.WebhookListResponse> {
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
  ): Promise<Webhooks.Webhook> {
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
    params:
      | (Webhooks.WebhookUpdate & {
          api_version?: string | undefined;
          update_mask?: string | undefined;
        })
      | null
      | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Webhooks.Webhook> {
    const { api_version, update_mask, ...body } = params ?? {};

    return unwrapWithSdkHttpResponse(
      webhooksUpdate(
        this.getClient(),
        id,
        body,
        api_version,
        update_mask,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Webhooks.WebhookDeleteResponse> {
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
    params:
      | (Webhooks.RotateSigningSecretRequest & { api_version?: string })
      | null
      | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Webhooks.WebhookRotateSigningSecretResponse> {
    const { api_version, ...body } = params ?? {};
    return unwrapWithSdkHttpResponse(
      webhooksRotateSigningSecret(
        this.getClient(),
        id,
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async ping(
    id: string,
    params:
      | { api_version?: string; body?: Webhooks.PingWebhookRequest }
      | null
      | undefined = undefined,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Webhooks.WebhookPingResponse> {
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

export class GeminiNextGenTriggers {
  private sdk: GoogleGenAI | undefined;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {}

  async create(
    params: Triggers.TriggerCreateParams & { api_version?: string | undefined },
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.Trigger> {
    const { api_version, ...body } = params;
    return unwrapWithSdkHttpResponse(
      triggersCreate(
        this.getClient(api_version),
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async list(
    params: Triggers.TriggerListParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.TriggerListResponse> {
    const { api_version, filter, page_size, page_token } = params ?? {};
    return unwrapWithSdkHttpResponse(
      triggersList(
        this.getClient(api_version),
        api_version,
        filter,
        page_size,
        page_token,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async get(
    id: string,
    params: Triggers.TriggerGetParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.Trigger> {
    return unwrapWithSdkHttpResponse(
      triggersGet(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async update(
    id: string,
    params: Triggers.TriggerUpdateParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.Trigger> {
    const { api_version, ...body } = params;
    return unwrapWithSdkHttpResponse(
      triggersUpdate(
        this.getClient(api_version),
        id,
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: Triggers.TriggerDeleteParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.TriggerDeleteResponse> {
    return unwrapWithSdkHttpResponse(
      triggersDelete(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async run(
    trigger_id: string,
    params: Triggers.TriggerRunParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.TriggerExecution> {
    return unwrapWithSdkHttpResponse(
      triggersRun(
        this.getClient(params?.api_version),
        trigger_id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async listExecutions(
    trigger_id: string,
    params: Triggers.TriggerListExecutionsParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Triggers.TriggerListExecutionsResponse> {
    const { api_version, page_size, page_token } = params ?? {};
    return unwrapWithSdkHttpResponse(
      triggersListExecutions(
        this.getClient(api_version),
        trigger_id,
        api_version,
        page_size,
        page_token,
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

  // Compile-time guard: resolves to `never` if `GoogleGenAIRequestOptions`
  // drifts from `RequestOptions` (field added, removed, or retyped).
  const nextOptions: RequestOptions &
    (Required<RequestOptions> extends Required<typeof rest>
      ? Required<typeof rest> extends Required<RequestOptions>
        ? unknown
        : never
      : never) = {
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

/**
 * Maps an error raised while reading a hop's events to the SDK's error for a
 * transport failure. HTTP status errors (already `APIError`s) and the
 * continuation deadline pass through unchanged; a mid-stream disconnect
 * (which `fetch` surfaces as a bare `TypeError`) becomes an
 * `APIConnectionError`, and an abort becomes an `APIUserAbortError`.
 */
function wrapStreamTransportError(error: unknown): unknown {
  const wrapped = wrapSDKError(error);
  if (
    wrapped instanceof APIError ||
    wrapped instanceof ContinuationTimeoutError
  ) {
    return wrapped;
  }
  if (wrapped instanceof Error && wrapped.name === "AbortError") {
    return new APIUserAbortError({ message: wrapped.message });
  }
  const message = wrapped instanceof Error ? wrapped.message : String(wrapped);
  return new APIConnectionError({ message, cause: wrapped });
}

/**
 * Exposes an async iterable (e.g. the continuation generator) as a `Stream`,
 * the type the generated client returns for SSE responses. Events are pulled
 * one at a time as the consumer reads them (no read-ahead), so the next hop is
 * only opened once the caller asks for more events, and cancelling the stream
 * (or breaking out of `for await`) closes the current hop's connection.
 */
function streamFromAsyncIterable<T>(iterable: AsyncIterable<T>): Stream<T> {
  const iterator = iterable[Symbol.asyncIterator]();
  const readable = new ReadableStream<T>(
    {
      async pull(controller) {
        const result = await iterator.next();
        if (result.done) {
          controller.close();
        } else {
          controller.enqueue(result.value);
        }
      },
      async cancel() {
        await iterator.return?.();
      },
    },
    { highWaterMark: 0 },
  );
  Object.setPrototypeOf(readable, Stream.prototype);
  return readable as Stream<T>;
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
    if (step.type === "thought") {
      continue;
    }
    if (step.type !== "model_output") {
      if (collecting) {
        break;
      }
      continue;
    }
    if (!step.content) {
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
export type CredentialUpdateParams = Credentials.CredentialUpdate & {
  /**
   * API version for request routing.
   */
  api_version?: string | undefined;
  /**
   * Optional. The list of fields to update.
   */
  update_mask?: string | undefined;
};

export type ListEnvironmentsParams = {
  /**
   * API version for request routing.
   */
  api_version?: string | undefined;
  /**
   * Optional. Maximum number of environments to return.
   *
   * @remarks
   * If unspecified, defaults to 50. Maximum is 1000.
   */
  page_size?: number | undefined;
  /**
   * Optional. Pagination token.
   */
  page_token?: string | undefined;
};

/**
 * Alias for GetEnvironmentFilesResponse when listing files.
 */
export type ListEnvironmentFilesResponse =
  Environments.GetEnvironmentFilesResponse;

export type ListEnvironmentFilesParams = {
  /**
   * API version for request routing.
   */
  api_version?: string | undefined;
  /**
   * The ID of the environment whose snapshot to read.
   */
  environment: string;
  /**
   * Path of the file or directory inside the environment workspace, relative to its root (e.g. src).
   */
  path: string;
  /**
   * Optional. Maximum number of entries to return per page (for directory listing).
   */
  page_size?: number | undefined;
  /**
   * Optional. Pagination token for directory listing.
   */
  page_token?: string | undefined;
  /**
   * Optional. If true and the path is a directory, recursively lists all files.
   */
  recursive?: boolean | undefined;
};

export type DownloadEnvironmentFileParams = {
  environment: string;
  path: string;
  api_version?: string;
};

export type UploadEnvironmentFileParams = {
  environment: string;
  path: string;
  file: string | Blob | Uint8Array | ArrayBuffer | any;
  mime_type?: string;
  overwrite?: boolean;
  extract?: boolean;
  api_version?: string;
};

function inferMimeType(filePath: string): string | undefined {
  const ext = filePath.slice(filePath.lastIndexOf('.') + 1).toLowerCase();
  const mimeTypes: Record<string, string> = {
    txt: 'text/plain',
    json: 'application/json',
    js: 'text/javascript',
    mjs: 'text/javascript',
    ts: 'text/plain',
    py: 'text/x-python',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    csv: 'text/csv',
    xml: 'application/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };
  return mimeTypes[ext];
}

export class GeminiNextGenEnvironmentFiles {
  constructor(
    private readonly resolveClient: (apiVersion?: string) => GoogleGenAI,
    private readonly parentClient?: GoogleGenAIParentClient,
  ) {}

  async list(
    params: ListEnvironmentFilesParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<ListEnvironmentFilesResponse> {
    return unwrapWithSdkHttpResponse(
      environmentsFilesList(
        this.resolveClient(params.api_version),
        params.environment,
        params.path,
        params.api_version,
        params.page_size,
        params.page_token,
        params.recursive,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async download(
    params: DownloadEnvironmentFileParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Uint8Array> {
    const targetEnv = params.environment;
    if (!targetEnv) {
      throw new Error('environment is required.');
    }
    const envName = targetEnv.startsWith('environments/')
      ? targetEnv
      : `environments/${targetEnv}`;
    const cleanPath = params.path.replace(/^\/+/, '');
    const downloadPath = `${envName}/files/${cleanPath}`;

    const apiClient = this.parentClient as any;
    if (!apiClient || typeof apiClient.request !== 'function') {
      throw new Error('apiClient is required to download files.');
    }
    const response = await apiClient.request({
      path: downloadPath,
      httpMethod: 'GET',
      queryParams: { alt: 'media' },
      httpOptions: {
        ...(options as any)?.httpOptions,
        apiVersion: params.api_version ?? (options as any)?.httpOptions?.apiVersion,
      },
    });

    if (
      response &&
      response.responseInternal &&
      typeof response.responseInternal.arrayBuffer === 'function'
    ) {
      const arrayBuffer = await response.responseInternal.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    throw new Error('Unexpected response type from download');
  }

  async upload(
    params: UploadEnvironmentFileParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Environments.GetEnvironmentFilesResponse | any> {
    const targetEnv = params.environment;
    if (!targetEnv) {
      throw new Error('environment is required.');
    }
    const envName = targetEnv.startsWith('environments/')
      ? targetEnv
      : `environments/${targetEnv}`;
    const cleanPath = params.path.replace(/^\/+/, '');
    const handshakePath = `${envName}/files/${cleanPath}`;

    const apiClient = this.parentClient as any;
    if (!apiClient || typeof apiClient.request !== 'function') {
      throw new Error('apiClient is required to upload files.');
    }

    let fileData: Blob | Uint8Array;
    let sizeBytes: number = 0;
    let mimeType = params.mime_type;

    if (typeof params.file === 'string') {
      let buffer: any;
      try {
        const req = (globalThis as any).require;
        if (req) {
          const fs = req('fs');
          buffer = fs.readFileSync(params.file);
        }
      } catch {}
      if (!buffer && typeof (globalThis as any).process !== 'undefined') {
        try {
          const mod =
            (globalThis as any).process.mainModule?.require ?? (globalThis as any).require;
          if (mod) {
            const fs = mod('fs');
            buffer = fs.readFileSync(params.file);
          }
        } catch {}
      }
      if (buffer) {
        fileData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        sizeBytes = fileData.byteLength;
      } else {
        throw new Error(
          `Unable to read file from path "${params.file}". File path string inputs are only supported in Node.js environments.`,
        );
      }
      if (!mimeType) {
        mimeType = inferMimeType(params.file);
      }
    } else if (typeof Blob !== 'undefined' && params.file instanceof Blob) {
      fileData = params.file;
      sizeBytes = params.file.size;
      if (!mimeType && params.file.type) {
        mimeType = params.file.type;
      }
    } else if (params.file instanceof Uint8Array || params.file instanceof ArrayBuffer) {
      fileData =
        params.file instanceof ArrayBuffer ? new Uint8Array(params.file) : params.file;
      sizeBytes = fileData.byteLength;
    } else if (
      typeof (globalThis as any).Buffer !== 'undefined' &&
      typeof (globalThis as any).Buffer.isBuffer === 'function' &&
      (globalThis as any).Buffer.isBuffer(params.file)
    ) {
      const buf = params.file as any;
      fileData = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      sizeBytes = fileData.byteLength;
    } else {
      throw new Error('Unsupported file type for upload.');
    }

    if (!mimeType) {
      mimeType = 'application/octet-stream';
    }

    const cleanEnv = targetEnv.startsWith('environments/')
      ? targetEnv.replace(/^environments\//, '')
      : targetEnv;

    const [result, call] = await environmentsInternalStartUpload(
      this.resolveClient(params.api_version),
      cleanEnv,
      cleanPath,
      'start',
      sizeBytes,
      mimeType,
      'resumable',
      params.api_version,
      params.extract,
      params.overwrite,
      toGoogleGenAIRequestOptions(options),
    ).$inspect();

    if (!result.ok) {
      throw wrapSDKError(result.error);
    }

    const uploadUrl =
      call.status === 'complete'
        ? call.response?.headers?.get('x-goog-upload-url') ??
          call.response?.headers?.get('X-Goog-Upload-URL')
        : undefined;

    if (!uploadUrl) {
      throw new Error('Failed to get upload URL from upload handshake response.');
    }

    const CHUNK_SIZE = 8 * 1024 * 1024;
    let offset = 0;
    let uploadResponse: any;

    const blob = fileData instanceof Blob ? fileData : new Blob([fileData]);

    while (offset < sizeBytes || (sizeBytes === 0 && offset === 0)) {
      const end = Math.min(offset + CHUNK_SIZE, sizeBytes);
      const chunk = blob.slice(offset, end);
      const isFinal = end >= sizeBytes;
      const uploadCommand = isFinal ? 'upload, finalize' : 'upload';

      uploadResponse = await apiClient.request({
        path: '',
        body: chunk,
        httpMethod: 'POST',
        httpOptions: {
          ...(options as any)?.httpOptions,
          apiVersion: '',
          baseUrl: uploadUrl,
          headers: {
            ...((options as any)?.httpOptions?.headers || {}),
            'X-Goog-Upload-Command': uploadCommand,
            'X-Goog-Upload-Offset': `${offset}`,
          },
        },
      });

      offset = end;
      if (isFinal) {
        break;
      }
    }

    let resJson: any;
    if (uploadResponse && typeof uploadResponse.json === 'function') {
      resJson = await uploadResponse.json();
    } else if (
      uploadResponse &&
      uploadResponse.responseInternal &&
      typeof uploadResponse.responseInternal.json === 'function'
    ) {
      resJson = await uploadResponse.responseInternal.json();
    }

    if (resJson && typeof resJson === 'object') {
      if (Array.isArray(resJson.files)) {
        return resJson;
      }
      if (resJson.name || resJson.path) {
        return { files: [resJson] };
      }
      if (resJson.file && typeof resJson.file === 'object') {
        return { files: [resJson.file] };
      }
    }
    return resJson;
  }
}

export class GeminiNextGenEnvironments {
  private sdk: GoogleGenAI | undefined;
  readonly files: GeminiNextGenEnvironmentFiles;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {
    this.files = new GeminiNextGenEnvironmentFiles(
      (apiVersion) => this.getClient(apiVersion),
      this.parentClient,
    );
  }

  async create(
    params: Environments.CreateEnvironmentRequest & { api_version?: string },
    options?: GoogleGenAIRequestOptions,
  ): Promise<Environments.Environment> {
    const { api_version, ...body } = params;
    return unwrapWithSdkHttpResponse(
      environmentsCreateEnvironment(
        this.getClient(api_version),
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async list(
    params: ListEnvironmentsParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Environments.EnvironmentListResponse> {
    const { api_version, page_size, page_token } = params ?? {};
    return unwrapWithSdkHttpResponse(
      environmentsListEnvironments(
        this.getClient(api_version),
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
  ): Promise<Environments.Environment> {
    return unwrapWithSdkHttpResponse(
      environmentsGetEnvironment(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Environments.EnvironmentDeleteResponse> {
    return unwrapWithSdkHttpResponse(
      environmentsDeleteEnvironment(
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

export class GeminiNextGenCredentials {
  private sdk: GoogleGenAI | undefined;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {}

  async create(
    params: Credentials.CredentialCreateParams & { api_version?: string },
    options?: GoogleGenAIRequestOptions,
  ): Promise<Credentials.Credential> {
    const { api_version, ...body } = params;
    return unwrapWithSdkHttpResponse(
      credentialsCreate(
        this.getClient(api_version),
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async list(
    params: Credentials.CredentialListParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Credentials.CredentialListResponse> {
    const { api_version, page_size, page_token } = params ?? {};
    return unwrapWithSdkHttpResponse(
      credentialsList(
        this.getClient(api_version),
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
  ): Promise<Credentials.Credential> {
    return unwrapWithSdkHttpResponse(
      credentialsGet(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async update(
    id: string,
    params: CredentialUpdateParams,
    options?: GoogleGenAIRequestOptions,
  ): Promise<Credentials.Credential> {
    const { api_version, update_mask, ...body } = params;
    return unwrapWithSdkHttpResponse(
      credentialsUpdate(
        this.getClient(api_version),
        id,
        body,
        api_version,
        update_mask,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: { api_version?: string } | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Credentials.CredentialDeleteResponse> {
    return unwrapWithSdkHttpResponse(
      credentialsDelete(
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

export class GeminiNextGenVoices {
  private sdk: GoogleGenAI | undefined;

  constructor(private readonly parentClient: GoogleGenAIParentClient) {}

  async create(
    params: Voices.VoiceCreateParams["body"] & { api_version?: string },
    options?: GoogleGenAIRequestOptions,
  ): Promise<Voices.VoiceListResponse.Voice> {
    const { api_version, ...body } = params;
    return unwrapWithSdkHttpResponse(
      voicesCreate(
        this.getClient(api_version),
        body,
        api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async list(
    params: Voices.VoiceListParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Voices.VoiceListResponse> {
    const {
      api_version,
      accent,
      contexts,
      gender,
      language_code,
      page_size,
      page_token,
      persona,
      pitch,
      region_code,
      search,
      type,
    } = params ?? {};
    return unwrapWithSdkHttpResponse(
      voicesList(
        this.getClient(api_version),
        api_version,
        accent,
        contexts,
        gender,
        language_code,
        page_size,
        page_token,
        persona,
        pitch,
        region_code,
        search,
        type,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async get(
    id: string,
    params: Voices.VoiceGetParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Voices.VoiceListResponse.Voice> {
    return unwrapWithSdkHttpResponse(
      voicesGet(
        this.getClient(params?.api_version),
        id,
        params?.api_version,
        toGoogleGenAIRequestOptions(options),
      ),
    );
  }

  async delete(
    id: string,
    params: Voices.VoiceDeleteParams | null | undefined = {},
    options?: GoogleGenAIRequestOptions,
  ): Promise<Voices.VoiceDeleteResponse> {
    return unwrapWithSdkHttpResponse(
      voicesDelete(
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
