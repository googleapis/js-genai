/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ApiClient } from './_api_client.js';
import { Batches } from './batches.js';
import { Caches } from './caches.js';
import { Chats } from './chats.js';
import { CrossDownloader } from './cross/_cross_downloader.js';
import { crossError } from './cross/_cross_error.js';
import { CrossUploader } from './cross/_cross_uploader.js';
import { CrossWebSocketFactory } from './cross/_cross_websocket.js';
import { Files } from './files.js';
import { FileSearchStores } from './filesearchstores.js';
import { Live } from './live.js';
import { Models } from './models.js';
import { Operations } from './operations.js';
import { Tokens } from './tokens.js';
import { Tunings } from './tunings.js';
import { WebAuth } from './web/_web_auth.js';
const LANGUAGE_LABEL_PREFIX = 'gl-node/';
/**
 * The Google GenAI SDK.
 *
 * @remarks
 * Provides access to the GenAI features through either the {@link https://cloud.google.com/vertex-ai/docs/reference/rest | Gemini API}
 * or the {@link https://cloud.google.com/vertex-ai/docs/reference/rest | Vertex AI API}.
 *
 * The {@link GoogleGenAIOptions.vertexai} value determines which of the API services to use.
 *
 * When using the Gemini API, a {@link GoogleGenAIOptions.apiKey} must also be set,
 * when using Vertex AI {@link GoogleGenAIOptions.project} and {@link GoogleGenAIOptions.location} must also be set.
 *
 * @example
 * Initializing the SDK for using the Gemini API:
 * ```ts
 * import {GoogleGenAI} from '@google/genai';
 * const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
 * ```
 *
 * @example
 * Initializing the SDK for using the Vertex AI API:
 * ```ts
 * import {GoogleGenAI} from '@google/genai';
 * const ai = new GoogleGenAI({
 *   vertexai: true,
 *   project: 'PROJECT_ID',
 *   location: 'PROJECT_LOCATION'
 * });
 * ```
 *
 */
export class GoogleGenAI {
    constructor(options) {
        if (options.apiKey == null) {
            throw new Error(`An API Key must be set when running in an unspecified environment.\n + ${crossError().message}`);
        }
        this.vertexai = options.vertexai ?? false;
        this.apiKey = options.apiKey;
        this.apiVersion = options.apiVersion;
        this.httpOptions = options.httpOptions;
        const auth = new WebAuth(this.apiKey);
        this.apiClient = new ApiClient({
            auth: auth,
            apiVersion: this.apiVersion,
            apiKey: this.apiKey,
            vertexai: this.vertexai,
            httpOptions: this.httpOptions,
            userAgentExtra: LANGUAGE_LABEL_PREFIX + 'cross',
            uploader: new CrossUploader(),
            downloader: new CrossDownloader(),
        });
        this.models = new Models(this.apiClient);
        this.live = new Live(this.apiClient, auth, new CrossWebSocketFactory());
        this.chats = new Chats(this.models, this.apiClient);
        this.batches = new Batches(this.apiClient);
        this.caches = new Caches(this.apiClient);
        this.files = new Files(this.apiClient);
        this.operations = new Operations(this.apiClient);
        this.authTokens = new Tokens(this.apiClient);
        this.tunings = new Tunings(this.apiClient);
        this.fileSearchStores = new FileSearchStores(this.apiClient);
    }
}
