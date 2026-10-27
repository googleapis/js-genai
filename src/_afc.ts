/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiError} from './errors.js';
import * as types from './types.js';

export const DEFAULT_MAX_REMOTE_CALLS = 10;

/** Returns whether automatic function calling is disabled. */
export function shouldDisableAfc(
  config: types.GenerateContentConfig | undefined,
): boolean {
  if (config?.automaticFunctionCalling?.disable) {
    return true;
  }

  let callableToolsPresent = false;
  for (const tool of config?.tools ?? []) {
    if (isCallableTool(tool)) {
      callableToolsPresent = true;
      break;
    }
  }
  if (!callableToolsPresent) {
    return true;
  }

  const maxCalls = config?.automaticFunctionCalling?.maximumRemoteCalls;
  if (
    (maxCalls && (maxCalls < 0 || !Number.isInteger(maxCalls))) ||
    maxCalls == 0
  ) {
    console.warn(
      'Invalid maximumRemoteCalls value provided for automatic function calling. Disabled automatic function calling. Please provide a valid integer value greater than 0. maximumRemoteCalls provided:',
      maxCalls,
    );
    return true;
  }
  return false;
}

export function isCallableTool(tool: types.ToolUnion): boolean {
  return 'callTool' in tool && typeof tool.callTool === 'function';
}

// Checks whether the list of tools contains any CallableTools. Will return true
// if there is at least one CallableTool.
export function hasCallableTools(
  params: types.GenerateContentParameters,
): boolean {
  return params.config?.tools?.some((tool) => isCallableTool(tool)) ?? false;
}

/**
 * Returns the indexes of the tools that are not compatible with AFC.
 */
export function findAfcIncompatibleToolIndexes(
  params?: types.GenerateContentParameters,
): number[] {
  // Use number[] for an array of numbers in TypeScript
  const afcIncompatibleToolIndexes: number[] = [];
  if (!params?.config?.tools) {
    return afcIncompatibleToolIndexes;
  }
  params.config.tools.forEach((tool, index) => {
    if (isCallableTool(tool)) {
      return;
    }
    const geminiTool = tool as types.Tool;
    if (
      geminiTool.functionDeclarations &&
      geminiTool.functionDeclarations.length > 0
    ) {
      afcIncompatibleToolIndexes.push(index);
    }
  });

  return afcIncompatibleToolIndexes;
}

/**
 * Returns whether to append automatic function calling history to the
 * response.
 */
export function shouldAppendAfcHistory(
  config: types.GenerateContentConfig | undefined,
): boolean {
  return !config?.automaticFunctionCalling?.ignoreCallHistory;
}

/**
 * Returns whether automatic continuation token resumption is enabled.
 */
export function shouldEnableAutomaticContinuation(
  config: types.GenerateContentConfig | undefined,
  defaultEnabled = true,
): boolean {
  if (!config) {
    return defaultEnabled;
  }
  if (
    config.automaticContinuation === undefined ||
    config.automaticContinuation === null
  ) {
    return defaultEnabled;
  }
  return Boolean(config.automaticContinuation);
}

/**
 * Returns true if finishReason is eligible for automatic continuation.
 *
 * Per the continuation protocol, when a continuationToken is present the
 * backend only sets finishReason to undefined (intermediate checkpoint chunk)
 * or FinishReason.CONTINUATION (stream end).
 */
export function isResumableFinishReason(
  finishReason: types.FinishReason | undefined,
): boolean {
  return (
    finishReason === undefined ||
    finishReason === types.FinishReason.CONTINUATION
  );
}

/**
 * Returns true if a streaming hop should resume with the next request.
 */
export function canResumeStream(
  enableContinuation: boolean,
  continuationToken: string | undefined,
  finishReason: types.FinishReason | undefined,
  hasPromptFeedback = false,
): boolean {
  return (
    enableContinuation &&
    !hasPromptFeedback &&
    Boolean(continuationToken) &&
    isResumableFinishReason(finishReason)
  );
}

/**
 * Maximum number of consecutive streaming reconnects that do not receive a new
 * checkpoint continuationToken before stopping or surfacing the error.
 */
