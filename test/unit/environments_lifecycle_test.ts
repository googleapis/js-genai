/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Environments Lifecycle', () => {
  it('routes through Google GenAI client', async () => {
    const captured: string[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          id: 'env_abc_123',
          created: '2026-07-22T15:18:38Z',
          updated: '2026-07-22T15:18:38Z',
          status: 'active',
          sources: [
            {
              type: 'INLINE',
              content: 'print("hello")',
              target: 'main.py',
            },
          ],
        }),
      );
    });

    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    expect(address).toBeDefined();
    expect(typeof address).toBe('object');
    if (!address || typeof address !== 'object') {
      server.close();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });

    try {
      const environment = await ai.environments.create({
        sources: [
          {
            type: 'INLINE',
            content: 'print("hello")',
            target: 'main.py',
          },
        ],
      });
      await ai.environments.list();
      const fetched = await ai.environments.get('env_abc_123');
      await ai.environments.delete('env_abc_123');

      expect(environment.id).toBe('env_abc_123');
      expect(fetched.id).toBe('env_abc_123');
      expect(captured).toEqual([
        'POST /v1beta/environments',
        'GET /v1beta/environments',
        'GET /v1beta/environments/env_abc_123',
        'DELETE /v1beta/environments/env_abc_123',
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
