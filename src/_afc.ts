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
 */
export function isResumableFinishReason(
  finishReason: types.FinishReason | undefined,
): boolean {
  return finishReason === types.FinishReason.CONTINUATION;
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
        fieldName === 'usageMetadata',
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
