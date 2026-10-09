/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../_api_client.js';
import {BaseGoogleGenAI} from '../_base_client.js';
import {getBaseUrl} from '../_base_url.js';
import {GoogleGenAIOptions} from '../client.js';
import {Files} from '../files.js';
import {Live} from '../live.js';
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
export class GoogleGenAI extends BaseGoogleGenAI {
  private readonly apiKey?: string;
  public readonly vertexai: boolean;
  private readonly apiVersion?: string;

  constructor(options: GoogleGenAIOptions = {} as GoogleGenAIOptions) {
    if (options.apiKey == null) {
      throw new Error('An API Key must be set when running in a browser');
    }
    // Web client only supports API key mode for Vertex AI.
    if (options.project || options.location) {
      throw new Error(
        'Vertex AI project based authentication is not supported on browser runtimes. Please do not provide a project or location.',
      );
    }
    const vertexai = options.vertexai ?? false;
    const apiKey = options.apiKey;

    const baseUrl = getBaseUrl(
      options.httpOptions,
      vertexai,
      /*vertexBaseUrlFromEnv*/ undefined,
      /*geminiBaseUrlFromEnv*/ undefined,
    );
    const httpOptions = options.httpOptions
      ? {...options.httpOptions, ...(baseUrl ? {baseUrl} : {})}
      : baseUrl
        ? {baseUrl}
        : undefined;

    const apiVersion = options.apiVersion;
    const auth = new WebAuth(apiKey);
    const apiClient = new ApiClient({
      auth: auth,
      apiVersion: apiVersion,
      apiKey: apiKey,
      vertexai: vertexai,
      httpOptions: httpOptions,
      userAgentExtra: LANGUAGE_LABEL_PREFIX + 'web',
      uploader: new BrowserUploader(),
      downloader: new BrowserDownloader(),
    });
    const live = new Live(apiClient, auth, new BrowserWebSocketFactory());
    const files = new Files(apiClient);
    super(apiClient, live, files, httpOptions);

    this.vertexai = vertexai;
    this.apiKey = apiKey;
    this.apiVersion = apiVersion;
  }
}
