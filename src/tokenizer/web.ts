/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Public API for LocalTokenizer (Web/Browser).
 *
 * ⚠️ NOT YET IMPLEMENTED ⚠️
 *
 * Web tokenizer support is planned but not yet available. The implementation requires:
 * - IndexedDB for caching tokenizer models
 * - SubtleCrypto API for SHA-256/SHA-1 hashing
 * - Fetch API for downloading models
 *
 * See LOCAL_TOKENIZER_DESIGN.md for implementation details and re-enablement steps.
 *
 * @experimental This API is experimental and may change in future versions.
 */

// Web tokenizer exports are disabled until the platform implementation is complete.
// Uncomment these exports when WebTokenizerPlatform is fully implemented:
//
// export {LocalTokenizer} from '../web/local_tokenizer.js';
//
// export type {
//   ComputeTokensResult,
//   CountTokensResult,
//   TokensInfo,
// } from '../types.js';
