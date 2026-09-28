/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuthOptions} from 'google-auth-library';

import {ApiClient} from './_api_client.js';
import {BaseGoogleGenAI} from './_base_client.js';
import {CrossDownloader} from './cross/_cross_downloader.js';
import {crossError} from './cross/_cross_error.js';
import {CrossUploader} from './cross/_cross_uploader.js';
import {CrossWebSocketFactory} from './cross/_cross_websocket.js';
import {Files} from './files.js';
import {Live} from './live.js';
import {HttpOptions} from './types.js';
import {WebAuth} from './web/_web_auth.js';

const LANGUAGE_LABEL_PREFIX = 'gl-node/';

/**
 * Google Gen AI SDK's configuration options.
 *
 * See {@link GoogleGenAI} for usage samples.
 */
export interface GoogleGenAIOptions {
  /**
   * Optional. Determines whether to use the Vertex AI or the Gemini API.
   *
   * @remarks
   * When true, the {@link https://cloud.google.com/vertex-ai/docs/reference/rest | Gemini Enterprise Agent Platform API} will used.
   * When false, the {@link https://ai.google.dev/api | Gemini API} will be used.
   * When both enterprise and vertexai are set, and they have different values,
   * an Error will be thrown.
   *
   * If unset, default SDK behavior is to use the Gemini API service.
   */
  enterprise?: boolean;
  /**
   * Optional. Determines whether to use the Vertex AI (now Gemini Enterprise Agent Platform) or the Gemini API.
   * The `enterprise` flag is recommended instead.
   *
   * @remarks
   * When true, the {@link https://cloud.google.com/vertex-ai/docs/reference/rest | Vertex AI API} will used.
   * When false, the {@link https://ai.google.dev/api | Gemini API} will be used.
   * When both enterprise and vertexai are set, and they have different values,
   * an Error will be thrown.
   *
   * If unset, default SDK behavior is to use the Gemini API service.
   */
  vertexai?: boolean;
  /**
   * Optional. The Google Cloud project ID for Vertex AI clients.
   *
   * Find your project ID: https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects
   *
   * @remarks
   * Only supported on Node runtimes, ignored on browser runtimes.
   */
  project?: string;
  /**
   * Optional. The Google Cloud project {@link https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations | location} for Vertex AI clients.
   *
   * @remarks
   * Only supported on Node runtimes, ignored on browser runtimes.
   *
   */
  location?: string;
  /**
   * The API Key, required for Gemini API clients.
   *
   * @remarks
   * Required on browser runtimes.
   */
  apiKey?: string;
  /**
   * Optional. The API version to use.
   *
   * @remarks
   * If unset, the default API version will be used.
   */
  apiVersion?: string;
  /**
   * Optional. Authentication options defined by the by google-auth-library for Vertex AI clients.
   *
   * @remarks
   * @see {@link https://github.com/googleapis/google-auth-library-nodejs/blob/v9.15.0/src/auth/googleauth.ts | GoogleAuthOptions interface in google-auth-library-nodejs}.
   *
   * Only supported on Node runtimes, ignored on browser runtimes.
   *
   */
  googleAuthOptions?: GoogleAuthOptions;
  /**
   * Optional. A set of customizable configuration for HTTP requests.
   */
  httpOptions?: HttpOptions;
}

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
export class GoogleGenAI extends BaseGoogleGenAI {
  private readonly apiKey?: string;
  public readonly vertexai: boolean;
  private readonly apiVersion?: string;

  constructor(options: GoogleGenAIOptions = {} as GoogleGenAIOptions) {
    if (options.apiKey == null) {
      throw new Error(
        `An API Key must be set when running in an unspecified environment.\n + ${crossError().message}`,
      );
    }
    if (
      options.enterprise !== undefined &&
      options.vertexai !== undefined &&
      options.enterprise !== options.vertexai
    ) {
      throw new Error(
        'enterprise and vertexAI flags have conflicting values, please set enterprise value only.',
      );
    }
    const vertexai = options.enterprise ?? options.vertexai ?? false;
    const apiKey = options.apiKey;
    const apiVersion = options.apiVersion;
    const httpOptions = options.httpOptions;
    const auth = new WebAuth(apiKey);
    const apiClient = new ApiClient({
      auth: auth,
      apiVersion: apiVersion,
      apiKey: apiKey,
      vertexai: vertexai,
      httpOptions: httpOptions,
      userAgentExtra: LANGUAGE_LABEL_PREFIX + 'cross',
      uploader: new CrossUploader(),
      downloader: new CrossDownloader(),
    });
    const live = new Live(apiClient, auth, new CrossWebSocketFactory());
    const files = new Files(apiClient);
    super(apiClient, live, files, httpOptions);

    this.vertexai = vertexai;
    this.apiKey = apiKey;
    this.apiVersion = apiVersion;
  }
}
