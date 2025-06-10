/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Auth} from '../src/_auth.js';

const GOOGLE_API_KEY_HEADER = 'x-goog-api-key';
const AUTHORIZATION_HEADER = 'Authorization';

/**
 * A mock implementation of the Auth interface for testing purposes.
 */
export class FakeAuth implements Auth {
  constructor(private readonly apiKey?: string) {}

  async addAuthHeaders(headers: Headers): Promise<void> {
    if (this.apiKey !== undefined) {
      if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
        return;
      }
      headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
      return;
    }

    if (headers.get(AUTHORIZATION_HEADER) !== null) {
      return;
    }
    headers.append(AUTHORIZATION_HEADER, `Bearer token`);
  }
}
