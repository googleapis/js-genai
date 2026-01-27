/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import type { RequestInit, RequestInfo, BodyInit } from './internal/builtin-types.js';
import type { HTTPMethod, PromiseOrValue, MergedRequestInit, FinalizedRequestInit } from './internal/types.js';
import { uuid4 } from './internal/utils/uuid.js';
import { validatePositiveInteger, isAbsoluteURL, safeJSON } from './internal/utils/values.js';
import { sleep } from './internal/utils/sleep.js';
export type { Logger, LogLevel } from './internal/utils/log.js';
import { castToError, isAbortError } from './internal/errors.js';
import type { APIResponseProps } from './internal/parse.js';
import { getPlatformHeaders } from './internal/detect-platform.js';
import * as Shims from './internal/shims.js';
import * as Opts from './internal/request-options.js';
import { VERSION } from './version.js';
import * as Errors from './core/error.js';
import * as Uploads from './core/uploads.js';
import * as API from './resources/index.js';
import { APIPromise } from './core/api-promise.js';
import {
  AllowedTools,
  Annotation,
  AudioContent,
  AudioMimeType,
  CodeExecutionCallArguments,
  CodeExecutionCallContent,
  CodeExecutionResultContent,
  Content,
  ContentDelta,
  ContentStart,
  ContentStop,
  CreateAgentInteractionParamsNonStreaming,
  CreateAgentInteractionParamsStreaming,
  CreateModelInteractionParamsNonStreaming,
  CreateModelInteractionParamsStreaming,
  DeepResearchAgentConfig,
  DocumentContent,
  DocumentMimeType,
  DynamicAgentConfig,
  ErrorEvent,
  FileSearchCallContent,
  FileSearchResultContent,
  Function,
  FunctionCallContent,
  FunctionResultContent,
  GenerationConfig,
  GoogleSearchCallArguments,
  GoogleSearchCallContent,
  GoogleSearchResult,
  GoogleSearchResultContent,
  ImageConfig,
  ImageContent,
  ImageMimeType,
  Interaction,
  InteractionCancelParams,
  InteractionCompleteEvent,
  InteractionCreateParams,
  InteractionDeleteParams,
  InteractionDeleteResponse,
  InteractionGetParams,
  InteractionGetParamsNonStreaming,
  InteractionGetParamsStreaming,
  InteractionSSEEvent,
  InteractionStartEvent,
  InteractionStatusUpdate,
  Interactions,
  MCPServerToolCallContent,
  MCPServerToolResultContent,
  Model,
  SpeechConfig,
  TextContent,
  ThinkingLevel,
  ThoughtContent,
  Tool,
  ToolChoice,
  ToolChoiceConfig,
  ToolChoiceType,
  Turn,
  URLContextCallArguments,
  URLContextCallContent,
  URLContextResult,
  URLContextResultContent,
  Usage,
  VideoContent,
  VideoMimeType,
} from './resources/interactions.js';
import { type Fetch } from './internal/builtin-types.js';
import { HeadersLike, NullableHeaders, buildHeaders } from './internal/headers.js';
import { FinalRequestOptions, RequestOptions } from './internal/request-options.js';
import { readEnv } from './internal/utils/env.js';
import {
  type LogLevel,
  type Logger,
  formatRequestDetails,
  loggerFor,
  parseLogLevel,
} from './internal/utils/log.js';
import { isEmptyObj } from './internal/utils/values.js';
import { GeminiNextGenAPIClientAdapter } from './client-adapter.js';

export interface ClientOptions {
  /**
   * Defaults to process.env['GEMINI_API_KEY'].
   */
  apiKey?: string | null | undefined;

  apiVersion?: string | undefined;

  /**
   * Override the default base URL for the API, e.g., "https://api.example.com/v2/"
   *
   * Defaults to process.env['GEMINI_NEXT_GEN_API_BASE_URL'].
   */
  baseURL?: string | null | undefined;

  /**
   * The maximum amount of time (in milliseconds) that the client should wait for a response
   * from the server before timing out a single request.
   *
   * Note that request timeouts are retried by default, so in a worst-case scenario you may wait
   * much longer than this timeout before the promise succeeds or fails.
   *
   * @unit milliseconds
   */
  timeout?: number | undefined;
  /**
   * Additional `RequestInit` options to be passed to `fetch` calls.
   * Properties will be overridden by per-request `fetchOptions`.
   */
  fetchOptions?: MergedRequestInit | undefined;

