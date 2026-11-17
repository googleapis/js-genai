/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const LIVE_INTERACTIONS_EXPERIMENTAL_WARNING =
  'GoogleGenAI.interactions: Live Interactions usage (interactions.connect and interactions.authTokens) is experimental and may change in future versions.';

let liveInteractionsExperimentalWarned = false;

/**
 * Emits a one-time-per-process warning when a Live Interactions entry point is used.
 */
export function warnLiveInteractionsExperimental(): void {
  if (!liveInteractionsExperimentalWarned) {
    liveInteractionsExperimentalWarned = true;
    console.warn(LIVE_INTERACTIONS_EXPERIMENTAL_WARNING);
  }
}

/** Resets the one-time experimental warning; for tests only. */
export function resetLiveInteractionsExperimentalWarningForTesting(): void {
  liveInteractionsExperimentalWarned = false;
}
