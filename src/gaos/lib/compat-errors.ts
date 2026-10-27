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

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  GeminiNextGenAPIClientError,
  InteractionsAPIError as APIError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
} from "../../errors.js";

export {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
  BadRequestError,
  ConflictError,
  GeminiNextGenAPIClientError,
  InternalServerError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
};

export function wrapSDKError(error: unknown): unknown {
  if (isCompatAPIErrorInstance(error)) {
    return error;
  }

  if (isGoogleGenAiErrorInstance(error)) {
    return wrapAPIError(error);
  }

  if (isHTTPClientErrorInstance(error)) {
    return wrapHTTPClientError(error);
  }

  return error;
}

function isGoogleGenAiErrorInstance(value: unknown): value is GoogleGenAiError {
  if (value instanceof GoogleGenAiError) {
    return true;
  }
  return (
    value instanceof Error &&
    typeof (value as { statusCode?: unknown }).statusCode === "number" &&
    typeof (value as { body?: unknown }).body === "string"
  );
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

// The generated HTTP client errors extend Error without restoring their
// prototype, so `instanceof` misses them once the SDK is compiled to ES5.
// Recognise them by name as well.
const HTTP_CLIENT_ERROR_NAMES: ReadonlySet<string> = new Set([
  "HTTPClientError",
  "UnexpectedClientError",
  "InvalidRequestError",
  "RequestAbortedError",
  "RequestTimeoutError",
  "ConnectionError",
]);

function isHTTPClientErrorInstance(value: unknown): value is HTTPClientError {
  if (value instanceof HTTPClientError) {
    return true;
  }
  return value instanceof Error && HTTP_CLIENT_ERROR_NAMES.has(value.name);
}

function wrapHTTPClientError(error: HTTPClientError): APIConnectionError {
  if (
    error instanceof RequestTimeoutError ||
    error.name === "RequestTimeoutError"
  ) {
    return new APIConnectionTimeoutError({ message: error.message });
  }
  if (
    error instanceof RequestAbortedError ||
    error.name === "RequestAbortedError"
  ) {
    return new APIUserAbortError({ message: error.message });
  }
  if (error instanceof ConnectionError || error.name === "ConnectionError") {
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