  /**
   * Specify a custom `fetch` function implementation.
   *
   * If not provided, we expect that `fetch` is defined globally.
   */
  fetch?: Fetch | undefined;

  /**
   * The maximum number of times that the client will retry a request in case of a
   * temporary failure, like a network error or a 5XX error from the server.
   *
   * @default 2
   */
  maxRetries?: number | undefined;

  /**
   * Default headers to include with every request to the API.
   *
   * These can be removed in individual requests by explicitly setting the
   * header to `null` in request options.
   */
  defaultHeaders?: HeadersLike | undefined;

  /**
   * Default query parameters to include with every request to the API.
   *
   * These can be removed in individual requests by explicitly setting the
   * param to `undefined` in request options.
   */
  defaultQuery?: Record<string, string | undefined> | undefined;

  /**
   * Set the log level.
   *
   * Defaults to process.env['GEMINI_NEXT_GEN_API_LOG'] or 'warn' if it isn't set.
   */
  logLevel?: LogLevel | undefined;

  /**
   * Set the logger.
   *
   * Defaults to globalThis.console.
   */
  logger?: Logger | undefined;

  /**
   * The adapter to the parent API client instance (for accessing auth, project, location)
   */
  clientAdapter: GeminiNextGenAPIClientAdapter;
}

/**
 * Base class for Gemini Next Gen API API clients.
 */
export class BaseGeminiNextGenAPIClient {
  apiKey: string | null;
  apiVersion: string;

  baseURL: string;
  maxRetries: number;
  timeout: number;
  logger: Logger;
  logLevel: LogLevel | undefined;
  fetchOptions: MergedRequestInit | undefined;

  private fetch: Fetch;
  private encoder: Opts.RequestEncoder;
  protected idempotencyHeader?: string;
  private _options: ClientOptions;
  private clientAdapter: GeminiNextGenAPIClientAdapter;

  /**
   * API Client for interfacing with the Gemini Next Gen API API.
   *
   * @param {string | null | undefined} [opts.apiKey=process.env['GEMINI_API_KEY'] ?? null]
   * @param {string | undefined} [opts.apiVersion=v1beta]
   * @param {string} [opts.baseURL=process.env['GEMINI_NEXT_GEN_API_BASE_URL'] ?? https://generativelanguage.googleapis.com] - Override the default base URL for the API.
   * @param {number} [opts.timeout=1 minute] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
   * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
   */
  constructor({
    baseURL = readEnv('GEMINI_NEXT_GEN_API_BASE_URL'),
    apiKey = readEnv('GEMINI_API_KEY') ?? null,
    apiVersion = 'v1beta',
    ...opts
  }: ClientOptions) {
    const options: ClientOptions = {
      apiKey,
      apiVersion,
      ...opts,
      baseURL: baseURL || `https://generativelanguage.googleapis.com`,
    };

    this.baseURL = options.baseURL!;
    this.timeout = options.timeout ?? BaseGeminiNextGenAPIClient.DEFAULT_TIMEOUT /* 1 minute */;
    this.logger = options.logger ?? console;
    const defaultLogLevel = 'warn';
    // Set default logLevel early so that we can log a warning in parseLogLevel.
    this.logLevel = defaultLogLevel;
    this.logLevel =
      parseLogLevel(options.logLevel, 'ClientOptions.logLevel', this) ??
      parseLogLevel(readEnv('GEMINI_NEXT_GEN_API_LOG'), "process.env['GEMINI_NEXT_GEN_API_LOG']", this) ??
      defaultLogLevel;
    this.fetchOptions = options.fetchOptions;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetch = options.fetch ?? Shims.getDefaultFetch();
    this.encoder = Opts.FallbackEncoder;

    this._options = options;

    this.apiKey = apiKey;
    this.apiVersion = apiVersion;
    this.clientAdapter = options.clientAdapter;
  }

