/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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
): boolean {
  return (
    enableContinuation &&
    Boolean(continuationToken) &&
    isResumableFinishReason(finishReason)
  );
}

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
    return prevCandidates;
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

function addOptionalNumbers(
  a: number | undefined,
  b: number | undefined,
): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a + b;
}

function extractBillableUsage(
  usage: types.GenerateContentResponseUsageMetadata,
): types.BillableUsage {
  if (usage.billableUsage) {
    return usage.billableUsage;
  }
  const billable: types.BillableUsage = {};
  if (usage.promptTokenCount !== undefined) {
    billable.promptTokenCount = usage.promptTokenCount;
  }
  if (usage.cachedContentTokenCount !== undefined) {
    billable.cachedContentTokenCount = usage.cachedContentTokenCount;
  }
  if (usage.candidatesTokenCount !== undefined) {
    billable.candidatesTokenCount = usage.candidatesTokenCount;
  }
  if (usage.thoughtsTokenCount !== undefined) {
    billable.thoughtsTokenCount = usage.thoughtsTokenCount;
  }
  if (usage.toolUsePromptTokenCount !== undefined) {
    billable.toolUsePromptTokenCount = usage.toolUsePromptTokenCount;
  }
  if (usage.totalTokenCount !== undefined) {
    billable.totalTokenCount = usage.totalTokenCount;
  }
  return billable;
}

/**
 * Merges usageMetadata across continuation hops by preserving initial prompt
 * context window usage on top-level fields and accumulating total billed token
 * counts in billableUsage.
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
  const prevBillable = extractBillableUsage(prev);
  const currBillable = extractBillableUsage(curr);
  const merged = mergeResponseObjects(
    prev as unknown as Record<string, unknown>,
    curr as unknown as Record<string, unknown>,
    false,
    true,
  ) as unknown as types.GenerateContentResponseUsageMetadata;

  // Preserve initial prompt context fields from the first hop that reported them.
  const preservedPrompt = prev.promptTokenCount ?? curr.promptTokenCount;
  if (preservedPrompt !== undefined) {
    merged.promptTokenCount = preservedPrompt;
  }
  const preservedCached =
    prev.cachedContentTokenCount ?? curr.cachedContentTokenCount;
  if (preservedCached !== undefined) {
    merged.cachedContentTokenCount = preservedCached;
  }
  const preservedPromptDetails =
    prev.promptTokensDetails && prev.promptTokensDetails.length > 0
      ? prev.promptTokensDetails
      : curr.promptTokensDetails;
  if (preservedPromptDetails !== undefined) {
    merged.promptTokensDetails = preservedPromptDetails.map((d) => ({...d}));
  }
  const preservedCacheDetails =
    prev.cacheTokensDetails && prev.cacheTokensDetails.length > 0
      ? prev.cacheTokensDetails
      : curr.cacheTokensDetails;
  if (preservedCacheDetails !== undefined) {
    merged.cacheTokensDetails = preservedCacheDetails.map((d) => ({...d}));
  }

  // Recompute context-window totalTokenCount from preserved initial prompt + accumulated output/thought/tool tokens.
  if (
    merged.promptTokenCount !== undefined ||
    merged.candidatesTokenCount !== undefined ||
    merged.thoughtsTokenCount !== undefined ||
    merged.toolUsePromptTokenCount !== undefined ||
    prev.totalTokenCount !== undefined ||
    curr.totalTokenCount !== undefined
  ) {
    merged.totalTokenCount =
      (merged.promptTokenCount ?? 0) +
      (merged.candidatesTokenCount ?? 0) +
      (merged.thoughtsTokenCount ?? 0) +
      (merged.toolUsePromptTokenCount ?? 0);
  }

  const billableUsage: types.BillableUsage = {};
  const bPrompt = addOptionalNumbers(
    prevBillable.promptTokenCount,
    currBillable.promptTokenCount,
  );
  if (bPrompt !== undefined) billableUsage.promptTokenCount = bPrompt;
  const bCached = addOptionalNumbers(
    prevBillable.cachedContentTokenCount,
    currBillable.cachedContentTokenCount,
  );
  if (bCached !== undefined) billableUsage.cachedContentTokenCount = bCached;
  const bCandidates = addOptionalNumbers(
    prevBillable.candidatesTokenCount,
    currBillable.candidatesTokenCount,
  );
  if (bCandidates !== undefined) {
    billableUsage.candidatesTokenCount = bCandidates;
  }
  const bThoughts = addOptionalNumbers(
    prevBillable.thoughtsTokenCount,
    currBillable.thoughtsTokenCount,
  );
  if (bThoughts !== undefined) billableUsage.thoughtsTokenCount = bThoughts;
  const bToolUse = addOptionalNumbers(
    prevBillable.toolUsePromptTokenCount,
    currBillable.toolUsePromptTokenCount,
  );
  if (bToolUse !== undefined) {
    billableUsage.toolUsePromptTokenCount = bToolUse;
  }
  const bTotal = addOptionalNumbers(
    prevBillable.totalTokenCount,
    currBillable.totalTokenCount,
  );
  if (bTotal !== undefined) billableUsage.totalTokenCount = bTotal;
  merged.billableUsage = billableUsage;

  return attachInitialPromptTokenCount(merged, initialPrompt);
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
      if (fieldName === 'candidates') {
        mergedData[fieldName] = mergeCandidates(
          prevVal as types.Candidate[],
          currVal as types.Candidate[],
        );
      } else if (
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
