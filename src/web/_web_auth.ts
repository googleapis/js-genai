/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Auth} from '../_auth.js';

export const GOOGLE_API_KEY_HEADER = 'x-goog-api-key';
// TODO(b/395122533): We need a secure client side authentication mechanism.
export class WebAuth implements Auth {
  constructor(private readonly apiKey: string) {}

  async addAuthHeaders(headers: Headers): Promise<void> {
    if (headers.get(GOOGLE_API_KEY_HEADER) !== null) {
      return;
    }
    headers.append(GOOGLE_API_KEY_HEADER, this.apiKey);
  }
}
