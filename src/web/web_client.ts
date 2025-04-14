/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient, ApiClientInitOptions, BaseClient} from '../_api_client';
import {Caches} from '../caches';
import {Chats} from '../chats';
import {GoogleGenAIOptions} from '../client';
import {Files} from '../files';
import {Live} from '../live';
import {Models} from '../models';
import {Operations} from '../operations';

import {BrowserUploader} from './_browser_uploader';
import {BrowserWebSocketFactory} from './_browser_websocket';
import {WebAuth} from './_web_auth';

const LANGUAGE_LABEL_PREFIX = 'gl-node/';

function getApiClientInitOptions(
  options: GoogleGenAIOptions,
): ApiClientInitOptions {
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
  const apiVersion = options.apiVersion;
  const auth = new WebAuth(apiKey);
  return {
    auth: auth,
    apiVersion: apiVersion,
    apiKey: apiKey,
    vertexai: vertexai,
    httpOptions: options.httpOptions,
    userAgentExtra: LANGUAGE_LABEL_PREFIX + 'web',
    uploader: new BrowserUploader(),
  };
}

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
  readonly chats: Chats;
  readonly caches: Caches;
  readonly files: Files;
  readonly operations: Operations;

  constructor(options: GoogleGenAIOptions) {
    const apiClientInitOptions = getApiClientInitOptions(options);

    this.apiKey = apiClientInitOptions.apiKey;
    this.vertexai = apiClientInitOptions.vertexai ?? false;
    this.apiVersion = apiClientInitOptions.apiVersion;

    this.apiClient = new ApiClient(apiClientInitOptions);

    this.models = new Models(this.apiClient);
    this.live = new Live(
      this.apiClient,
      apiClientInitOptions.auth,
      new BrowserWebSocketFactory(),
    );
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = new Files(this.apiClient);
    this.operations = new Operations(this.apiClient);
  }
}

/**
 * The Google GenAI SDK Client for use with Standalone Functions.
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
 * set. When using Vertex AI, both {@link GoogleGenAIOptions.project} and {@link
 * GoogleGenAIOptions.location} must be set, or a {@link
 * GoogleGenAIOptions.apiKey} must be set when using Express Mode.
 *
 * Explicitly passed in values in {@link GoogleGenAIOptions} will always take
 * precedence over environment variables. If both project/location and api_key
 * exist in the environment variables, the project/location will be used.
 *
 * @example
 * Initializing the SDK for using the Gemini API:
 * ```ts
 * import {GoogleGenAiClient} from '@google/genai';
 * const ai = new GoogleGenAiClient({apiKey: 'GEMINI_API_KEY'});
 * ```
 *
 * @example
 * Initializing the SDK for using the Vertex AI API:
 * ```ts
 * import {GoogleGenAiClient} from '@google/genai';
 * const ai = new GoogleGenAiClient({
 *   vertexai: true,
 *   project: 'PROJECT_ID',
 *   location: 'PROJECT_LOCATION'
 * });
 * ```
 *
 */
export class GoogleGenAiClient implements BaseClient {
  public readonly apiClient: ApiClient;

  constructor(options: GoogleGenAIOptions) {
    const apiClientInitOptions = getApiClientInitOptions(options);

    this.apiClient = new ApiClient(apiClientInitOptions);
  }
}
