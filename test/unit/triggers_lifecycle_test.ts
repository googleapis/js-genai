/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Triggers Lifecycle', () => {
  it('routes through Google GenAI client', async () => {
    const captured: string[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          id: 'projects/my-project/locations/my-location/triggers/svc_abc',
          schedule: '0 0 * * *',
          time_zone: 'UTC',
          interaction: {
            agent: 'projects/my-project/locations/my-location/agents/my-agent',
            environment: {
              type: 'remote',
              network: {
                allowlist: [
                  {
                    domain: 'api.github.com',
                    transform: {
                      Authorization:
                        'Bearer ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    },
                  },
                  {domain: 'github.com'},
                ],
              },
            },
          },
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
      const trigger = await ai.triggers.create({
        schedule: '0 0 * * *',
        time_zone: 'UTC',
        interaction: {
          agent: 'projects/my-project/locations/my-location/agents/my-agent',
          input: 'test-input',
          environment: {
            type: 'remote',
            network: {
              allowlist: [
                {
                  domain: 'api.github.com',
                  transform: {
                    Authorization:
                      'Bearer ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                  },
                },
                {domain: 'github.com'},
              ],
            },
          },
        },
      });
      await ai.triggers.list({
        filter: 'some-filter',
        pageSize: 10,
      });
      const fetched = await ai.triggers.get('svc_abc');
      await ai.triggers.update('svc_abc', {
        status: 'active',
      });
      await ai.triggers.delete('svc_abc');
      await ai.triggers.run('svc_abc');
      await ai.triggers.listExecutions('svc_abc', {
        pageSize: 5,
      });

      expect(trigger.schedule).toBe('0 0 * * *');
      expect(fetched.schedule).toBe('0 0 * * *');
      expect(captured).toEqual([
        'POST /v1beta/triggers',
        'GET /v1beta/triggers?filter=some-filter&page_size=10',
        'GET /v1beta/triggers/svc_abc',
        'PATCH /v1beta/triggers/svc_abc',
        'DELETE /v1beta/triggers/svc_abc',
        'POST /v1beta/triggers/svc_abc/executions',
        'GET /v1beta/triggers/svc_abc/executions?page_size=5',
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