  /**
   * Create a new client instance re-using the same options given to the current client with optional overriding.
   */
  withOptions(options: Partial<ClientOptions>): this {
    const client = new (this.constructor as any as new (props: ClientOptions) => typeof this)({
      ...this._options,
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      logger: this.logger,
      logLevel: this.logLevel,
      fetch: this.fetch,
      fetchOptions: this.fetchOptions,
      apiKey: this.apiKey,
      apiVersion: this.apiVersion,
      ...options,
    });
    return client;
  }

  /**
   * Check whether the base URL is set to its default.
   */
  private baseURLOverridden() {
    return this.baseURL !== 'https://generativelanguage.googleapis.com';
  }

  protected defaultQuery(): Record<string, string | undefined> | undefined {
    return this._options.defaultQuery;
  }

  protected validateHeaders({ values, nulls }: NullableHeaders) {
    // The headers object handles case insensitivity.
    if (values.has('authorization') || values.has('x-goog-api-key')) {
      return;
    }
    if (this.apiKey && values.get('x-goog-api-key')) {
      return;
    }
    if (nulls.has('x-goog-api-key')) {
      return;
    }

    throw new Error(
      'Could not resolve authentication method. Expected the apiKey to be set. Or for the "x-goog-api-key" headers to be explicitly omitted',
    );
  }

  protected async authHeaders(opts: FinalRequestOptions): Promise<NullableHeaders | undefined> {
    const existingHeaders = buildHeaders([opts.headers]);

    if (existingHeaders.values.has('authorization') || existingHeaders.values.has('x-goog-api-key')) {
      return undefined;
    }

    if (this.apiKey) {
      return buildHeaders([{ 'x-goog-api-key': this.apiKey }]);
    }

    if (this.clientAdapter.isVertexAI()) {
      return buildHeaders([await this.clientAdapter.getAuthHeaders()]);
    }

    return undefined;
  }

