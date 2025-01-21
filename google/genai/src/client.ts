/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuthOptions} from 'google-auth-library';

import {ApiClient, ApiClientInitOptions} from './_api_client';
import {Caches} from './caches';
import {Chats} from './chats';
import {Files} from './files';
import {Live} from './live';
import {Models} from './models';
import {Tunings} from './tunings';
import {HttpOptions} from './types';

export interface ClientInitOpts extends ApiClientInitOptions {}

export class Client {
  protected readonly apiClient: ApiClient;
  private readonly apiKey?: string;
  public readonly vertexai?: boolean;
  private readonly googleAuthOptions?: GoogleAuthOptions;
  private readonly project?: string;
  private readonly location?: string;
  private readonly apiVersion?: string;
  readonly models: Models;
  readonly live: Live;
  readonly tunings: Tunings;
  readonly chats: Chats;
  readonly caches: Caches;
  readonly files: Files;

  constructor(opts: ClientInitOpts) {
    this.apiKey = opts.apiKey;
    this.vertexai = opts.vertexai;
    this.project = opts.project;
    this.location = opts.location;
    this.apiVersion = opts.apiVersion;
    this.apiClient = new ApiClient({
      project: this.project,
      location: this.location,
      apiVersion: this.apiVersion,
      googleAuthOptions: opts.googleAuthOptions,
      apiKey: this.apiKey,
      vertexai: this.vertexai,
      httpOptions: opts.httpOptions,
    });
    this.models = new Models(this.apiClient);
    this.live = new Live(this.apiClient);
    this.tunings = new Tunings(this.apiClient);
    this.chats = new Chats(this.models, this.apiClient);
    this.caches = new Caches(this.apiClient);
    this.files = new Files(this.apiClient);
  }
}
