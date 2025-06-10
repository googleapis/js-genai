/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GOOGLE_API_KEY_HEADER, WebAuth} from '../../../src/web/_web_auth.js';

describe('WebAuth', () => {
  it('should add an x-goog-api-key header', async () => {
    const apiKey = 'test-api-key';
    const nodeAuth = new WebAuth(apiKey);
    const headers = new Headers();

    await nodeAuth.addAuthHeaders(headers);

    expect(headers.get(GOOGLE_API_KEY_HEADER)).toBe(apiKey);
  });

  it('should not add an x-goog-api-key header if it already exists', async () => {
    const apiKey = 'test-api-key';
    const nodeAuth = new WebAuth(apiKey);
    const headers = new Headers();
    headers.append(GOOGLE_API_KEY_HEADER, 'Existing Key');

    await nodeAuth.addAuthHeaders(headers);

    expect(headers.get(GOOGLE_API_KEY_HEADER)).toBe('Existing Key');
  });
});
