/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

export { GeminiNextGenAPIClient as default } from './client.js';

export { type Uploadable, type BlobLikePart, toFile } from './core/uploads.js';
export { APIPromise } from './core/api-promise.js';
export { BaseGeminiNextGenAPIClient, GeminiNextGenAPIClient, type ClientOptions } from './client.js';
export {
  GeminiNextGenAPIClientError,
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BadRequestError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  UnprocessableEntityError,
} from './core/error.js';
