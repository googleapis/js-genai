/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuthOptions} from 'google-auth-library';

import {ApiClient} from '../_api_client.js';
import {BaseGoogleGenAI} from '../_base_client.js';
import {getBaseUrl} from '../_base_url.js';
import {GoogleGenAIOptions} from '../client.js';
import {Live} from '../live.js';
import {NodeAuth} from '../node/_node_auth.js';
import {NodeDownloader} from '../node/_node_downloader.js';
import {NodeWebSocketFactory} from '../node/_node_websocket.js';

import {NodeUploader} from './_node_uploader.js';
import {NodeFiles} from './node_files.js';

const LANGUAGE_LABEL_PREFIX = 'gl-node/';

function resolveCloudFlag(options?: GoogleGenAIOptions): boolean {
  if (
    options &&
    (options.enterprise !== undefined || options.vertexai !== undefined)
  ) {
    if (
      options.enterprise !== undefined &&
      options.vertexai !== undefined &&
      options.enterprise !== options.vertexai
    ) {
      throw new Error(
        'enterprise and vertexAI flags have conflicting values, please set enterprise value only.',
      );
    }
    return options.enterprise ?? options.vertexai!;
  }

  const envEnterpriseStr = getEnv('GOOGLE_GENAI_USE_ENTERPRISE');
  const envVertexaiStr = getEnv('GOOGLE_GENAI_USE_VERTEXAI');
  const useEnterpriseEnv = stringToBoolean(envEnterpriseStr);
  const useVertexaiEnv = stringToBoolean(envVertexaiStr);

  if (
    envEnterpriseStr !== undefined &&
    envVertexaiStr !== undefined &&
    useEnterpriseEnv !== useVertexaiEnv
  ) {
    console.warn(
      'Warning: Both GOOGLE_GENAI_USE_ENTERPRISE and GOOGLE_GENAI_USE_VERTEXAI are set with conflicting values. The value of GOOGLE_GENAI_USE_ENTERPRISE will be used.',
    );
  }

  if (envEnterpriseStr !== undefined) {
    return useEnterpriseEnv;
  }
  if (envVertexaiStr !== undefined) {
    return useVertexaiEnv;
  }

  return false;
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
  private readonly googleAuthOptions?: GoogleAuthOptions;
  private readonly project?: string;
  private readonly location?: string;
  private readonly apiVersion?: string;

  constructor(options: GoogleGenAIOptions = {}) {
    const vertexai = resolveCloudFlag(options);

    // Validate explicitly set initializer values.
    if ((options.project || options.location) && !vertexai) {
      throw new Error(
        'Project and location are not supported for Gemini API backend.',
      );
    }

    const envApiKey = getApiKeyFromEnv();
    const envProject = getEnv('GOOGLE_CLOUD_PROJECT');
    const envLocation = getEnv('GOOGLE_CLOUD_LOCATION');

    let apiKey = options.apiKey ?? envApiKey;
    let project = options.project ?? envProject;
    let location = options.location ?? envLocation;

    if (!vertexai && !apiKey) {
      console.warn('API key should be set when using the Gemini API.');
    }

    // Handle when to use Vertex AI in express mode (api key)
    if (vertexai) {
      if (options.googleAuthOptions?.credentials) {
        // Explicit credentials take precedence over implicit api_key.
        console.debug(
          'The user provided Google Cloud credentials will take precedence' +
            ' over the API key from the environment variable.',
        );
        apiKey = undefined;
      }
      if (
        !options.project &&
        !options.location &&
        (envProject || envLocation) &&
        options.apiKey
      ) {
        // Explicit api_key takes precedence over implicit project/location.
        console.debug(
          'The user provided Vertex AI API key will take precedence over' +
            ' the project/location from the environment variables.',
        );
        project = undefined;
        location = undefined;
      } else if (
        (options.project || options.location) &&
        !options.apiKey &&
        envApiKey
      ) {
        // Explicit project/location takes precedence over implicit api_key.
        console.debug(
          'The user provided project/location will take precedence over' +
            ' the API key from the environment variables.',
        );
        apiKey = undefined;
      } else if (
        !options.project &&
        !options.location &&
        !options.apiKey &&
        (envProject || envLocation) &&
        envApiKey
      ) {
        // Implicit project/location takes precedence over implicit api_key.
        console.debug(
          'The project/location from the environment variables will take' +
            ' precedence over the API key from the environment variables.',
        );
        apiKey = undefined;
      }

      if (!location && !apiKey) {
        location = 'global';
      }
    }

    const baseUrl = getBaseUrl(
      options.httpOptions,
      vertexai,
      getEnv('GOOGLE_VERTEX_BASE_URL'),
      getEnv('GOOGLE_GEMINI_BASE_URL'),
    );
    const httpOptions = options.httpOptions
      ? {...options.httpOptions, ...(baseUrl ? {baseUrl} : {})}
      : baseUrl
        ? {baseUrl}
        : undefined;

    const apiVersion = options.apiVersion;
    const auth = new NodeAuth({
      apiKey: apiKey,
      googleAuthOptions: options.googleAuthOptions,
    });
    const apiClient = new ApiClient({
      auth: auth,
      project: project,
      location: location,
      apiVersion: apiVersion,
      apiKey: apiKey,
      vertexai: vertexai,
      httpOptions: httpOptions,
      userAgentExtra: LANGUAGE_LABEL_PREFIX + process.version,
      uploader: new NodeUploader(),
      downloader: new NodeDownloader(),
    });
    const live = new Live(apiClient, auth, new NodeWebSocketFactory());
    const files = new NodeFiles(apiClient);
    super(apiClient, live, files, httpOptions);

    this.vertexai = vertexai;
    this.apiKey = apiKey;
    this.project = project;
    this.location = location;
    this.apiVersion = apiVersion;
    this.googleAuthOptions = options.googleAuthOptions;
  }
}

function getEnv(env: string): string | undefined {
  return process?.env?.[env]?.trim() ?? undefined;
}

function stringToBoolean(str?: string): boolean {
  if (str === undefined) {
    return false;
  }
  return str.toLowerCase() === 'true';
}

function getApiKeyFromEnv(): string | undefined {
  const envGoogleApiKey = getEnv('GOOGLE_API_KEY');
  const envGeminiApiKey = getEnv('GEMINI_API_KEY');
  if (envGoogleApiKey && envGeminiApiKey) {
    console.warn(
      'Both GOOGLE_API_KEY and GEMINI_API_KEY are set. Using GOOGLE_API_KEY.',
    );
  }
  return envGoogleApiKey || envGeminiApiKey || undefined;
}