  /**
   * Basic re-implementation of `qs.stringify` for primitive types.
   */
  protected stringifyQuery(query: Record<string, unknown>): string {
    return Object.entries(query)
      .filter(([_, value]) => typeof value !== 'undefined')
      .map(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        if (value === null) {
          return `${encodeURIComponent(key)}=`;
        }
        throw new Errors.GeminiNextGenAPIClientError(
          `Cannot stringify type ${typeof value}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`,
        );
      })
      .join('&');
  }

  private getUserAgent(): string {
    return `${this.constructor.name}/JS ${VERSION}`;
  }

  protected defaultIdempotencyKey(): string {
    return `stainless-node-retry-${uuid4()}`;
  }

  protected makeStatusError(
    status: number,
    error: Object,
    message: string | undefined,
    headers: Headers,
  ): Errors.APIError {
    return Errors.APIError.generate(status, error, message, headers);
  }

  buildURL(
    path: string,
    query: Record<string, unknown> | null | undefined,
    defaultBaseURL?: string | undefined,
  ): string {
    const baseURL = (!this.baseURLOverridden() && defaultBaseURL) || this.baseURL;
    const url =
      isAbsoluteURL(path) ?
        new URL(path)
      : new URL(baseURL + (baseURL.endsWith('/') && path.startsWith('/') ? path.slice(1) : path));

    const defaultQuery = this.defaultQuery();
    if (!isEmptyObj(defaultQuery)) {
      query = { ...defaultQuery, ...query };
    }

    if (typeof query === 'object' && query && !Array.isArray(query)) {
      url.search = this.stringifyQuery(query as Record<string, unknown>);
    }

    return url.toString();
  }

  /**
   * Used as a callback for mutating the given `FinalRequestOptions` object.

   */
  protected async prepareOptions(options: FinalRequestOptions): Promise<void> {
    if (
      this.clientAdapter &&
      this.clientAdapter.isVertexAI() &&
      !options.path.startsWith(`/${this.apiVersion}/projects/`)
    ) {
      const oldPath = options.path.slice(this.apiVersion.length + 1);
      options.path = `/${
        this.apiVersion
      }/projects/${this.clientAdapter.getProject()}/locations/${this.clientAdapter.getLocation()}${oldPath}`;
    }
  }

  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  protected async prepareRequest(
    request: RequestInit,
    { url, options }: { url: string; options: FinalRequestOptions },
  ): Promise<void> {}

  get<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp> {
    return this.methodRequest('get', path, opts);
  }

  post<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp> {
    return this.methodRequest('post', path, opts);
  }

  patch<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp> {
    return this.methodRequest('patch', path, opts);
  }

  put<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp> {
    return this.methodRequest('put', path, opts);
  }

  delete<Rsp>(path: string, opts?: PromiseOrValue<RequestOptions>): APIPromise<Rsp> {
    return this.methodRequest('delete', path, opts);
  }

  private methodRequest<Rsp>(
    method: HTTPMethod,
    path: string,
    opts?: PromiseOrValue<RequestOptions>,
  ): APIPromise<Rsp> {
    return this.request(
      Promise.resolve(opts).then((opts) => {
        return { method, path, ...opts };
      }),
    );
  }

  request<Rsp>(
    options: PromiseOrValue<FinalRequestOptions>,
    remainingRetries: number | null = null,
  ): APIPromise<Rsp> {
    return new APIPromise(this, this.makeRequest(options, remainingRetries, undefined));
  }

  private async makeRequest(
    optionsInput: PromiseOrValue<FinalRequestOptions>,
    retriesRemaining: number | null,
    retryOfRequestLogID: string | undefined,
  ): Promise<APIResponseProps> {
    const options = await optionsInput;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    if (retriesRemaining == null) {
      retriesRemaining = maxRetries;
    }

    await this.prepareOptions(options);

    const { req, url, timeout } = await this.buildRequest(options, {
      retryCount: maxRetries - retriesRemaining,
    });

    await this.prepareRequest(req, { url, options });

    /** Not an API request ID, just for correlating local log entries. */
    const requestLogID = 'log_' + ((Math.random() * (1 << 24)) | 0).toString(16).padStart(6, '0');
    const retryLogStr = retryOfRequestLogID === undefined ? '' : `, retryOf: ${retryOfRequestLogID}`;
    const startTime = Date.now();

    loggerFor(this).debug(
      `[${requestLogID}] sending request`,
      formatRequestDetails({
        retryOfRequestLogID,
        method: options.method,
        url,
        options,
        headers: req.headers,
      }),
    );

    if (options.signal?.aborted) {
      throw new Errors.APIUserAbortError();
    }

    const controller = new AbortController();
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    const headersTime = Date.now();

    if (response instanceof globalThis.Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (options.signal?.aborted) {
        throw new Errors.APIUserAbortError();
      }
      // detect native connection timeout errors
      // deno throws "TypeError: error sending request for url (https://example/): client error (Connect): tcp connect error: Operation timed out (os error 60): Operation timed out (os error 60)"
      // undici throws "TypeError: fetch failed" with cause "ConnectTimeoutError: Connect Timeout Error (attempted address: example:443, timeout: 1ms)"
      // others do not provide enough information to distinguish timeouts from other connection errors
      const isTimeout =
        isAbortError(response) ||
        /timed? ?out/i.test(String(response) + ('cause' in response ? String(response.cause) : ''));
      if (retriesRemaining) {
        loggerFor(this).info(
          `[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} - ${retryMessage}`,
        );
        loggerFor(this).debug(
          `[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} (${retryMessage})`,
          formatRequestDetails({
            retryOfRequestLogID,
            url,
            durationMs: headersTime - startTime,
            message: response.message,
          }),
        );
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      loggerFor(this).info(
        `[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} - error; no more retries left`,
      );
      loggerFor(this).debug(
        `[${requestLogID}] connection ${isTimeout ? 'timed out' : 'failed'} (error; no more retries left)`,
        formatRequestDetails({
          retryOfRequestLogID,
          url,
          durationMs: headersTime - startTime,
          message: response.message,
        }),
      );
      if (isTimeout) {
        throw new Errors.APIConnectionTimeoutError();
      }
      throw new Errors.APIConnectionError({ cause: response });
    }

    const responseInfo = `[${requestLogID}${retryLogStr}] ${req.method} ${url} ${
      response.ok ? 'succeeded' : 'failed'
    } with status ${response.status} in ${headersTime - startTime}ms`;

    if (!response.ok) {
      const shouldRetry = await this.shouldRetry(response);
      if (retriesRemaining && shouldRetry) {
        const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;

        // We don't need the body of this response.
        await Shims.CancelReadableStream(response.body);
        loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
        loggerFor(this).debug(
          `[${requestLogID}] response error (${retryMessage})`,
          formatRequestDetails({
            retryOfRequestLogID,
            url: response.url,
            status: response.status,
            headers: response.headers,
            durationMs: headersTime - startTime,
          }),
        );
        return this.retryRequest(
          options,
          retriesRemaining,
          retryOfRequestLogID ?? requestLogID,
          response.headers,
        );
      }

      const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;

      loggerFor(this).info(`${responseInfo} - ${retryMessage}`);

      const errText = await response.text().catch((err: any) => castToError(err).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? undefined : errText;

      loggerFor(this).debug(
        `[${requestLogID}] response error (${retryMessage})`,
        formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          message: errMessage,
          durationMs: Date.now() - startTime,
        }),
      );
      // @ts-ignore
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }

    loggerFor(this).info(responseInfo);
    loggerFor(this).debug(
      `[${requestLogID}] response start`,
      formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        headers: response.headers,
        durationMs: headersTime - startTime,
      }),
    );

    return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
  }

  async fetchWithTimeout(
    url: RequestInfo,
    init: RequestInit | undefined,
    ms: number,
    controller: AbortController,
  ): Promise<Response> {
    const { signal, method, ...options } = init || {};
    if (signal) signal.addEventListener('abort', () => controller.abort());

    const timeout = setTimeout(() => controller.abort(), ms);

    const isReadableBody =
      ((globalThis as any).ReadableStream && options.body instanceof (globalThis as any).ReadableStream) ||
      (typeof options.body === 'object' && options.body !== null && Symbol.asyncIterator in options.body);

    const fetchOptions: RequestInit = {
      signal: controller.signal as any,
      ...(isReadableBody ? { duplex: 'half' } : {}),
      method: 'GET',
      ...options,
    };
    if (method) {
      // Custom methods like 'patch' need to be uppercased
      // See https://github.com/nodejs/undici/issues/2294
      fetchOptions.method = method.toUpperCase();
    }

    try {
      // use undefined this binding; fetch errors if bound to something else in browser/cloudflare
      return await this.fetch.call(undefined, url, fetchOptions);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async shouldRetry(response: Response): Promise<boolean> {
    // Note this is not a standard header.
    const shouldRetryHeader = response.headers.get('x-should-retry');

    // If the server explicitly says whether or not to retry, obey.
    if (shouldRetryHeader === 'true') return true;
    if (shouldRetryHeader === 'false') return false;

    // Retry on request timeouts.
    if (response.status === 408) return true;

    // Retry on lock timeouts.
    if (response.status === 409) return true;

    // Retry on rate limits.
    if (response.status === 429) return true;

    // Retry internal errors.
    if (response.status >= 500) return true;

    return false;
  }

  private async retryRequest(
    options: FinalRequestOptions,
    retriesRemaining: number,
    requestLogID: string,
    responseHeaders?: Headers | undefined,
  ): Promise<APIResponseProps> {
    let timeoutMillis: number | undefined;

    // Note the `retry-after-ms` header may not be standard, but is a good idea and we'd like proactive support for it.
    const retryAfterMillisHeader = responseHeaders?.get('retry-after-ms');
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }

    // About the Retry-After header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
    const retryAfterHeader = responseHeaders?.get('retry-after');
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1000;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }

    // If the API asks us to wait a certain amount of time (and it's a reasonable amount),
    // just do what it says, but otherwise calculate a default
    if (!(timeoutMillis && 0 <= timeoutMillis && timeoutMillis < 60 * 1000)) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep(timeoutMillis);

    return this.makeRequest(options, retriesRemaining - 1, requestLogID);
  }

  private calculateDefaultRetryTimeoutMillis(retriesRemaining: number, maxRetries: number): number {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8.0;

    const numRetries = maxRetries - retriesRemaining;

    // Apply exponential backoff, but not more than the max.
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);

    // Apply some jitter, take up to at most 25 percent of the retry time.
    const jitter = 1 - Math.random() * 0.25;

    return sleepSeconds * jitter * 1000;
  }

  async buildRequest(
    inputOptions: FinalRequestOptions,
    { retryCount = 0 }: { retryCount?: number } = {},
  ): Promise<{ req: FinalizedRequestInit; url: string; timeout: number }> {
    const options = { ...inputOptions };
    const { method, path, query, defaultBaseURL } = options;

    const url = this.buildURL(path!, query as Record<string, unknown>, defaultBaseURL);
    if ('timeout' in options) validatePositiveInteger('timeout', options.timeout);
    options.timeout = options.timeout ?? this.timeout;
    const { bodyHeaders, body } = this.buildBody({ options });
    const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });

    const req: FinalizedRequestInit = {
      method,
      headers: reqHeaders,
      ...(options.signal && { signal: options.signal }),
      ...((globalThis as any).ReadableStream &&
        body instanceof (globalThis as any).ReadableStream && { duplex: 'half' }),
      ...(body && { body }),
      ...((this.fetchOptions as any) ?? {}),
      ...((options.fetchOptions as any) ?? {}),
    };

    return { req, url, timeout: options.timeout };
  }

  private async buildHeaders({
    options,
    method,
    bodyHeaders,
    retryCount,
  }: {
    options: FinalRequestOptions;
    method: HTTPMethod;
    bodyHeaders: HeadersLike;
    retryCount: number;
  }): Promise<Headers> {
    let idempotencyHeaders: HeadersLike = {};
    if (this.idempotencyHeader && method !== 'get') {
      if (!options.idempotencyKey) options.idempotencyKey = this.defaultIdempotencyKey();
      idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
    }

    const authHeaders = await this.authHeaders(options);

    let headers = buildHeaders([
      idempotencyHeaders,
      {
        Accept: 'application/json',
        'User-Agent': this.getUserAgent(),
        'X-Stainless-Retry-Count': String(retryCount),
        ...(options.timeout ? { 'X-Stainless-Timeout': String(Math.trunc(options.timeout / 1000)) } : {}),
        ...getPlatformHeaders(),
      },
      this._options.defaultHeaders,
      bodyHeaders,
      options.headers,
      authHeaders,
    ]);

    this.validateHeaders(headers);

    return headers.values;
  }

  private buildBody({ options: { body, headers: rawHeaders } }: { options: FinalRequestOptions }): {
    bodyHeaders: HeadersLike;
    body: BodyInit | undefined;
  } {
    if (!body) {
      return { bodyHeaders: undefined, body: undefined };
    }
    const headers = buildHeaders([rawHeaders]);
    if (
      // Pass raw type verbatim
      ArrayBuffer.isView(body) ||
      body instanceof ArrayBuffer ||
      body instanceof DataView ||
      (typeof body === 'string' &&
        // Preserve legacy string encoding behavior for now
        headers.values.has('content-type')) ||
      // `Blob` is superset of `File`
      ((globalThis as any).Blob && body instanceof (globalThis as any).Blob) ||
      // `FormData` -> `multipart/form-data`
      body instanceof FormData ||
      // `URLSearchParams` -> `application/x-www-form-urlencoded`
      body instanceof URLSearchParams ||
      // Send chunked stream (each chunk has own `length`)
      ((globalThis as any).ReadableStream && body instanceof (globalThis as any).ReadableStream)
    ) {
      return { bodyHeaders: undefined, body: body as BodyInit };
    } else if (
      typeof body === 'object' &&
      (Symbol.asyncIterator in body ||
        (Symbol.iterator in body && 'next' in body && typeof body.next === 'function'))
    ) {
      return { bodyHeaders: undefined, body: Shims.ReadableStreamFrom(body as AsyncIterable<Uint8Array>) };
    } else {
      return this.encoder({ body, headers });
    }
  }

  static DEFAULT_TIMEOUT = 60000; // 1 minute
}

