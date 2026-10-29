/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Details for errors from calling the API.
 */
export interface ApiErrorInfo {
  /** The error message. */
  message: string;
  /** The HTTP status code. */
  status: number;
}

/**
 * API errors raised by the GenAI API.
 *
 * `error instanceof ApiError` is also `true` for HTTP 4xx/5xx errors raised by
 * the Interactions-style APIs (`InteractionsAPIError` and its status
 * subclasses such as `BadRequestError`), so a single `instanceof ApiError`
 * check catches HTTP errors from every API surface. Connection, timeout and
 * abort errors (`APIConnectionError`, `APIConnectionTimeoutError`,
 * `APIUserAbortError`) do not match, since they have no HTTP status.
 *
 * A matched `InteractionsAPIError` is not a real `ApiError` object: its `name`
 * is the `InteractionsAPIError` subclass name (for example
 * `'BadRequestError'`), and its `message` is formatted as `'<status> <text>'`
 * rather than a JSON string, so do not `JSON.parse(error.message)`. Use
 * `error.status` (and, for `InteractionsAPIError`, `error.error`) instead.
 */
export class ApiError extends Error {
  /** HTTP status code */
  status: number;

  constructor(options: ApiErrorInfo) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  // Type-only declaration: the implementation is installed with
  // `Object.defineProperty` below, so that it also works when compiled to ES5.
  /**
   * Recognizes GAOS HTTP status errors (4xx/5xx `APIError` subclasses) as
   * `ApiError` instances while excluding non-HTTP connection/timeout/abort
   * errors (`status === undefined`).
   */
  declare static [Symbol.hasInstance]: (instance: unknown) => boolean;
}

function isApiErrorInstance(this: unknown, instance: unknown): boolean {
  if (Function.prototype[Symbol.hasInstance].call(this, instance)) {
    return true;
  }
  // Only `ApiError` itself (not its subclasses) recognizes GAOS errors.
  return (
    this === ApiError &&
    instance instanceof APIError &&
    typeof instance.status === 'number' &&
    instance.status >= 400 &&
    instance.status < 600
  );
}

// Install `Symbol.hasInstance` with `Object.defineProperty` rather than a
// class `static` method: when compiled to ES5, a static method becomes the
// assignment `ApiError[Symbol.hasInstance] = ...`, which throws a `TypeError`
// in strict mode (modules are always strict) because
// `Function.prototype[Symbol.hasInstance]` is non-writable.
// `isApiErrorInstance` uses its `this` binding, so `instanceof` checks against
// subclasses of `ApiError` keep the default prototype-chain behavior.
Object.defineProperty(ApiError, Symbol.hasInstance, {
  value: isApiErrorInstance,
  writable: true,
  configurable: true,
});

/** Base error class for Gemini NextGen API client errors. */
export class GeminiNextGenAPIClientError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Details for a `ContinuationInterruptedError`.
 */
export interface ContinuationInterruptedErrorInfo {
  /** The error message. */
  message: string;
  /** The underlying error (the failed hop's API or transport error). */
  cause?: unknown;
  /**
   * For unary calls, the interaction merged from the hops that completed;
   * undefined for streams.
   */
  partialInteraction?: unknown;
  /** The latest resumable continuation token. */
  continuationToken?: string;
  /** The id of the interaction that issued `continuationToken`. */
  interactionId?: string;
  /** The ids of every hop created during the call, in order. */
  continuationIds?: string[];
}

/**
 * Thrown when Interactions automatic continuation fails after progress.
 *
 * `interactions.create()` with `automatic_continuation` enabled (the default)
 * may make several requests ("hops"), each one resuming the decode from the
 * previous hop's `continuation_token`. If a hop fails after the server already
 * produced (and billed) output in an earlier hop, or after a resumable
 * checkpoint was reached, this error is thrown instead of the underlying
 * error so the work is not lost. The underlying error is `cause`.
 *
 * To resume, pass `continuationToken` as `continuation_token` to
 * `interactions.create()`: with `store` enabled (the default), also pass
 * `interactionId` as `previous_interaction_id` and no `input`; with
 * `store: false`, resend the original `input`.
 */
export class ContinuationInterruptedError extends Error {
  /** The underlying error (the failed hop's API or transport error). */
  override readonly cause: unknown;
  /**
   * For unary calls, the interaction merged from the hops that completed
   * (status `requires_continuation`, with the resumable `continuation_token`),
   * or undefined if no hop completed. Always undefined for streams, whose
   * events were already yielded.
   */
  readonly partialInteraction: unknown;
  /**
   * The latest resumable continuation token. For streams this may be a mid-hop
   * checkpoint: resuming from it re-generates any output yielded after the
   * checkpoint.
   */
  readonly continuationToken: string | undefined;
  /**
   * The id of the interaction that issued `continuationToken` (the value to
   * send as `previous_interaction_id`), or undefined if unknown or unstored
   * (`store: false`).
   */
  readonly interactionId: string | undefined;
  /** The ids of every hop created during the call, in order. */
  readonly continuationIds: string[];

