/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '../../src/client.js';
import { BadRequestError, NotFoundError } from '../../src/interactions/core/error.js';

describe('TypeScript compat: Errors', () => {
  it('imports and catches Stainless error classes', async () => {
    const client = new GoogleGenAI({ apiKey: 'test' });
    try {
      await client.interactions.create({ model: 'gemini-2.0-flash', input: 'hello' });
    } catch (e) {
      if (e instanceof BadRequestError) {
        console.log(`Bad request status: ${e.status}`);
        console.log(`Error JSON: ${JSON.stringify(e.error)}`);
      } else if (e instanceof NotFoundError) {
        console.log("Not found");
      }
    }
  });
});
