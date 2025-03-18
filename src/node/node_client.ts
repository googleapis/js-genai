/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuthOptions} from 'google-auth-library';

import {ApiClient} from '../_api_client';
import {Caches} from '../caches';
import {Chats} from '../chats';
import {GoogleGenAIOptions} from '../client';
import {Files} from '../files';
import {Live} from '../live';
import {Models} from '../models';
import {NodeAuth} from '../node/_node_auth';
import {NodeWebSocketFactory} from '../node/_node_websocket';

import {NodeUploader} from './_node_uploader';

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
  protected readonly apiClient: ApiClient;
  private readonly apiKey?: string;
  public readonly vertexai: boolean;
  private readonly googleAuthOptions?: GoogleAuthOptions;
  private readonly project?: string;
  private readonly location?: string;
  private readonly apiVersion?: string;
  readonly models: Models;
  readonly live: Live;
  readonly chats: Chats;
  readonly caches: Caches;
  readonly files: Files;

  constructor(options: GoogleGenAIOptions) {
    this.vertexai =
      options.vertexai ?? getBooleanEnv('GOOGLE_GENAI_USE_VERTEXAI') ?? false;
    // The tests currently assume that an API key is never set if vertexai is true.
    // With Google Cloud Express an API key can be used with vertex.
    // TODO: Set the API key also when vertexai is true.
    if (!this.vertexai) {
      this.apiKey =
        options.apiKey ?? getEnv('GEMINI_API_KEY') ?? getEnv('GOOGLE_API_KEY');
    }
    this.project = options.project ?? getEnv('GOOGLE_CLOUD_PROJECT');
    this.location = options.location ?? getEnv('GOOGLE_CLOUD_LOCATION');
    this.apiVersion = options.apiVersion;
    const auth = new NodeAuth({
      apiKey: this.apiKey,
      googleAuthOptions: options.googleAuthOptions,
    });
    this.apiClient = new ApiClient({
      auth: auth,
      project: this.project,
      location: this.location,
      apiVersion: this.apiVersion,
      apiKey: this.apiKey,
      vertexai: this.vertexai,
      httpOptions: options.httpOptions,
      userAgentExtra: LANGUAGE_LABEL_PREFIX + process.version,
      uploader: new NodeUploader(),
    });
    this.models = new Models(this.apiClient);
    this.live = new Live(this.apiClient, auth, new NodeWebSocketFactory());
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = new Files(this.apiClient);
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
