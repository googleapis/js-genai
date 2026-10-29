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