/**
 * API Client for interfacing with the Gemini Next Gen API API.
 */
export class GeminiNextGenAPIClient extends BaseGeminiNextGenAPIClient {
  static GeminiNextGenAPIClient = this;

  static GeminiNextGenAPIClientError = Errors.GeminiNextGenAPIClientError;
  static APIError = Errors.APIError;
  static APIConnectionError = Errors.APIConnectionError;
  static APIConnectionTimeoutError = Errors.APIConnectionTimeoutError;
  static APIUserAbortError = Errors.APIUserAbortError;
  static NotFoundError = Errors.NotFoundError;
  static ConflictError = Errors.ConflictError;
  static RateLimitError = Errors.RateLimitError;
  static BadRequestError = Errors.BadRequestError;
  static AuthenticationError = Errors.AuthenticationError;
  static InternalServerError = Errors.InternalServerError;
  static PermissionDeniedError = Errors.PermissionDeniedError;
  static UnprocessableEntityError = Errors.UnprocessableEntityError;

  static toFile = Uploads.toFile;

  interactions: API.Interactions = new API.Interactions(this);
}

GeminiNextGenAPIClient.Interactions = Interactions;

export declare namespace GeminiNextGenAPIClient {
  export type RequestOptions = Opts.RequestOptions;

  export {
    Interactions as Interactions,
    type AllowedTools as AllowedTools,
    type Annotation as Annotation,
    type AudioContent as AudioContent,
    type AudioMimeType as AudioMimeType,
    type CodeExecutionCallArguments as CodeExecutionCallArguments,
    type CodeExecutionCallContent as CodeExecutionCallContent,
    type CodeExecutionResultContent as CodeExecutionResultContent,
    type Content as Content,
    type ContentDelta as ContentDelta,
    type ContentStart as ContentStart,
    type ContentStop as ContentStop,
    type DeepResearchAgentConfig as DeepResearchAgentConfig,
    type DocumentContent as DocumentContent,
    type DocumentMimeType as DocumentMimeType,
    type DynamicAgentConfig as DynamicAgentConfig,
    type ErrorEvent as ErrorEvent,
    type FileSearchCallContent as FileSearchCallContent,
    type FileSearchResultContent as FileSearchResultContent,
    type Function as Function,
    type FunctionCallContent as FunctionCallContent,
    type FunctionResultContent as FunctionResultContent,
    type GenerationConfig as GenerationConfig,
    type GoogleSearchCallArguments as GoogleSearchCallArguments,
    type GoogleSearchCallContent as GoogleSearchCallContent,
    type GoogleSearchResult as GoogleSearchResult,
    type GoogleSearchResultContent as GoogleSearchResultContent,
    type ImageConfig as ImageConfig,
    type ImageContent as ImageContent,
    type ImageMimeType as ImageMimeType,
    type Interaction as Interaction,
    type InteractionCompleteEvent as InteractionCompleteEvent,
    type InteractionSSEEvent as InteractionSSEEvent,
    type InteractionStartEvent as InteractionStartEvent,
    type InteractionStatusUpdate as InteractionStatusUpdate,
    type MCPServerToolCallContent as MCPServerToolCallContent,
    type MCPServerToolResultContent as MCPServerToolResultContent,
    type Model as Model,
    type SpeechConfig as SpeechConfig,
    type TextContent as TextContent,
    type ThinkingLevel as ThinkingLevel,
    type ThoughtContent as ThoughtContent,
    type Tool as Tool,
    type ToolChoice as ToolChoice,
    type ToolChoiceConfig as ToolChoiceConfig,
    type ToolChoiceType as ToolChoiceType,
    type Turn as Turn,
    type URLContextCallArguments as URLContextCallArguments,
    type URLContextCallContent as URLContextCallContent,
    type URLContextResult as URLContextResult,
    type URLContextResultContent as URLContextResultContent,
    type Usage as Usage,
    type VideoContent as VideoContent,
    type VideoMimeType as VideoMimeType,
    type InteractionDeleteResponse as InteractionDeleteResponse,
    type InteractionCreateParams as InteractionCreateParams,
    type CreateModelInteractionParamsNonStreaming as CreateModelInteractionParamsNonStreaming,
    type CreateModelInteractionParamsStreaming as CreateModelInteractionParamsStreaming,
    type CreateAgentInteractionParamsNonStreaming as CreateAgentInteractionParamsNonStreaming,
    type CreateAgentInteractionParamsStreaming as CreateAgentInteractionParamsStreaming,
    type InteractionDeleteParams as InteractionDeleteParams,
    type InteractionCancelParams as InteractionCancelParams,
    type InteractionGetParams as InteractionGetParams,
    type InteractionGetParamsNonStreaming as InteractionGetParamsNonStreaming,
    type InteractionGetParamsStreaming as InteractionGetParamsStreaming,
  };
}
