/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @packageDocumentation
 * Internal APIs for Vertex libraries
 * @experimental
 *
 * **WARNING: INTERNAL API - DO NOT USE DIRECTLY**
 *
 * This module is intended for internal use by Vertex libraries only.
 * It is not part of the public API and may change without following semantic
 * versioning.
 *
 * Authorized Vertex libraries:
 * - @google/vertexai
 *
 * If you are not developing one of these libraries, use the public API instead.
 */
export {ApiClient, type ApiClientInitOptions, type HttpRequest,} from '../_api_client.js';
export {type Auth} from '../_auth.js';
export {type Downloader} from '../_downloader.js';
export {type Uploader} from '../_uploader.js';
export {NodeAuth, type NodeAuthOptions} from '../node/_node_auth.js';
