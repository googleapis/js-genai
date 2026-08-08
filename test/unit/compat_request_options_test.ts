/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '../../src/client.js';

describe('TypeScript compat: Request options', () => {
  it('exercises request options pattern from old SDK', async () => {
    const client = new GoogleGenAI({ apiKey: 'test' });
    const model = "gemini-2.0-flash";
    const input = "hello";
    const requestInit = {};

    // In Stainless, we can pass requestInit as the options parameter
    try {
      await client.interactions.create({ model, input, stream: false }, requestInit);
    } catch (e) {
      // ignore actual network error during unit test execution
    }

    // Custom query and body are officially supported in Stainless request options
    try {
      await client.interactions.create({ model, input, stream: false }, {
        timeout: 30000,
        headers: { "X-Custom": "value" },
        query: { custom_param: "value" },
        body: { custom_body: "value" },
      });
    } catch (e) {
      // ignore actual network error
    }
  });
});
