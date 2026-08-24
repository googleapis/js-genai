/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GOOGLE_AI_API_DEFAULT_VERSION} from '../../src/_api_client.js';
import {GoogleGenAI} from '../../src/client.js';
import {
  APIError,
  BadRequestError,
  NotFoundError,
  wrapSDKError,
} from '../../src/gaos/lib/compat-errors.js';
import {
  GoogleGenAiDefaultError,
  GoogleGenAiError,
} from '../../src/gaos/models/errors/index.js';

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
        page_size: 10,
      });
      const fetched = await ai.triggers.get('svc_abc');
      await ai.triggers.update('svc_abc', {
        status: 'active',
      });
      await ai.triggers.delete('svc_abc');
      await ai.triggers.run('svc_abc');
      await ai.triggers.listExecutions('svc_abc', {
        page_size: 5,
      });

      expect(trigger.schedule).toBe('0 0 * * *');
      expect(fetched.schedule).toBe('0 0 * * *');
      expect(captured).toEqual([
        `POST /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers`,
        `GET /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers?filter=some-filter&page_size=10`,
        `GET /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers/svc_abc`,
        `PATCH /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers/svc_abc`,
        `DELETE /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers/svc_abc`,
        `POST /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers/svc_abc/executions`,
        `GET /${GOOGLE_AI_API_DEFAULT_VERSION}/triggers/svc_abc/executions?page_size=5`,
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('preserves prototype chain and wraps errors in wrapSDKError', () => {
    const request = new Request(
      `https://generativelanguage.googleapis.com/${GOOGLE_AI_API_DEFAULT_VERSION}/triggers`,
    );
    const response400 = new Response(
      '{"error":{"message":"invalid argument"}}',
      {
        status: 400,
        headers: {'content-type': 'application/json'},
      },
    );
    const baseErr = new GoogleGenAiError('bad request', {
      request,
      response: response400,
      body: '{"error":{"message":"invalid argument"}}',
    });
    expect(baseErr instanceof Error).toBeTrue();
    expect(baseErr instanceof GoogleGenAiError).toBeTrue();

    const defaultErr = new GoogleGenAiDefaultError('not found', {
      request,
      response: new Response('{"error":{"message":"missing"}}', {
        status: 404,
        headers: {'content-type': 'application/json'},
      }),
      body: '{"error":{"message":"missing"}}',
    });
    expect(defaultErr instanceof Error).toBeTrue();
    expect(defaultErr instanceof GoogleGenAiError).toBeTrue();
    expect(defaultErr instanceof GoogleGenAiDefaultError).toBeTrue();

    const wrapped400 = wrapSDKError(baseErr);
    expect(wrapped400 instanceof APIError).toBeTrue();
    expect(wrapped400 instanceof BadRequestError).toBeTrue();
    expect((wrapped400 as APIError).status).toBe(400);

    // Simulate ES5 transpilation where instanceof GoogleGenAiError fails,
    // verifying the duck-typing fallback in isGoogleGenAiErrorInstance.
    const es5LikeErr = new Error('not found');
    Object.assign(es5LikeErr, {
      statusCode: 404,
      body: '{"message":"trigger not found"}',
      headers: new Headers({'content-type': 'application/json'}),
      contentType: 'application/json',
    });
    const wrapped404 = wrapSDKError(es5LikeErr);
    expect(wrapped404 instanceof APIError).toBeTrue();
    expect(wrapped404 instanceof NotFoundError).toBeTrue();
    expect((wrapped404 as APIError).status).toBe(404);
  });
});
