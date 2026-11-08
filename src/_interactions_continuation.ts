/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Automatic continuation state and helpers for the Interactions API.
 *
 * `interactions.create()` with `automatic_continuation` enabled (the default)
 * may make several HTTP requests ("hops"), each one resuming the decode from
 * the previous hop's `continuation_token`. This module holds the
 * transport-agnostic parts shared by the public and private GAOS bridges: the
 * request shaping for continuation hops, the unary loop and merge, the stream
 * continuation policy (resume points, no-progress reconnects, token
 * ownership), and the whole-call deadline.
 */

import {ContinuationInterruptedError} from './errors.js';

/**
 * Maximum consecutive reconnects after a mid-hop disconnect that made no
 * progress (no new checkpoint token since the hop's start token).
 */
export const MAX_STREAM_RECONNECTS_WITHOUT_PROGRESS = 3;

export const AUTO_CONTINUE_AND_BACKGROUND_ERROR =
  'automatic_continuation: false cannot be used with background: true.';

const INCOMPLETE_CONTINUATION_WARNING =
  "Interaction stopped before completion (status='requires_continuation') " +
  'with a continuation_token because the per-request decode token limit was ' +
  'reached. To resume decoding automatically, pass ' +
  'automatic_continuation: true (note: each continuation hop re-prefills and ' +
  'bills input tokens), or use background: true (the most cost-efficient ' +
  'option for server-managed continuation), or resume manually by passing ' +
  'continuation_token to interactions.create() (with ' +
  "previous_interaction_id set to this interaction's id and no input, or " +
  'with the original input when store: false).';

const RESUMABLE_STREAM_HOP_STATUSES: ReadonlySet<string | undefined> = new Set([
  undefined,
  'in_progress',
  'requires_continuation',
]);

// Events that carry no model output. A stream that drops after one of these
// (and nothing else) since the last checkpoint can be resumed without
// duplicating output.
const NON_CONTENT_STREAM_EVENTS: ReadonlySet<string> = new Set([
  'interaction.created',
  'interaction.status_update',
]);

// Usage list fields are merged per key (e.g. per modality), summing the value.
const USAGE_LIST_KEYS: Readonly<Record<string, readonly [string, string]>> = {
  cached_tokens_by_modality: ['modality', 'tokens'],
  input_tokens_by_modality: ['modality', 'tokens'],
  output_tokens_by_modality: ['modality', 'tokens'],
  tool_use_tokens_by_modality: ['modality', 'tokens'],
  grounding_tool_count: ['type', 'count'],
};

type JsonObject = Record<string, unknown>;

let incompleteContinuationWarned = false;

/** Resets the one-time opt-out warning; for tests only. */
export function resetIncompleteContinuationWarningForTesting(): void {
  incompleteContinuationWarned = false;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getValue(value: unknown, name: string): unknown {
  return isObject(value) ? value[name] : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function isInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isUnset(value: unknown): boolean {
  return value === undefined || value === null;
}

/** The per-call `timeout` ran out before automatic continuation finished. */
export class ContinuationTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContinuationTimeoutError';
    Object.setPrototypeOf(this, ContinuationTimeoutError.prototype);
  }
}

/**
 * Wall-clock budget of one logical `interactions.create()` call.
 *
 * A numeric per-call timeout bounds the whole call rather than each
 * continuation hop (HTTP request): the deadline is fixed when the call starts,
 * every hop is sent with the time left, and no further hop starts once it has
 * passed. Without a timeout (or when disabled, e.g. for opt-out, background
 * or agent calls) the deadline never expires and hops are sent unchanged.
 */
export class CallDeadline {
  private readonly deadlineMs: number | undefined;
  private readonly now: () => number;

  constructor(
    readonly timeoutMs: number | undefined,
    options: {enabled?: boolean; now?: () => number} = {},
  ) {
    this.now = options.now ?? Date.now;
    const enabled = options.enabled ?? true;
    if (
      enabled &&
      typeof timeoutMs === 'number' &&
      Number.isFinite(timeoutMs)
    ) {
      this.deadlineMs = this.now() + timeoutMs;
    }
  }

