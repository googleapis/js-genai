/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from './_api_client.js';
import {Batches} from './batches.js';
import {Caches} from './caches.js';
import {Chats} from './chats.js';
import {Files} from './files.js';
import {FileSearchStores} from './filesearchstores.js';
import type {
  GeminiNextGenAgents as Agents,
  GeminiNextGenCredentials as Credentials,
  GeminiNextGenEnvironments as Environments,
  GeminiNextGenInteractions as Interactions,
  GeminiNextGenTriggers as Triggers,
  GeminiNextGenVoices as Voices,
  GeminiNextGenWebhooks as Webhooks,
} from './gaos/google-genai.js';
import {
  buildGoogleGenAIClient,
  GeminiNextGenAgents,
  GeminiNextGenCredentials,
  GeminiNextGenEnvironments,
  GeminiNextGenInteractions,
  GeminiNextGenTriggers,
  GeminiNextGenVoices,
  GeminiNextGenWebhooks,
} from './gaos/google-genai.js';
import type {GoogleGenAI as GeminiNextGenAPI} from './gaos/sdk/sdk.js';
import {Live} from './live.js';
import {Models} from './models.js';
import {Operations} from './operations.js';
import {Tokens} from './tokens.js';
import {Tunings} from './tunings.js';
import {HttpOptions} from './types.js';

/**
 * Base class containing all shared service instances and GAOS resource getters
 * across GoogleGenAI client implementations.
 */
export abstract class BaseGoogleGenAI {
  protected readonly apiClient: ApiClient;
  protected readonly httpOptions?: HttpOptions;
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

  private _interactions: GeminiNextGenInteractions | undefined;
  private _webhooks: GeminiNextGenWebhooks | undefined;
  private _agents: GeminiNextGenAgents | undefined;
  private _environments: GeminiNextGenEnvironments | undefined;
  private _credentials: GeminiNextGenCredentials | undefined;
  private _voices: GeminiNextGenVoices | undefined;
  private _nextGenClient: GeminiNextGenAPI | undefined;
  private _triggers: Triggers | undefined;

  constructor(
    apiClient: ApiClient,
    live: Live,
    files: Files,
    httpOptions?: HttpOptions,
  ) {
    this.apiClient = apiClient;
    this.httpOptions = httpOptions;
    this.models = new Models(this.apiClient);
    this.live = live;
    this.batches = new Batches(this.apiClient);
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = files;
    this.operations = new Operations(this.apiClient);
    this.authTokens = new Tokens(this.apiClient);
    this.tunings = new Tunings(this.apiClient);
    this.fileSearchStores = new FileSearchStores(this.apiClient);
  }

  /**
   * Alias for `authTokens` to support callers accessing `tokens`.
   */
  get tokens(): Tokens {
    return this.authTokens;
  }

  protected getNextGenClient(): GeminiNextGenAPI {
    const httpOpts = this.httpOptions;
    if (this._nextGenClient === undefined) {
      this._nextGenClient = buildGoogleGenAIClient(this.apiClient, {
        timeout_ms: httpOpts?.timeout,
      });
    }

    if (httpOpts?.extraBody) {
      console.warn(
        'GoogleGenAI: Client level httpOptions.extraBody is not supported by the Gemini NextGen client and will be ignored.',
      );
    }

    return this._nextGenClient;
  }

  get interactions(): Interactions {
    if (this._interactions !== undefined) {
      return this._interactions;
    }

    this._interactions = new GeminiNextGenInteractions(this.apiClient);
    return this._interactions;
  }

  get webhooks(): Webhooks {
    if (this._webhooks !== undefined) {
      return this._webhooks;
    }

    this._webhooks = new GeminiNextGenWebhooks(this.apiClient);
    return this._webhooks;
  }

  get agents(): Agents {
    if (this._agents !== undefined) {
      return this._agents;
    }

    console.warn(
      'GoogleGenAI.agents: Agents usage is experimental and may change in future versions.',
    );

    this._agents = new GeminiNextGenAgents(this.apiClient);
    return this._agents;
  }

  get triggers(): Triggers {
    if (this._triggers !== undefined) {
      return this._triggers;
    }

    console.warn(
      'GoogleGenAI.triggers: Triggers usage is experimental and may change in future versions.',
    );

    this._triggers = new GeminiNextGenTriggers(this.apiClient);
    return this._triggers;
  }

  get environments(): Environments {
    if (this._environments !== undefined) {
      return this._environments;
    }

    console.warn(
      'GoogleGenAI.environments: Environments usage is experimental and may change in future versions.',
    );

    this._environments = new GeminiNextGenEnvironments(this.apiClient);
    return this._environments;
  }

  get credentials(): Credentials {
    if (this._credentials !== undefined) {
      return this._credentials;
    }

    console.warn(
      'GoogleGenAI.credentials: Credentials usage is experimental and may change in future versions.',
    );

    this._credentials = new GeminiNextGenCredentials(this.apiClient);
    return this._credentials;
  }

  get voices(): Voices {
    if (this._voices !== undefined) {
      return this._voices;
    }

    this._voices = new GeminiNextGenVoices(this.apiClient);
    return this._voices;
  }
}
