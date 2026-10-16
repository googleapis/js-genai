/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const API_ERROR_SYMBOL = Symbol.for('@google/genai.ApiError');

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
    Object.defineProperty(this, API_ERROR_SYMBOL, {
      value: true,
    });
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static [Symbol.hasInstance](value: unknown): boolean {
    if (this !== ApiError) {
      return Function.prototype[Symbol.hasInstance].call(this, value);
    }
    return (
      Function.prototype[Symbol.hasInstance].call(this, value) ||
      (typeof value === 'object' &&
        value !== null &&
        (value as Record<symbol, unknown>)[API_ERROR_SYMBOL] === true)
    );
  }
}