  /** Whether this deadline bounds the call at all. */
  get bounded(): boolean {
    return this.deadlineMs !== undefined;
  }

  /** Milliseconds left before the deadline, or undefined if unbounded. */
  remainingMs(): number | undefined {
    if (this.deadlineMs === undefined) {
      return undefined;
    }
    return this.deadlineMs - this.now();
  }

  expired(): boolean {
    const remaining = this.remainingMs();
    return remaining !== undefined && remaining <= 0;
  }

  /**
   * The `timeout_ms` to send with the next hop: the time left (rounded up to
   * a whole millisecond, at least 1) if bounded, else the configured value.
   */
  hopTimeoutMs(): number | undefined {
    const remaining = this.remainingMs();
    if (remaining === undefined) {
      return this.timeoutMs;
    }
    return Math.max(1, Math.ceil(remaining));
  }

  /** Throws `ContinuationTimeoutError` once the deadline has passed. */
  check(): void {
    if (this.expired()) {
      throw new ContinuationTimeoutError(
        `interactions.create() timed out after ${this.timeoutMs} ms before` +
          ' automatic continuation finished. Increase the timeout (it bounds' +
          ' the whole call, across continuation hops) or resume from the' +
          ' continuation_token.',
      );
    }
  }
}

/** Whether the create body targets an agent (server-managed loop). */
export function isAgentBody(body: unknown): boolean {
  return (
    !isUnset(getValue(body, 'agent')) ||
    !isUnset(getValue(body, 'agent_config'))
  );
}

/**
 * Returns the create body for a continuation hop resuming from `token`.
 *
 * With `store` enabled (the default) the server rebuilds the context from the
 * stored interaction that issued `token`, so the hop sends that interaction as
 * `previous_interaction_id` (the server checks the token belongs to it) and
 * omits `input`. With `store: false` nothing is stored, so the original
 * `input` is resent with the token instead.
 *
 * `tokenOwnerId` is undefined when the token did not come from an earlier hop
 * (e.g. the caller's own `continuation_token`); the original request is then
 * resent as-is with `token`.
 */
export function continuationBody(
  body: JsonObject,
  token: string,
  tokenOwnerId: string | undefined,
): JsonObject {
  const stateful = !!tokenOwnerId && body['store'] !== false;
  if (!stateful) {
    return {...body, continuation_token: token};
  }
  const {input: _input, ...rest} = body;
  return {
    ...rest,
    continuation_token: token,
    previous_interaction_id: tokenOwnerId,
  };
}

/** Prepared `interactions.create()` request state. */
export interface PreparedCreateRequest {
  /** The request body (without SDK-only options), ready for the first hop. */
  readonly body: JsonObject;
  readonly stream: boolean;
  /** The caller's own `continuation_token`, if any. */
  readonly callerToken: string | undefined;
  /** Whether the SDK runs the continuation loop for this call. */
  readonly enableContinuation: boolean;
}

/**
 * Validates and normalizes `create()` arguments for continuation.
 *
 * `body` must not contain SDK-only options (`automatic_continuation`,
 * `api_version`). Throws when `background: true` is combined with an explicit
 * `automatic_continuation: false`.
 */
export function prepareCreateRequest(
  body: JsonObject,
  automaticContinuation: boolean | undefined,
): PreparedCreateRequest {
  const isBackground = body['background'] === true;
  const stream = body['stream'] === true;
  if (isBackground && automaticContinuation === false) {
    throw new Error(AUTO_CONTINUE_AND_BACKGROUND_ERROR);
  }
  const enableContinuation =
    (automaticContinuation ?? true) !== false &&
    !isBackground &&
    !isAgentBody(body);
  return {
    body,
    stream,
    callerToken: nonEmptyString(body['continuation_token']),
    enableContinuation,
  };
}

/**
 * Returns the body for the initial hop (`token` undefined) or a continuation
 * hop resuming from `token`.
 */
export function hopBody(
  prepared: PreparedCreateRequest,
  token: string | undefined,
  tokenOwnerId: string | undefined,
): JsonObject {
  if (token === undefined) {
    return prepared.body;
  }
  return continuationBody(prepared.body, token, tokenOwnerId);
}

