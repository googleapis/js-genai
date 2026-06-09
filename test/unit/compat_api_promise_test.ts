/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '../../src/client.js';

describe('TypeScript compat: APIPromise methods', () => {
  it('interactions.create() returns a promise with .asResponse() and .withResponse()', async () => {
    // In the Stainless SDK, resource methods return APIPromise which has
    // .asResponse() and .withResponse() for accessing raw response headers.
    // In the Speakeasy SDK, these methods are gone — standard Promise is returned.
    const client = new GoogleGenAI({ apiKey: 'test' });

    const promise = client.interactions.create({
      model: 'gemini-2.0-flash',
      input: 'hello',
      stream: false,
    });

    // These should exist on the Stainless APIPromise
    expect(typeof (promise as any).asResponse).toBe('function');
    expect(typeof (promise as any).withResponse).toBe('function');

    // Consume promise to avoid unhandled rejection
    await promise.catch(() => {});
  });
});
