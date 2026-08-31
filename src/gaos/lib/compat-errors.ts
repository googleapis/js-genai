/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * g3-prettier-ignore-file
 */

import {
  ConnectionError,
  HTTPClientError,
  RequestAbortedError,
  RequestTimeoutError,
} from "../models/errors/http-client-errors.js";
import { GoogleGenAiError } from "../models/errors/google-gen-ai-error.js";

export class GeminiNextGenAPIClientError extends Error {}

/** General errors raised by the GenAI API. */
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
    this.contentType = headers?.get("content-type") || "";
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
      error && isPlainObject(error) && typeof error["message"] === "string"
        ? error["message"]
        : undefined;
    const errorBody = stringifyErrorBody(error);
    const msg = errorMessage ?? message ?? (errorBody || "An error occurred");
    const statusText = status ? `${status} ` : "";
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

export class APIUserAbortError extends APIError<
  undefined,
  undefined,
  undefined
> {
  constructor({ message }: { message?: string } = {}) {
    super(undefined, undefined, message || "Request was aborted.", undefined);
  }
}

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
    super(undefined, undefined, message || "Connection error.", undefined);
    this.cause = cause;
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  constructor({ message }: { message?: string } = {}) {
    super({
      message:
        message ||
        "Request timed out. This is a client-side timeout. You can increase the timeout by setting the `timeout` argument in your request or client http options.",
    });
  }
}

export class BadRequestError extends APIError<400, Headers> {}
export class AuthenticationError extends APIError<401, Headers> {}
export class PermissionDeniedError extends APIError<403, Headers> {}
export class NotFoundError extends APIError<404, Headers> {}
export class ConflictError extends APIError<409, Headers> {}
export class UnprocessableEntityError extends APIError<422, Headers> {}
export class RateLimitError extends APIError<429, Headers> {}
export class InternalServerError extends APIError<number, Headers> {}

export function wrapSDKError(error: unknown): unknown {
  if (isCompatAPIErrorInstance(error)) {
    return error;
  }

  if (error instanceof GoogleGenAiError) {
    return wrapAPIError(error);
  }

  if (error instanceof HTTPClientError) {
    return wrapHTTPClientError(error);
  }

  return error;
}

function wrapAPIError(error: GoogleGenAiError): APIError {
  const errorPayload = getErrorPayload(error);
  const wrapped = APIError.generate(
    error.statusCode,
    errorPayload,
    error.message,
    error.headers,
  ) as APIError;

  defineReadonly(wrapped, "body", error.body);
  defineReadonly(wrapped, "contentType", error.contentType);
  defineReadonly(wrapped, "rawResponse", error.rawResponse);
  defineReadonly(wrapped, "statusCode", error.statusCode);
  defineReadonly(wrapped, "cause", error);

  return wrapped;
}

function wrapHTTPClientError(error: HTTPClientError): APIConnectionError {
  if (error instanceof RequestTimeoutError) {
    return new APIConnectionTimeoutError({ message: error.message });
  }
  if (error instanceof RequestAbortedError) {
    return new APIUserAbortError({ message: error.message });
  }
  if (error instanceof ConnectionError) {
    return new APIConnectionError({ message: error.message, cause: error });
  }
  return new APIConnectionError({ message: error.message, cause: error });
}

function getErrorPayload(error: GoogleGenAiError): object | undefined {
  const data = getObjectProperty(error, "data$");
  if (data && typeof data === "object") {
    return data as object;
  }

  try {
    const parsed = JSON.parse(error.body) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as object;
    }
  } catch {
    // Fall through to generated error.error below.
  }

  const dataError = getObjectProperty(error, "error");
  return dataError && typeof dataError === "object"
    ? (dataError as object)
    : undefined;
}

function getObjectProperty(value: unknown, key: string): unknown {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function stringifyErrorBody(error: object | undefined): string {
  if (!error) return "";
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCompatAPIErrorInstance(value: unknown): value is APIError {
  // Avoid instanceof here so this guard never depends on Symbol.hasInstance.
  return typeof value === "object" && value !== null
    ? APIError.prototype.isPrototypeOf(value)
    : false;
}

function defineReadonly<T extends object, K extends PropertyKey>(
  target: T,
  key: K,
  value: unknown,
): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: false,
  });
}