export const MAX_STREAM_RECONNECTS_WITHOUT_PROGRESS = 3;

/**
 * Clears finishReason on intermediate streaming continuation chunks.
 */
export function clearIntermediateFinishReason(
  chunk: types.GenerateContentResponse,
  enableContinuation: boolean,
  continuationToken: string | undefined,
): void {
  const firstCandidate = chunk.candidates?.[0];
  if (
    firstCandidate?.finishReason !== undefined &&
    canResumeStream(
      enableContinuation,
      continuationToken,
      firstCandidate.finishReason,
    )
  ) {
    firstCandidate.finishReason = undefined;
  }
}

/**
 * Returns true if a mid-stream error was caused by the caller aborting the
 * request (aborted abortSignal or an AbortError).
 */
function isStreamAborted(
  err: unknown,
  config: types.GenerateContentConfig | undefined,
): boolean {
  return (
    Boolean(config?.abortSignal?.aborted) ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

/**
 * What was observed during one hop (HTTP request) of a continuation stream.
 */
interface StreamHop {
  /**
   * The continuationToken the hop was requested with (undefined for the
   * initial request).
   */
  readonly startToken: string | undefined;
  /** The latest checkpoint continuationToken received during the hop. */
  token?: string;
  /**
   * The finishReason received during the hop, or undefined if the stream ended
   * (or failed) without one.
   */
  finishReason?: types.FinishReason;
  /** Whether any chunk in this hop carried promptFeedback (terminal). */
  hasPromptFeedback: boolean;
  /** Whether this hop has yielded candidate content parts. */
  hasYieldedContent: boolean;
  /** Whether this hop has received any chunk at all. */
  receivedAnyChunk: boolean;
  /**
   * Usage for the whole stream so far: the usage of all previous hops plus this
   * hop's latest usageMetadata. Within a hop, each chunk's usageMetadata is the
   * server's running total for the hop, so it replaces the previous value (it
   * is not summed); a chunk without usageMetadata leaves it unchanged.
   */
  usage?: types.GenerateContentResponseUsageMetadata;
}

/**
 * State of a generateContentStream call with automatic continuation.
 *
 * A stream is made of one or more hops (HTTP requests). Each hop after the
 * first resumes from a continuationToken. The caller drives the loop:
 *
 * ```ts
 * const state = new StreamContinuation(config);
 * while (true) {
 *   const callConfig = state.startHop();
 *   let hopError: {error: unknown} | undefined = undefined;
 *   try {
 *     for await (const chunk of <stream request with callConfig>) {
 *       yield state.observe(chunk);
 *     }
 *   } catch (error) {
 *     hopError = {error};
 *   }
 *   if (!state.endHop(hopError)) return;
 * }
 * ```
 *
 * Per-hop state lives in a private `StreamHop` record that is replaced by
 * `startHop()`, so it is always reset between hops. Loop state (usage
 * accumulated across hops, the token to resume from, the reconnect count, and
 * the latest error since the stream last made progress) carries across hops.
 *
 * Usage metadata: within a hop, each chunk's usageMetadata is the server's
 * running total for that hop, so the latest one is the hop's usage (chunks are
 * not summed). Across hops, the hops' usage is summed, since each hop is a
 * separate request. Each yielded chunk that has usageMetadata carries the
 * usage of all previous hops plus its own.
 *
 * Errors are handled as follows (see `endHop`):
 *
 * - An `ApiError` (from an HTTP error status or an error event in the stream)
 *   raised before the hop received any chunk means the request was rejected.
 *   It is thrown immediately, without a continuation retry: retrying a
 *   rejected request (with backoff) is left to the HTTP client's
 *   `httpOptions.retryOptions`.
 * - Other errors (transport drops, network errors) and clean closes without a
 *   finishReason are retried as described in `endHop`. The latest error since
 *   the stream last made progress is kept, and thrown if the stream gives up,
 *   so a drop followed by clean empty closes is not silently lost.
 */
export class StreamContinuation {
  /** Whether automatic continuation is enabled for this call. */
  readonly enableContinuation: boolean;
  /**
   * Usage of all finished hops, summed. Each hop is a separate request whose
   * usage the server reports independently, so hop totals are added (unlike
   * chunks within a hop; see `StreamHop.usage`).
   */
  private accumulatedUsageAcrossHops?: types.GenerateContentResponseUsageMetadata;
  /** Token the next hop resumes from (undefined for the initial request). */
  private resumeToken?: string;
  /** Number of consecutive hops that ended without a new continuationToken. */
  private reconnectsWithoutProgress = 0;
  /**
   * The latest hop error since the stream last made progress (a new
   * checkpoint token or yielded content), wrapped so that a thrown `undefined`
   * is still an error.
   */
  private lastError?: {error: unknown};
  private hop: StreamHop = newStreamHop(undefined);

  constructor(
    private readonly config: types.GenerateContentConfig | undefined,
  ) {
    this.enableContinuation = shouldEnableAutomaticContinuation(config, true);
  }

  /** Starts a new hop and returns the config to request it with. */
  startHop(): types.GenerateContentConfig | undefined {
    this.hop = newStreamHop(this.resumeToken);
    return prepareContinuationConfig(this.config, this.resumeToken);
  }

  /**
   * Records one streamed chunk and returns the chunk to yield.
   *
   * The returned chunk has its usageMetadata (if any) set to this hop's latest
   * usage plus the usage of all previous hops (or initialPromptTokenCount
   * attached on the first hop) and its intermediate finishReason cleared when
   * the stream will auto-continue.
   */
  observe(chunk: types.GenerateContentResponse): types.GenerateContentResponse {
    const hop = this.hop;
    hop.receivedAnyChunk = true;
    if (chunk.promptFeedback !== undefined && chunk.promptFeedback !== null) {
      hop.hasPromptFeedback = true;
    }
    if (chunk.usageMetadata) {
      if (this.accumulatedUsageAcrossHops) {
        const mergedUsage = mergeUsageMetadata(
          this.accumulatedUsageAcrossHops,
          chunk.usageMetadata,
        );
        chunk = Object.assign(new types.GenerateContentResponse(), chunk, {
          usageMetadata: mergedUsage,
        });
        hop.usage = mergedUsage;
      } else {
        attachInitialPromptTokenCount(chunk.usageMetadata);
        hop.usage = chunk.usageMetadata;
      }
    }
    const firstCandidate = chunk.candidates?.[0];
    if (firstCandidate) {
      if (
        firstCandidate.content?.parts &&
        firstCandidate.content.parts.length > 0
      ) {
        hop.hasYieldedContent = true;
      }
      if (firstCandidate.finishReason !== undefined) {
        hop.finishReason = firstCandidate.finishReason;
      }
      if (firstCandidate.continuationToken) {
        hop.token = firstCandidate.continuationToken;
      } else if (
        firstCandidate.finishReason !== undefined &&
        !isResumableFinishReason(firstCandidate.finishReason)
      ) {
        hop.token = undefined;
      }
      clearIntermediateFinishReason(chunk, this.enableContinuation, hop.token);
    }
    return chunk;
  }

  /**
   * Ends the current hop. Returns true if another hop should be started.
   *
   * If the stream fails or ends without a terminal finishReason, the next hop
   * resumes from the latest checkpoint token. If the hop failed before
   * emitting a checkpoint of its own and before yielding content, it is
   * retried from the token it started with.
   *
   * An `ApiError` thrown before the hop received any chunk (the request was
   * rejected, e.g. with an HTTP error status) is rethrown immediately without
   * a continuation retry; retrying it is left to `httpOptions.retryOptions`.
   *
   * If the stream gives up (the hop ended without a finishReason or
   * promptFeedback and can't be resumed), the latest error since the stream
   * last made progress is thrown, even if the final hop closed cleanly.
   *
   * @param hopError - Wraps the error thrown while opening or consuming the
   *     hop's stream, if any (wrapped so that a thrown `undefined` is still an
   *     error).
   * @throws The wrapped error, if the caller aborted the request, the request
   *     was rejected, or the stream can't be resumed; or the latest error since
   *     the stream last made progress, if the stream gives up.
   */
  endHop(hopError?: {error: unknown}): boolean {
    const hop = this.hop;
    if (hop.usage) {
      this.accumulatedUsageAcrossHops = hop.usage;
    }
    if (
      hopError &&
      (isStreamAborted(hopError.error, this.config) ||
        (hopError.error instanceof ApiError && !hop.receivedAnyChunk))
    ) {
      throw hopError.error;
    }
    const madeProgress =
      hop.hasYieldedContent ||
      (Boolean(hop.token) && hop.token !== hop.startToken);
    if (hopError) {
      this.lastError = hopError;
    } else if (madeProgress) {
      this.lastError = undefined;
    }
    [this.resumeToken, this.reconnectsWithoutProgress] = this.nextResumeToken();
    const canResume = canResumeStream(
      this.enableContinuation,
      this.resumeToken,
      hop.finishReason,
      hop.hasPromptFeedback,
    );
    if (canResume) {
      return true;
    }
    if (hopError) {
      throw hopError.error;
    }
    // Never surface a stale error when the API ended the hop itself.
    const gaveUp = hop.finishReason === undefined && !hop.hasPromptFeedback;
    if (gaveUp && this.lastError) {
      throw this.lastError.error;
    }
    return false;
  }

  /**
   * Returns [token to resume from or undefined to stop, updated reconnect
   * count].
   *
   * Long-decode checkpoints are only emitted partway through each hop, so a
   * connection can drop before the hop has produced a checkpoint of its own.
   * In that case, if no candidate content has been yielded yet, the hop can be
   * retried from the token it was started with.
   */
  private nextResumeToken(): [string | undefined, number] {
    const hop = this.hop;
    const reconnects = this.reconnectsWithoutProgress;
    if (hop.finishReason !== undefined || hop.hasPromptFeedback) {
      if (
        hop.finishReason === types.FinishReason.CONTINUATION &&
        !hop.hasPromptFeedback &&
        hop.token &&
        hop.token !== hop.startToken
      ) {
        return [hop.token, 0];
      }
      // The server ended the hop without a new token (or returned
      // promptFeedback); replaying the same token would only repeat the hop.
      return [undefined, 0];
    }
    if (hop.token && hop.token !== hop.startToken) {
      return [hop.token, 0];
    }
    if (
      hop.hasYieldedContent ||
      reconnects >= MAX_STREAM_RECONNECTS_WITHOUT_PROGRESS
    ) {
      return [undefined, reconnects];
    }
    return [hop.startToken, reconnects + 1];
  }
}

function newStreamHop(startToken: string | undefined): StreamHop {
  return {
    startToken,
    hasPromptFeedback: false,
    hasYieldedContent: false,
    receivedAnyChunk: false,
  };
}

/**
 * Returns continuationToken if generation should auto-resume, else undefined.
 */
export function shouldContinueGeneration(
  response: types.GenerateContentResponse | undefined,
): string | undefined {
  const candidate = response?.candidates?.[0];
  if (!candidate?.continuationToken) {
    return undefined;
  }
  if (isResumableFinishReason(candidate.finishReason)) {
    return candidate.continuationToken;
  }
  return undefined;
}

/**
 * Returns a shallow copy of baseConfig with continuationToken set.
 */
export function prepareContinuationConfig(
  baseConfig: types.GenerateContentConfig | undefined,
  continuationToken: string | undefined,
  clearAutomaticContinuation = false,
): types.GenerateContentConfig | undefined {
  const hasAutoCont =
    baseConfig?.automaticContinuation !== undefined &&
    baseConfig?.automaticContinuation !== null;
  const needClearAutoCont = clearAutomaticContinuation && hasAutoCont;
  if (!continuationToken && !needClearAutoCont) {
    return baseConfig;
  }
  if (!baseConfig) {
    return continuationToken ? {continuationToken} : undefined;
  }
  const copied: types.GenerateContentConfig = {...baseConfig};
  if (continuationToken) {
    copied.continuationToken = continuationToken;
  }
  if (needClearAutoCont) {
    delete copied.automaticContinuation;
  }
  return copied;
}

/**
 * Sums tokenCount per modality across two lists of ModalityTokenCount.
 */
export function mergeModalityTokenCounts(
  prevList: types.ModalityTokenCount[],
  currList: types.ModalityTokenCount[],
): types.ModalityTokenCount[] {
  const countsByModality = new Map<types.MediaModality | undefined, number>();
  const order: Array<types.MediaModality | undefined> = [];
  for (const item of [...prevList, ...currList]) {
    const modality = item.modality;
    if (!countsByModality.has(modality)) {
      countsByModality.set(modality, 0);
      order.push(modality);
    }
    countsByModality.set(
      modality,
      (countsByModality.get(modality) ?? 0) + (item.tokenCount ?? 0),
    );
  }
  return order.map((modality) => ({
    modality,
    tokenCount: countsByModality.get(modality) ?? 0,
  }));
}

/**
 * Deduplicates safety ratings by category, keeping the latest hop's rating.
 */
export function mergeSafetyRatings(
  prevList: types.SafetyRating[],
  currList: types.SafetyRating[],
): types.SafetyRating[] {
  const byCategory = new Map<
    types.HarmCategory | undefined,
    types.SafetyRating
  >();
  const order: Array<types.HarmCategory | undefined> = [];
  for (const rating of [...prevList, ...currList]) {
    const category = rating.category;
    if (!byCategory.has(category)) {
      order.push(category);
    }
    byCategory.set(category, rating);
  }
  return order.map((cat) => byCategory.get(cat)!);
}

function isMergeableObject(val: unknown): val is Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    return false;
  }
  if (val instanceof types.HttpResponse) {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return (
    proto === null ||
    proto === Object.prototype ||
    val instanceof types.GenerateContentResponse ||
    val instanceof types.GenerateContentResponsePromptFeedback ||
    val instanceof types.GenerateContentResponseUsageMetadata
  );
}

function isModalityTokenCountArray(
  fieldName: string,
  arr: unknown[],
): arr is types.ModalityTokenCount[] {
  if (fieldName.endsWith('TokensDetails')) {
    return true;
  }
  return (
    arr.length > 0 &&
    typeof arr[0] === 'object' &&
    arr[0] !== null &&
    'modality' in arr[0]
  );
}

/**
 * Merges candidate lists element-wise across continuation hops.
 */
export function mergeCandidates(
  prevCandidates: types.Candidate[],
  currCandidates: types.Candidate[],
): types.Candidate[] {
  if (prevCandidates.length === 0) {
    return currCandidates;
  }
  if (currCandidates.length === 0) {
    return prevCandidates.map(
      (prevCandidate) =>
        mergeResponseObjects(
          prevCandidate as unknown as Record<string, unknown>,
          {},
          true,
          false,
        ) as unknown as types.Candidate,
    );
  }
  const merged: types.Candidate[] = [];
  const minLen = Math.min(prevCandidates.length, currCandidates.length);
  for (let i = 0; i < minLen; i++) {
    merged.push(
      mergeResponseObjects(
        prevCandidates[i] as unknown as Record<string, unknown>,
        currCandidates[i] as unknown as Record<string, unknown>,
        true,
        false,
      ) as unknown as types.Candidate,
    );
  }
  if (prevCandidates.length > minLen) {
    merged.push(...prevCandidates.slice(minLen));
  }
  if (currCandidates.length > minLen) {
    merged.push(...currCandidates.slice(minLen));
  }
  return merged;
}

interface UsageWithInitialPrompt
  extends types.GenerateContentResponseUsageMetadata {
  _initialPromptTokenCount?: number;
}

/**
 * Returns the prompt token count from the initial request prior to any
 * continuation hops.
 */
export function getInitialPromptTokenCount(
  usage?: types.GenerateContentResponseUsageMetadata,
): number | undefined {
  if (!usage) {
    return undefined;
  }
  return (
    (usage as UsageWithInitialPrompt)._initialPromptTokenCount ??
    usage.promptTokenCount
  );
}

/**
 * Attaches a non-enumerable _initialPromptTokenCount property and
 * initialPromptTokenCount getter to a usageMetadata object.
 */
export function attachInitialPromptTokenCount(
  usage: types.GenerateContentResponseUsageMetadata,
  initialPromptTokenCount?: number,
): types.GenerateContentResponseUsageMetadata {
  const resolved = initialPromptTokenCount ?? getInitialPromptTokenCount(usage);
  if (resolved !== undefined) {
    Object.defineProperty(usage, '_initialPromptTokenCount', {
      value: resolved,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  if (
    !(usage instanceof types.GenerateContentResponseUsageMetadata) &&
    !Object.prototype.hasOwnProperty.call(usage, 'initialPromptTokenCount')
  ) {
    Object.defineProperty(usage, 'initialPromptTokenCount', {
      get(this: types.GenerateContentResponseUsageMetadata) {
        return getInitialPromptTokenCount(this);
      },
      enumerable: false,
      configurable: true,
    });
  }
  return usage;
}

/**
 * Merges usageMetadata across continuation hops by summing billed token counts
 * while preserving the initial hop's promptTokenCount in
 * initialPromptTokenCount.
 */
export function mergeUsageMetadata(
  prev: types.GenerateContentResponseUsageMetadata | undefined,
  curr: types.GenerateContentResponseUsageMetadata | undefined,
): types.GenerateContentResponseUsageMetadata | undefined {
  if (!curr) {
    return prev ? attachInitialPromptTokenCount(prev) : prev;
  }
  if (!prev) {
    return attachInitialPromptTokenCount(curr);
  }
  const initialPrompt =
    getInitialPromptTokenCount(prev) ?? getInitialPromptTokenCount(curr);
  const merged = mergeResponseObjects(
    prev as unknown as Record<string, unknown>,
    curr as unknown as Record<string, unknown>,
    false,
    true,
  ) as unknown as types.GenerateContentResponseUsageMetadata;
  return attachInitialPromptTokenCount(merged, initialPrompt);
}

/**
 * Shifts curr's GroundingSupport chunk and part indices by prev's lengths
 * without mutating curr.
 */
function shiftCandidateGroundingSupports(
  prev: Record<string, unknown>,
  curr: Record<string, unknown>,
): Record<string, unknown> {
  const currGm = curr['groundingMetadata'] as
    | types.GroundingMetadata
    | undefined;
  const currSupports = currGm?.groundingSupports;
  if (!Array.isArray(currSupports) || currSupports.length === 0) {
    return curr;
  }

  const prevContent = prev['content'] as types.Content | undefined;
  const partOffset = Array.isArray(prevContent?.parts)
    ? prevContent!.parts!.length
    : 0;
  const prevGm = prev['groundingMetadata'] as
    | types.GroundingMetadata
    | undefined;
  const chunkOffset = Array.isArray(prevGm?.groundingChunks)
    ? prevGm!.groundingChunks!.length
    : 0;

  if (partOffset === 0 && chunkOffset === 0) {
    return curr;
  }

  const shiftedSupports = currSupports.map((support) => {
    if (!support || typeof support !== 'object') {
      return support;
    }
    const nextSupport: types.GroundingSupport = {...support};
    if (
      chunkOffset > 0 &&
      Array.isArray(support.groundingChunkIndices) &&
      support.groundingChunkIndices.length > 0
    ) {
      nextSupport.groundingChunkIndices = support.groundingChunkIndices.map(
        (idx) => idx + chunkOffset,
      );
    }
    if (
      partOffset > 0 &&
      support.segment &&
      typeof support.segment === 'object'
    ) {
      nextSupport.segment = {
        ...support.segment,
        partIndex: (support.segment.partIndex ?? 0) + partOffset,
      };
    }
    return nextSupport;
  });

  return {
    ...curr,
    groundingMetadata: {
      ...currGm,
      groundingSupports: shiftedSupports,
    },
  };
}

/**
 * Recursively merges two response/metadata objects across continuation hops.
 */
export function mergeResponseObjects(
  prev: Record<string, unknown>,
  curr: Record<string, unknown>,
  isCandidate = false,
  isUsageMetadata = false,
): Record<string, unknown> {
  if (isCandidate) {
    curr = shiftCandidateGroundingSupports(prev, curr);
  }
  const mergedData: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

  for (const fieldName of keys) {
    const prevVal = prev[fieldName];
    const currVal = curr[fieldName];

    if (
      isCandidate &&
      (fieldName === 'continuationToken' ||
        fieldName === 'finishReason' ||
        fieldName === 'finishMessage')
    ) {
      if (currVal !== undefined) {
        mergedData[fieldName] = currVal;
      }
      continue;
    }

    // Route candidates through mergeCandidates even when curr.candidates is
    // undefined/null so preserved candidates clear terminal continuation state.
    if (
      !isCandidate &&
      !isUsageMetadata &&
      fieldName === 'candidates' &&
      Array.isArray(prevVal)
    ) {
      mergedData[fieldName] = mergeCandidates(
        prevVal as types.Candidate[],
        (Array.isArray(currVal) ? currVal : []) as types.Candidate[],
      );
      continue;
    }

    if (fieldName === 'usageMetadata') {
      const mergedUsage = mergeUsageMetadata(
        prevVal as types.GenerateContentResponseUsageMetadata | undefined,
        currVal as types.GenerateContentResponseUsageMetadata | undefined,
      );
      if (mergedUsage !== undefined) {
        mergedData[fieldName] = mergedUsage;
      }
      continue;
    }

    if (currVal === undefined || currVal === null) {
      if (prevVal !== undefined) {
        mergedData[fieldName] = prevVal;
      }
    } else if (prevVal === undefined || prevVal === null) {
      mergedData[fieldName] = currVal;
    } else if (
      typeof prevVal === 'number' &&
      typeof currVal === 'number' &&
      (isUsageMetadata ||
        fieldName === 'tokenCount' ||
        fieldName.endsWith('TokenCount') ||
        fieldName.endsWith('Count') ||
        fieldName.endsWith('Sum'))
    ) {
      mergedData[fieldName] = prevVal + currVal;
    } else if (Array.isArray(prevVal) && Array.isArray(currVal)) {
      if (
        isModalityTokenCountArray(fieldName, prevVal) ||
        isModalityTokenCountArray(fieldName, currVal)
      ) {
        mergedData[fieldName] = mergeModalityTokenCounts(
          prevVal as types.ModalityTokenCount[],
          currVal as types.ModalityTokenCount[],
        );
      } else if (fieldName === 'safetyRatings') {
        mergedData[fieldName] = mergeSafetyRatings(
          prevVal as types.SafetyRating[],
          currVal as types.SafetyRating[],
        );
      } else {
        mergedData[fieldName] = [...prevVal, ...currVal];
      }
    } else if (isMergeableObject(prevVal) && isMergeableObject(currVal)) {
      mergedData[fieldName] = mergeResponseObjects(
        prevVal,
        currVal,
        false,
        fieldName === 'usageMetadata' || isUsageMetadata,
      );
    } else {
      mergedData[fieldName] = currVal;
    }
  }

  return mergedData;
}

/**
 * Merges a list of GenerateContentResponses from continuation hops.
 */
export function mergeContinuationResponses(
  responses: types.GenerateContentResponse[],
): types.GenerateContentResponse {
  if (responses.length === 0) {
    return new types.GenerateContentResponse();
  }
  if (responses.length === 1) {
    if (responses[0].usageMetadata) {
      attachInitialPromptTokenCount(responses[0].usageMetadata);
    }
    return responses[0];
  }

  let mergedRecord = responses[0] as unknown as Record<string, unknown>;
  for (let i = 1; i < responses.length; i++) {
    mergedRecord = mergeResponseObjects(
      mergedRecord,
      responses[i] as unknown as Record<string, unknown>,
      false,
      false,
    );
  }

  const mergedResponse = new types.GenerateContentResponse();
  Object.assign(mergedResponse, mergedRecord);
  return mergedResponse;
}
