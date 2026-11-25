/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interactions API error classes shared by the public (`gaos`) and private
 * (`gaos-private`) Interactions SDKs and the hand-written Live transports.
 *
 * Not re-exported wholesale from the package root: only `APIWebSocketError`
 * and `APIWebRTCError` are public (from `index.ts`); the private entry point
 * keeps exporting `APIError` and `APIConnectionError` as before.
 */

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

/** Base error class for Gemini NextGen API client errors. */
export class GeminiNextGenAPIClientError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** General errors raised by the GenAI Interactions API. */
export class APIError<
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
    return new APIError(status, errorResponse, message, headers);
  }
}

/** Raised when an Interactions API network or transport connection fails. */
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

/**
 * Raised when a live interaction WebSocket connection or frame fails.
 *
 * @experimental
 */
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
    super({message: options.message ?? 'WebSocket connection error.'});
    this.closeCode = options.closeCode;
    this.httpStatus = options.httpStatus;
    this.serverCode = options.serverCode;
  }
}

/**
 * Raised when a live interaction WebRTC connection or channel fails.
 *
 * @experimental
 */
export class APIWebRTCError extends APIConnectionError {
  /** Data-channel or peer-connection close code, when applicable. */
  readonly closeCode?: number | undefined;
  /** HTTP status code when `:webrtc` SDP signaling failed. */
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
    super({message: options.message ?? 'WebRTC connection error.'});
    this.closeCode = options.closeCode;
    this.httpStatus = options.httpStatus;
    this.serverCode = options.serverCode;
  }
}
