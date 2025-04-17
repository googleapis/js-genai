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
import {NodeAuth} from '../node/_node_auth';
import {NodeWebSocketFactory} from '../node/_node_websocket';
import {Operations} from '../operations';

import {NodeUploader} from './_node_uploader';

const LANGUAGE_LABEL_PREFIX = 'gl-node/';

function getApiClientInitOptions(
  options: GoogleGenAIOptions,
): ApiClientInitOptions {
  // Validate explicitly set initializer values.
  if ((options.project || options.location) && options.apiKey) {
    throw new Error(
      'Project/location and API key are mutually exclusive in the client initializer.',
    );
  }

  const vertexai =
    options.vertexai ?? getBooleanEnv('GOOGLE_GENAI_USE_VERTEXAI') ?? false;
  const envApiKey = getEnv('GOOGLE_API_KEY');
  const envProject = getEnv('GOOGLE_CLOUD_PROJECT');
  const envLocation = getEnv('GOOGLE_CLOUD_LOCATION');

  let apiKey = options.apiKey ?? envApiKey;
  let project = options.project ?? envProject;
  let location = options.location ?? envLocation;

  // Handle when to use Vertex AI in express mode (api key)
  if (options.vertexai) {
    // Explicit api_key and explicit project/location already handled above.
    if ((envProject || envLocation) && options.apiKey) {
      // Explicit api_key takes precedence over implicit project/location.
      console.debug(
        'The user provided Vertex AI API key will take precedence over' +
          ' the project/location from the environment variables.',
      );
      project = undefined;
      location = undefined;
    } else if ((options.project || options.location) && envApiKey) {
      // Explicit project/location takes precedence over implicit api_key.
      console.debug(
        'The user provided project/location will take precedence over' +
          ' the API key from the environment variables.',
      );
      apiKey = undefined;
    } else if ((envProject || envLocation) && envApiKey) {
      // Implicit project/location takes precedence over implicit api_key.
      console.debug(
        'The project/location from the environment variables will take' +
          ' precedence over the API key from the environment variables.',
      );
      apiKey = undefined;
    }
  }

  const apiVersion = options.apiVersion;
  const auth = new NodeAuth({
    apiKey: apiKey,
    googleAuthOptions: options.googleAuthOptions,
  });
  return {
    auth: auth,
    project: project,
    location: location,
    apiVersion: apiVersion,
    apiKey: apiKey,
    vertexai: vertexai,
    httpOptions: options.httpOptions,
    userAgentExtra: LANGUAGE_LABEL_PREFIX + process.version,
    uploader: new NodeUploader(),
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
export class GoogleGenAI {
  protected readonly apiClient: ApiClient;
  private readonly apiKey?: string;
  public readonly vertexai: boolean;
  private readonly project?: string;
  private readonly location?: string;
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
    this.project = apiClientInitOptions.project;
    this.location = apiClientInitOptions.location;
    this.apiVersion = apiClientInitOptions.apiVersion;

    this.apiClient = new ApiClient(apiClientInitOptions);

    this.models = new Models(this.apiClient);
    this.live = new Live(
      this.apiClient,
      apiClientInitOptions.auth,
      new NodeWebSocketFactory(),
    );
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = new Files(this.apiClient);
    this.operations = new Operations(this.apiClient);
  }
}

function getEnv(env: string): string | undefined {
  return process?.env?.[env]?.trim() ?? undefined;
}

function getBooleanEnv(env: string): boolean {
  return stringToBoolean(getEnv(env));
}

function stringToBoolean(str?: string): boolean {
  if (str === undefined) {
    return false;
  }
  return str.toLowerCase() === 'true';
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
