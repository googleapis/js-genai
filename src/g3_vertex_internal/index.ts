/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Internal-only entry point for Vertex libraries in google3.
 */
export {ApiClient, type ApiClientInitOptions, type HttpRequest,} from '../_api_client.js';
export {type Auth} from '../_auth.js';
export * as common from '../_common.js';
export {type Downloader} from '../_downloader.js';
export {type Uploader} from '../_uploader.js';
export {NodeAuth, type NodeAuthOptions} from '../g3_node/_g3_node_auth.js';
