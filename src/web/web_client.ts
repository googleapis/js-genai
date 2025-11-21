/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ApiClient} from '../_api_client.js';
import {getBaseUrl} from '../_base_url.js';
import {Batches} from '../batches.js';
import {Caches} from '../caches.js';
import {Chats} from '../chats.js';
import {GoogleGenAIOptions} from '../client.js';
import {Files} from '../files.js';
import {FileSearchStores} from '../filesearchstores.js';
import {Live} from '../live.js';
import {Models} from '../models.js';
import {Operations} from '../operations.js';
import {Tokens} from '../tokens.js';
import {Tunings} from '../tunings.js';

import {BrowserDownloader} from './_browser_downloader.js';
import {BrowserUploader} from './_browser_uploader.js';
import {BrowserWebSocketFactory} from './_browser_websocket.js';
import {WebAuth} from './_web_auth.js';

const LANGUAGE_LABEL_PREFIX = 'gl-node/';

/**
 * The Google GenAI SDK.
 *
 * @remarks
 * Provides access to the GenAI features through either the {@link
 * https://cloud.google.com/vertex-ai/docs/reference/rest | Gemini API} or
 * the {@link https://cloud.google.com/vertex-ai/docs/reference/rest | Vertex AI
 * API}.
 *
 * The {@link GoogleGenAIOptions.vertexai} value determines which of the API
 * services to use.
 *
 * When using the Gemini API, a {@link GoogleGenAIOptions.apiKey} must also be
 * set. When using Vertex AI, currently only {@link GoogleGenAIOptions.apiKey}
 * is supported via Express mode. {@link GoogleGenAIOptions.project} and {@link
 * GoogleGenAIOptions.location} should not be set.
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
  protected readonly apiClient: ApiClient;
  private readonly apiKey?: string;
  public readonly vertexai: boolean;
  private readonly apiVersion?: string;
  readonly models: Models;
  readonly live: Live;
  readonly batches: Batches;
  readonly chats: Chats;
  readonly caches: Caches;
  readonly files: Files;
  readonly operations: Operations;
  readonly authTokens: Tokens;
  readonly tunings: Tunings;
  readonly fileSearchStores: FileSearchStores;

  constructor(options: GoogleGenAIOptions) {
    if (options.apiKey == null) {
      throw new Error('An API Key must be set when running in a browser');
    }
    // Web client only supports API key mode for Vertex AI.
    if (options.project || options.location) {
      throw new Error(
        'Vertex AI project based authentication is not supported on browser runtimes. Please do not provide a project or location.',
      );
    }
    this.vertexai = options.vertexai ?? false;

    this.apiKey = options.apiKey;

    const baseUrl = getBaseUrl(
      options.httpOptions,
      options.vertexai,
      /*vertexBaseUrlFromEnv*/ undefined,
      /*geminiBaseUrlFromEnv*/ undefined,
    );
    if (baseUrl) {
      if (options.httpOptions) {
        options.httpOptions.baseUrl = baseUrl;
      } else {
        options.httpOptions = {baseUrl: baseUrl};
      }
    }

    this.apiVersion = options.apiVersion;
    const auth = new WebAuth(this.apiKey);
    this.apiClient = new ApiClient({
      auth: auth,
      apiVersion: this.apiVersion,
      apiKey: this.apiKey,
      vertexai: this.vertexai,
      httpOptions: options.httpOptions,
      userAgentExtra: LANGUAGE_LABEL_PREFIX + 'web',
      uploader: new BrowserUploader(),
      downloader: new BrowserDownloader(),
    });
    this.models = new Models(this.apiClient);
    this.live = new Live(this.apiClient, auth, new BrowserWebSocketFactory());
    this.batches = new Batches(this.apiClient);
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = new Files(this.apiClient);
    this.operations = new Operations(this.apiClient);
    this.authTokens = new Tokens(this.apiClient);
    this.tunings = new Tunings(this.apiClient);
    this.fileSearchStores = new FileSearchStores(this.apiClient);
  }
}
