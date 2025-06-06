/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Options for HTTP errors from calling the API.
 */
export interface HttpErrorOptions {
  /** The error message. */
  message: string;
  /** An optional custom stack trace. */
  stackTrace?: string;
  /** An optional HTTP status code. */
  status?: number;
}

/**
 * Client errors raised by the GenAI API.
 */
export class ClientError extends Error {
  /** Http status code */
  status?: number;

  constructor(options: HttpErrorOptions) {
    if (options.stackTrace) {
      super(options.message, {cause: options.stackTrace});
    } else {
      super(options.message, {cause: new Error().stack});
    }
    this.name = 'ClientError';
    this.status = options.status;
  }
}

/**
 * Server errors raised by the GenAI API.
 */
export class ServerError extends Error {
  /** Http status code */
  status?: number;

  constructor(options: HttpErrorOptions) {
    if (options.stackTrace) {
      super(options.message, {cause: options.stackTrace});
    } else {
      super(options.message, {cause: new Error().stack});
    }
    this.name = 'ServerError';
    this.status = options.status;
  }
}
