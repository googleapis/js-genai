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