// ---------------------------------------------------------------------------
// Opt-out warning
// ---------------------------------------------------------------------------

function warnIncompleteContinuation(): void {
  if (!incompleteContinuationWarned) {
    incompleteContinuationWarned = true;
    console.warn(INCOMPLETE_CONTINUATION_WARNING);
  }
}

/** Emits a one-time warning when unary `create()` stops uncontinued. */
export function warnIfIncompleteUnary(interaction: unknown): void {
  if (shouldContinueUnary(interaction)) {
    warnIncompleteContinuation();
  }
}

/**
 * Passes every event of `events` through and emits a one-time warning when
 * the stream was left uncontinued at `requires_continuation`.
 */
export async function* withIncompleteStreamWarning<T>(
  events: AsyncIterable<T>,
): AsyncGenerator<T, void, undefined> {
  let hopStatus: string | undefined;
  let hopToken: string | undefined;
  for await (const event of events) {
    [hopStatus, hopToken] = extractHopContinuationState(
      event,
      hopStatus,
      hopToken,
    );
    yield event;
  }
  if (hopStatus === 'requires_continuation' && hopToken) {
    warnIncompleteContinuation();
  }
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

/** Extracts `[status, continuation_token]` updates from one SSE event. */
function extractHopContinuationState(
  event: unknown,
  hopStatus: string | undefined,
  hopToken: string | undefined,
): [string | undefined, string | undefined] {
  const eventType = getValue(event, 'event_type');
  if (eventType === 'error') {
    return ['error', undefined];
  }
  const interaction = getValue(event, 'interaction');
  if (interaction !== undefined && interaction !== null) {
    const status = nonEmptyString(getValue(interaction, 'status'));
    if (status) {
      hopStatus = status;
    }
    const token = nonEmptyString(getValue(interaction, 'continuation_token'));
    if (eventType === 'interaction.completed') {
      // The terminal snapshot is authoritative: a missing token clears the
      // hop's seed token and any earlier mid-hop checkpoint token.
      hopToken = token;
    } else if (token) {
      hopToken = token;
    }
  }
  const directStatus = nonEmptyString(getValue(event, 'status'));
  if (directStatus) {
    hopStatus = directStatus;
  }
  const directToken = nonEmptyString(getValue(event, 'continuation_token'));
  if (directToken) {
    hopToken = directToken;
  }
  return [hopStatus, hopToken];
}

/** Tracks whether output was yielded since the latest resume point. */
function hasContentSinceCheckpoint(
  event: unknown,
  contentSinceCheckpoint: boolean,
): boolean {
  const eventType = getValue(event, 'event_type');
  if (eventType === 'interaction.status_update') {
    if (nonEmptyString(getValue(event, 'continuation_token'))) {
      return false;
    }
    return contentSinceCheckpoint;
  }
  if (eventType === 'interaction.completed') {
    // The terminal snapshot's token (if any) is a fresh resume point.
    return false;
  }
  if (
    typeof eventType === 'string' &&
    NON_CONTENT_STREAM_EVENTS.has(eventType)
  ) {
    return contentSinceCheckpoint;
  }
  return true;
}

/** The id of the interaction (hop) an SSE event belongs to, if present. */
function eventInteractionId(event: unknown): string | undefined {
  return (
    nonEmptyString(getValue(event, 'interaction_id')) ??
    nonEmptyString(getValue(getValue(event, 'interaction'), 'id'))
  );
}

function canResumeStreamHop(
  hopStatus: string | undefined,
  hopToken: string | undefined,
): hopToken is string {
  return !!hopToken && RESUMABLE_STREAM_HOP_STATUSES.has(hopStatus);
}

/** Updates the no-progress reconnect counter after a resumable hop ends. */
function nextNoProgressReconnects(
  noProgressReconnects: number,
  hopStatus: string | undefined,
  hopStartToken: string | undefined,
  hopToken: string | undefined,
): number {
  if (hopStatus === 'requires_continuation') {
    // Clean hop boundary (per-request decode limit reached).
    return 0;
  }
  if (hopToken !== hopStartToken) {
    // Dropped mid-hop after a new checkpoint token was received.
    return 0;
  }
  // Dropped mid-hop before any new checkpoint: retry the hop's own token.
  return noProgressReconnects + 1;
}

/** What was observed during one hop (HTTP request) of a continuation stream. */
interface StreamHop {
  /** The continuation_token and owner id this hop was requested with. */
  startToken: string | undefined;
  startTokenOwnerId: string | undefined;
  /**
   * Seeded with `startToken` so a disconnect before the hop's first checkpoint
   * retries from the hop start.
   */
  token: string | undefined;
  /**
   * The interaction that issued `token`. With store enabled the server only
   * accepts a token together with the interaction that issued it as
   * `previous_interaction_id`, so a retry of the seed token keeps the seed's
   * owner even after this hop's own interaction was created.
   */
  tokenOwnerId: string | undefined;
  /** This hop's own interaction id, once known. */
  interactionId: string | undefined;
  /** Latest status observed during the hop, or undefined if none arrived yet. */
  status: string | undefined;
  /** Whether the HTTP stream was opened (response headers received). */
  streamOpened: boolean;
  /** Whether output events were yielded since the latest checkpoint token. */
  contentSinceCheckpoint: boolean;
}

/** A failed hop, boxed so an `undefined` thrown value is still a failure. */
export interface HopFailure {
  readonly error: unknown;
}

/**
 * State of a streaming `interactions.create()` call with continuation.
 *
 * A stream is made of one or more hops (HTTP requests). Per-hop state lives in
 * a `StreamHop` record replaced wholesale by `startHop()`, so per-hop fields
 * cannot leak across hops. Loop state (the next resume token + owner id, the
 * no-progress reconnect counter, and the pending transport error) persists on
 * `StreamContinuation` across hops.
 */
export class StreamContinuation {
  private nextToken: string | undefined;
  /**
   * The caller's own token: a failure that leaves nothing newer to resume
   * from is not "after progress" and is raised as-is.
   */
  private readonly initialToken: string | undefined;
  /**
   * The interaction that issued `nextToken`; undefined for the caller's own
   * token (the original request is resent as-is).
   */
  private nextTokenOwnerId: string | undefined;
  /** The ids of every hop's interaction, in order (for error reporting). */
  private readonly hopIds: string[] = [];
  private noProgressReconnects = 0;
  /**
   * The latest transport error not followed by progress; raised if the loop
   * gives up so the failure is not hidden by later clean closes.
   */
  private lastError: HopFailure | undefined;
  private hop: StreamHop;

  constructor(
    private readonly options: {
      initialContinuationToken?: string | undefined;
      /** Whether an error raised before the stream opened is a transport error. */
      isConnectionError: (error: unknown) => boolean;
      /**
       * Whether an error must end the stream at once, even where a resume
       * point exists (e.g. the caller aborted the request). The continuation
       * deadline is always fatal.
       */
      isFatalError?: (error: unknown) => boolean;
      /**
       * Whether interactions are stored on the server (`store !== false`).
       * When false, `ContinuationInterruptedError.interactionId` is undefined.
       */
      store?: boolean;
    },
  ) {
    this.nextToken = options.initialContinuationToken;
    this.initialToken = options.initialContinuationToken;
    this.hop = {
      startToken: this.nextToken,
      startTokenOwnerId: undefined,
      token: this.nextToken,
      tokenOwnerId: undefined,
      interactionId: undefined,
      status: undefined,
      streamOpened: false,
      contentSinceCheckpoint: false,
    };
  }

  /** Starts a new hop and returns `[token, tokenOwnerId]` to request. */
  startHop(streamOpened = false): [string | undefined, string | undefined] {
    this.hop = {
      startToken: this.nextToken,
      startTokenOwnerId: this.nextTokenOwnerId,
      token: this.nextToken,
      tokenOwnerId: this.nextTokenOwnerId,
      interactionId: undefined,
      status: undefined,
      streamOpened,
      contentSinceCheckpoint: false,
    };
    return [this.nextToken, this.nextTokenOwnerId];
  }

  /** Marks that the current hop's HTTP stream was opened. */
  markStreamOpened(): void {
    this.hop.streamOpened = true;
  }

  /** Records one streamed SSE event and returns it. */
  observe<T>(event: T): T {
    const hop = this.hop;
    hop.streamOpened = true;
    const interactionId = eventInteractionId(event);
    if (interactionId) {
      hop.interactionId = interactionId;
      if (!this.hopIds.includes(interactionId)) {
        this.hopIds.push(interactionId);
      }
    }
    const previousToken = hop.token;
    [hop.status, hop.token] = extractHopContinuationState(
      event,
      hop.status,
      hop.token,
    );
    if (hop.token && hop.token !== previousToken) {
      hop.tokenOwnerId = hop.interactionId;
    }
    hop.contentSinceCheckpoint = hasContentSinceCheckpoint(
      event,
      hop.contentSinceCheckpoint,
    );
    return event;
  }

  private canResumeHop(): boolean {
    // Resuming from the checkpoint would re-generate (and duplicate) any
    // output yielded since it.
    const hop = this.hop;
    return (
      !hop.contentSinceCheckpoint && canResumeStreamHop(hop.status, hop.token)
    );
  }

  /**
   * The error to throw when the stream gives up with `failure`.
   *
   * If the server issued a resumable token during this call (a completed
   * `requires_continuation` hop, or a mid-hop checkpoint), the work so far is
   * resumable and the error is wrapped in `ContinuationInterruptedError`
   * carrying that token. Otherwise the error is returned as-is.
   */
  private fail(failure: HopFailure): unknown {
    const hop = this.hop;
    const token = canResumeStreamHop(hop.status, hop.token)
      ? hop.token
      : undefined;
    if (!token || token === this.initialToken) {
      return failure.error;
    }
    return new ContinuationInterruptedError({
      message:
        'Automatic continuation of the stream was interrupted: ' +
        `${describeError(failure.error)}. The continuationToken can be used` +
        ' to resume (output yielded after a mid-hop checkpoint is' +
        ' re-generated).',
      cause: failure.error,
      partialInteraction: undefined,
      continuationToken: token,
      interactionId:
        this.options.store !== false ? hop.tokenOwnerId : undefined,
      continuationIds: [...this.hopIds],
    });
  }

  /**
   * Ends the current hop and returns true if another hop should start.
   *
   * Throws the failure (or the pending prior disconnect error) when the
   * stream cannot safely resume or exceeds
   * `MAX_STREAM_RECONNECTS_WITHOUT_PROGRESS`, wrapped in
   * `ContinuationInterruptedError` if a server-issued token to resume from
   * exists (see `fail`).
   */
  endHop(failure?: HopFailure): boolean {
    const hop = this.hop;
    if (
      failure &&
      (failure.error instanceof ContinuationTimeoutError ||
        this.options.isFatalError?.(failure.error))
    ) {
      throw this.fail(failure);
    }
    if (failure && !hop.streamOpened) {
      // Pre-stream HTTP status or validation errors (already retried by the
      // HTTP layer) must propagate immediately; only connection errors resume.
      if (!this.options.isConnectionError(failure.error)) {
        throw this.fail(failure);
      }
    }

    if (!this.canResumeHop()) {
      if (failure) {
        throw this.fail(failure);
      }
      return false;
    }

    if (
      hop.status === 'requires_continuation' &&
      hop.token === hop.startToken
    ) {
      // The hop finished but handed back the token it was started with:
      // resuming would loop forever without progress.
      if (failure) {
        throw this.fail(failure);
      }
      return false;
    }

    this.noProgressReconnects = nextNoProgressReconnects(
      this.noProgressReconnects,
      hop.status,
      hop.startToken,
      hop.token,
    );
    if (this.noProgressReconnects === 0) {
      this.lastError = undefined;
    }
    if (failure) {
      this.lastError = failure;
    }
    if (this.noProgressReconnects > MAX_STREAM_RECONNECTS_WITHOUT_PROGRESS) {
      if (this.lastError) {
        throw this.fail(this.lastError);
      }
      return false;
    }

    this.nextToken = hop.token;
    this.nextTokenOwnerId = hop.tokenOwnerId;
    return true;
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error);
}

async function closeIterator<T>(
  iterator: AsyncIterator<T> | undefined,
): Promise<void> {
  if (!iterator?.return) {
    return;
  }
  try {
    await iterator.return();
  } catch {
    // The hop is being abandoned (it dropped or was superseded); cleanup
    // errors are not actionable.
  }
}

/**
 * Yields the events of a streaming `interactions.create()` call, continuing
 * across hops.
 *
 * Every event of every hop is yielded verbatim (including each hop's
 * `interaction.created` and intermediate `interaction.completed` with status
 * `requires_continuation`). `openNextHop` is called with the token to resume
 * from and the id of the interaction that issued it. `deadline` (if bounded)
 * is checked before each event and before each new hop; once it has passed
 * the stream stops with a `ContinuationTimeoutError` (wrapped in
 * `ContinuationInterruptedError` if resumable).
 */
export async function* continueStream<T>(
  firstHop: AsyncIterable<T>,
  openNextHop: (
    token: string,
    tokenOwnerId: string | undefined,
  ) => Promise<AsyncIterable<T>>,
  options: {
    initialContinuationToken?: string | undefined;
    /** Whether an error raised before a hop's stream opened is a transport error. */
    isConnectionError: (error: unknown) => boolean;
    /** Whether an error ends the stream at once even where a resume point exists. */
    isFatalError?: (error: unknown) => boolean;
    /** Maps errors raised while reading a hop's events (e.g. to the SDK's connection error). */
    wrapIterationError?: (error: unknown) => unknown;
    deadline?: CallDeadline;
    /**
     * Whether interactions are stored on the server (`store !== false`).
     * When false, `ContinuationInterruptedError.interactionId` is undefined.
     */
    store?: boolean;
  },
): AsyncGenerator<T, void, undefined> {
  const deadline = options.deadline ?? new CallDeadline(undefined);
  const wrapIterationError = options.wrapIterationError ?? ((e: unknown) => e);
  const state = new StreamContinuation({
    initialContinuationToken: options.initialContinuationToken,
    isConnectionError: options.isConnectionError,
    isFatalError: options.isFatalError,
    store: options.store,
  });
  let current: AsyncIterator<T> | undefined = undefined;
  let isFirstHop = true;
  try {
    while (true) {
      const [token, tokenOwnerId] = state.startHop(isFirstHop);
      let failure: HopFailure | undefined = undefined;
      if (isFirstHop) {
        isFirstHop = false;
        current = firstHop[Symbol.asyncIterator]();
      } else {
        await closeIterator(current);
        current = undefined;
        try {
          deadline.check();
          const next = await openNextHop(token as string, tokenOwnerId);
          state.markStreamOpened();
          current = next[Symbol.asyncIterator]();
        } catch (e) {
          failure = {error: e};
        }
      }

      if (!failure && current) {
        while (true) {
          let result: IteratorResult<T>;
          try {
            deadline.check();
            result = await current.next();
          } catch (e) {
            failure = {
              error:
                e instanceof ContinuationTimeoutError
                  ? e
                  : wrapIterationError(e),
            };
            break;
          }
          if (result.done) {
            break;
          }
          yield state.observe(result.value);
        }
      }

      if (!state.endHop(failure)) {
        break;
      }
    }
  } finally {
    await closeIterator(current);
  }
}

// ---------------------------------------------------------------------------
// Unary
// ---------------------------------------------------------------------------

function shouldContinueUnary(interaction: unknown): string | undefined {
  if (getValue(interaction, 'status') !== 'requires_continuation') {
    return undefined;
  }
  return nonEmptyString(getValue(interaction, 'continuation_token'));
}

/** The token to continue from after `hop`, or undefined to stop. */
function nextUnaryHopToken(
  hop: unknown,
  sentToken: string | undefined,
): string | undefined {
  const token = shouldContinueUnary(hop);
  if (token === sentToken) {
    // The hop handed back the token it was started with: continuing would
    // loop forever without progress.
    return undefined;
  }
  return token;
}

/** Options shared by the unary loop and merge. */
export interface MergeOptions {
  /**
   * Returns the interaction as a plain object with a `steps` array, or
   * undefined if `value` is not an interaction (then it is returned as-is).
   */
  normalizeInteraction?: (value: unknown) => JsonObject | undefined;
  /** Post-processes the merged interaction (e.g. adds output accessors). */
  finalizeInteraction?: (value: JsonObject) => unknown;
  /**
   * Whether interactions are stored on the server (`store !== false`).
   * When false, `ContinuationInterruptedError.interactionId` is undefined.
   */
  store?: boolean;
}

function defaultNormalizeInteraction(value: unknown): JsonObject | undefined {
  return isObject(value) && Array.isArray(value['steps']) ? value : undefined;
}

function interruptedUnary(
  error: unknown,
  hops: unknown[],
  token: string,
  options: MergeOptions,
): ContinuationInterruptedError {
  const partial = mergeUnaryHops(hops, options);
  const store = options.store !== false && getValue(hops[0], 'store') !== false;
  return new ContinuationInterruptedError({
    message:
      `Automatic continuation was interrupted after ${hops.length} completed` +
      ` hop(s): ${describeError(error)}. The partial interaction (status` +
      " 'requires_continuation') and its continuationToken can be used to" +
      ' resume.',
    cause: error,
    partialInteraction: partial,
    continuationToken: token,
    interactionId: store
      ? nonEmptyString(getValue(hops[hops.length - 1], 'id'))
      : undefined,
    continuationIds: mergeContinuationIds(hops),
  });
}

/**
 * Continues a unary interaction across `requires_continuation` hops.
 *
 * `createNext` is called with the token to resume from and the id of the hop
 * that issued it. A hop that fails after an earlier hop completed throws
 * `ContinuationInterruptedError` (with the failure as `cause`) carrying the
 * hops merged so far and the token to resume from, so the output already
 * produced (and billed) is not lost. Running out of `deadline` before a hop
 * starts is such a failure (`ContinuationTimeoutError`).
 */
export async function continueUnaryInteraction(
  initialResponse: unknown,
  createNext: (
    token: string,
    tokenOwnerId: string | undefined,
  ) => Promise<unknown>,
  options: MergeOptions & {
    initialContinuationToken?: string | undefined;
    deadline?: CallDeadline;
  } = {},
): Promise<unknown> {
  const deadline = options.deadline ?? new CallDeadline(undefined);
  const hops: unknown[] = [initialResponse];
  let sentToken = options.initialContinuationToken;
  for (;;) {
    const token = nextUnaryHopToken(hops[hops.length - 1], sentToken);
    if (!token) {
      return mergeUnaryHops(hops, options);
    }
    let hop: unknown;
    try {
      deadline.check();
      hop = await createNext(
        token,
        nonEmptyString(getValue(hops[hops.length - 1], 'id')),
      );
    } catch (e) {
      throw interruptedUnary(e, hops, token, options);
    }
    hops.push(hop);
    sentToken = token;
  }
}

function stripLeadingUserInputSteps(steps: unknown[]): unknown[] {
  let start = 0;
  while (
    start < steps.length &&
    getValue(steps[start], 'type') === 'user_input'
  ) {
    start++;
  }
  return steps.slice(start);
}

/**
 * The ids of every hop, in order: each hop's server-populated
 * `continuation_ids` (if any) followed by its own id, de-duplicated.
 */
export function mergeContinuationIds(hops: unknown[]): string[] {
  const ids: string[] = [];
  for (const hop of hops) {
    const hopIds = getValue(hop, 'continuation_ids');
    if (Array.isArray(hopIds)) {
      for (const id of hopIds) {
        if (nonEmptyString(id)) {
          ids.push(id);
        }
      }
    }
    const hopId = nonEmptyString(getValue(hop, 'id'));
    if (hopId) {
      ids.push(hopId);
    }
  }
  return Array.from(new Set(ids));
}

/**
 * Merges automatic continuation hops into a single interaction.
 *
 * Each hop is its own interaction on the server, and only contains the output
 * generated during that hop. The merged result is the final hop (so `id`,
 * `status`, etc. refer to it) with the steps of every hop concatenated, usage
 * summed across hops, and `continuation_ids` listing every hop's id. Fields
 * describing the turn's request (`previous_interaction_id`, `created`,
 * `input`) come from the first hop: later hops point back at the hop before
 * them, not at the caller's previous turn.
 */
export function mergeUnaryHops(
  hops: unknown[],
  options: MergeOptions = {},
): unknown {
  const normalize = options.normalizeInteraction ?? defaultNormalizeInteraction;
  const finalize = options.finalizeInteraction ?? ((v: JsonObject) => v);
  const rawFinal = hops[hops.length - 1];
  const final = normalize(rawFinal);
  if (!final) {
    return rawFinal;
  }

  const steps: unknown[] = [];
  hops.forEach((hop, hopIndex) => {
    let hopSteps = getValue(hop, 'steps');
    if (Array.isArray(hopSteps)) {
      if (hopIndex > 0) {
        // Later hops continue the same turn; a repeated user_input step would
        // duplicate the input and cut `output_text` (which stops at the latest
        // user_input step) short.
        hopSteps = stripLeadingUserInputSteps(hopSteps);
      }
      steps.push(...(hopSteps as unknown[]));
    }
  });

  const merged: JsonObject = {
    ...final,
    steps,
    continuation_ids: mergeContinuationIds(hops),
  };
  if (hops.length > 1) {
    for (const name of ['previous_interaction_id', 'created', 'input']) {
      const value = getValue(hops[0], name);
      if (value === undefined) {
        delete merged[name];
      } else {
        merged[name] = value;
      }
    }
  }
  const usage = mergeUsages(
    hops.map((hop) => getValue(hop, 'usage')).filter(isObject),
  );
  if (usage !== undefined) {
    merged['usage'] = usage;
  }
  return finalize(merged);
}

function mergeUsageList(
  lists: unknown[][],
  keyName: string,
  valueName: string,
): unknown[] {
  const merged = new Map<unknown, unknown>();
  for (const items of lists) {
    for (const item of items) {
      const key = getValue(item, keyName);
      const value = getValue(item, valueName);
      const existing = merged.get(key);
      if (existing === undefined) {
        merged.set(key, item);
        continue;
      }
      const prev = getValue(existing, valueName);
      if (isInt(prev) && isInt(value) && isObject(existing)) {
        merged.set(key, {...existing, [valueName]: prev + value});
      }
    }
  }
  return Array.from(merged.values());
}

/** Sums token usage across hops, keeping the first hop's input tokens. */
export function mergeUsages(usages: JsonObject[]): JsonObject | undefined {
  if (usages.length === 0) {
    return undefined;
  }
  const first = usages[0];
  const last = usages[usages.length - 1];
  const names: string[] = [];
  for (const usage of usages) {
    for (const name of Object.keys(usage)) {
      if (!names.includes(name)) {
        names.push(name);
      }
    }
  }

  const updates: JsonObject = {};
  for (const name of names) {
    if (name === 'initial_input_tokens') {
      continue;
    }
    const present = usages.map((u) => u[name]).filter((v) => !isUnset(v));
    if (present.length === 0) {
      continue;
    }
    if (present.every(isInt)) {
      updates[name] = present.reduce((sum, v) => sum + v, 0);
    } else if (
      name in USAGE_LIST_KEYS &&
      present.every((v): v is unknown[] => Array.isArray(v))
    ) {
      const [keyName, valueName] = USAGE_LIST_KEYS[name];
      updates[name] = mergeUsageList(present, keyName, valueName);
    }
  }

  const initialInputTokens = !isUnset(first['initial_input_tokens'])
    ? first['initial_input_tokens']
    : first['total_input_tokens'];
  const result: JsonObject = {...last, ...updates};
  if (!isUnset(initialInputTokens)) {
    result['initial_input_tokens'] = initialInputTokens;
  } else {
    delete result['initial_input_tokens'];
  }

  return result;
}