  constructor(options: ContinuationInterruptedErrorInfo) {
    super(options.message, {cause: options.cause});
    this.name = 'ContinuationInterruptedError';
    if (typeof this.cause === 'undefined') {
      this.cause = options.cause;
    }
    this.partialInteraction = options.partialInteraction;
    this.continuationToken = options.continuationToken;
    this.interactionId = options.interactionId;
    this.continuationIds = [...(options.continuationIds ?? [])];
    Object.setPrototypeOf(this, ContinuationInterruptedError.prototype);
  }
}

/**
 * General errors raised by the Interactions-style APIs.
 *
 * Exported as `InteractionsAPIError` at the package root to avoid a case-only
 * collision with `ApiError`.
 */
class APIError<
  TStatus extends number | undefined = number | undefined,
  THeaders extends Headers | undefined = Headers | undefined,
  TError extends object | undefined = object | undefined,
> extends GeminiNextGenAPIClientError {
  /** HTTP status for the response that caused the error */
  readonly status: TStatus;
  /** HTTP headers for the response that caused the error */
  readonly headers: THeaders;
  /** JSON body of the response that caused the error */
  readonly error: TError;
  /** HTTP status code */
  readonly statusCode: TStatus;
  /** HTTP body */
  readonly body: string;
  /** HTTP content type */
  readonly contentType: string;
  /** Raw response */
  readonly rawResponse: Response | undefined;
  override cause: unknown;

  constructor(
    status: TStatus,
    error: TError,
    message: string | undefined,
    headers: THeaders,
  ) {
    super(APIError.makeMessage(status, error, message));

    this.status = status;
    this.headers = headers;
    this.error = error;
    this.statusCode = status;
    this.body = stringifyErrorBody(error);
    this.contentType = headers?.get('content-type') || '';
    this.rawResponse = undefined;
    this.cause = undefined;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  private static makeMessage(
    status: number | undefined,
    error: object | undefined,
    message: string | undefined,
  ): string {
    const errorMessage =
      error && isPlainObject(error) && typeof error['message'] === 'string'
        ? error['message']
        : undefined;
    const errorBody = stringifyErrorBody(error);
    const msg = errorMessage ?? message ?? (errorBody || 'An error occurred');
    const statusText = status ? `${status} ` : '';
    return `${statusText}${msg}`;
  }

  static generate(
    status: number | undefined,
    errorResponse: object | undefined,
    message: string | undefined,
    headers: Headers | undefined,
  ): APIError {
    if (!status || !headers) {
      return new APIConnectionError({
        message,
        cause: errorResponse instanceof Error ? errorResponse : undefined,
      });
    }

    if (status === 400) {
      return new BadRequestError(status, errorResponse, message, headers);
    }
    if (status === 401) {
      return new AuthenticationError(status, errorResponse, message, headers);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, errorResponse, message, headers);
    }
    if (status === 404) {
      return new NotFoundError(status, errorResponse, message, headers);
    }
    if (status === 409) {
      return new ConflictError(status, errorResponse, message, headers);
    }
    if (status === 422) {
      return new UnprocessableEntityError(
        status,
        errorResponse,
        message,
        headers,
      );
    }
    if (status === 429) {
      return new RateLimitError(status, errorResponse, message, headers);
    }
    if (status >= 500) {
      return new InternalServerError(status, errorResponse, message, headers);
    }
    return new APIError(status, errorResponse, message, headers);
  }
}

export {APIError as InteractionsAPIError};

/** Error raised when a request is aborted by the caller. */
export class APIUserAbortError extends APIError<
  undefined,
  undefined,
  undefined
> {
  constructor({message}: {message?: string} = {}) {
    super(undefined, undefined, message || 'Request was aborted.', undefined);
  }
}

/** Error raised when a network connection fails. */
export class APIConnectionError extends APIError<
  undefined,
  undefined,
  undefined
> {
  constructor({
    message,
    cause,
  }: {
    message?: string | undefined;
    cause?: Error | unknown | undefined;
  }) {
    super(undefined, undefined, message || 'Connection error.', undefined);
    this.cause = cause;
  }
}

/** Error raised when a request times out on the client. */
export class APIConnectionTimeoutError extends APIConnectionError {
  constructor({message}: {message?: string} = {}) {
    super({
      message:
        message ||
        'Request timed out. This is a client-side timeout. You can increase the timeout by setting the `timeout` argument in your request or client http options.',
    });
  }
}

/** HTTP 400 Bad Request error. */
export class BadRequestError extends APIError<400, Headers> {}
/** HTTP 401 Unauthorized error. */
export class AuthenticationError extends APIError<401, Headers> {}
/** HTTP 403 Forbidden error. */
export class PermissionDeniedError extends APIError<403, Headers> {}
/** HTTP 404 Not Found error. */
export class NotFoundError extends APIError<404, Headers> {}
/** HTTP 409 Conflict error. */
export class ConflictError extends APIError<409, Headers> {}
/** HTTP 422 Unprocessable Entity error. */
export class UnprocessableEntityError extends APIError<422, Headers> {}
/** HTTP 429 Too Many Requests error. */
export class RateLimitError extends APIError<429, Headers> {}
/** HTTP 5xx Internal Server error. */
export class InternalServerError extends APIError<number, Headers> {}

function stringifyErrorBody(error: object | undefined): string {
  if (!error) return '';
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
