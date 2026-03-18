/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { BaseGeminiNextGenAPIClient } from '../client.js';

export abstract class APIResource {
  /**
   * The key path from the client. For example, a resource accessible as `client.resource.subresource` would
   * have a property `static override readonly _key = Object.freeze(['resource', 'subresource'] as const);`.
   */
  static readonly _key: readonly string[] = [];
  protected _client: BaseGeminiNextGenAPIClient;

  constructor(client: BaseGeminiNextGenAPIClient) {
    this._client = client;
  }
}
