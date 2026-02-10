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
 */
export class ApiError extends Error {
  /** HTTP status code */
  status: number;

  constructor(options: ApiErrorInfo) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
