/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Credentials Lifecycle', () => {
  it('routes through Google GenAI client for bearer token, oauth2, and environment variables', async () => {
    const captured: string[] = [];
    const capturedBodies: any[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      let bodyStr = '';
      request.on('data', chunk => {
        bodyStr += chunk;
      });
      request.on('end', () => {
        if (bodyStr && ['POST', 'PATCH', 'PUT'].includes(request.method || '')) {
          try {
            capturedBodies.push(JSON.parse(bodyStr));
          } catch {
            capturedBodies.push(bodyStr);
          }
        }
        response.setHeader('content-type', 'application/json');
        if (request.method === 'GET' && request.url === '/v1beta/credentials') {
          response.end(
            JSON.stringify({
              credentials: [
                {
                  id: 'cred_bearer_123',
                  type: 'bearer_token',
                  status: 'active',
                  create_time: '2026-07-22T15:18:38Z',
                  update_time: '2026-07-22T15:18:38Z',
                },
                {
                  id: 'cred_env_123',
                  type: 'environment_variable',
                  status: 'active',
                  create_time: '2026-07-22T15:18:38Z',
                  update_time: '2026-07-22T15:18:38Z',
                },
                {
                  id: 'cred_oauth_123',
                  type: 'oauth2',
                  status: 'active',
                  create_time: '2026-07-22T15:18:38Z',
                  update_time: '2026-07-22T15:18:38Z',
                },
              ],
              next_page_token: 'token_next_123',
            }),
          );
        } else {
          response.end(
            JSON.stringify({
              id: 'cred_bearer_123',
              type: 'bearer_token',
              status: 'active',
              create_time: '2026-07-22T15:18:38Z',
              update_time: '2026-07-22T15:18:38Z',
            }),
          );
        }
      });
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
      // 1. Bearer token credential creation with custom header and prefix
      const bearerCred = await ai.credentials.create({
        id: 'cred_bearer_123',
        type: 'bearer_token',
        token: 'test-bearer-token',
        header_name: 'X-Custom-Auth',
        prefix: 'Token',
      });
      expect(bearerCred.id).toBe('cred_bearer_123');

      // 2. Environment variable credential creation with injection_location and trusted_domains
      await ai.credentials.create({
        id: 'cred_env_123',
        type: 'environment_variable',
        value: 'super-secret-key',
        injection_location: ['header', 'query'],
        trusted_domains: ['api.example.com', 'service.example.org'],
      });

      // 3. OAuth2 credential creation with scopes
      await ai.credentials.create({
        id: 'cred_oauth_123',
        type: 'oauth2',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        refresh_token: 'test-refresh-token',
        token_url: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      // 4. List credentials
      const listResponse = await ai.credentials.list();
      expect(listResponse.credentials?.length).toBe(3);

      // 5. Get credential
      const fetched = await ai.credentials.get('cred_bearer_123');
      expect(fetched.id).toBe('cred_bearer_123');

      // 6. Update bearer token credential
      await ai.credentials.update('cred_bearer_123', {
        type: 'bearer_token',
        token: 'updated-token',
        header_name: 'Authorization',
        prefix: 'Bearer',
      });

      // 7. Update environment variable credential
      await ai.credentials.update('cred_env_123', {
        type: 'environment_variable',
        value: 'updated-secret-key',
        injection_location: 'header',
        trusted_domains: ['api.example.com'],
      });

      // 8. Update OAuth2 credential
      await ai.credentials.update('cred_oauth_123', {
        type: 'oauth2',
        client_secret: 'updated-secret',
        scopes: ['scope1', 'scope2'],
      });

      // 9. Delete credential
      await ai.credentials.delete('cred_bearer_123');

      expect(captured).toEqual([
        'POST /v1beta/credentials',
        'POST /v1beta/credentials',
        'POST /v1beta/credentials',
        'GET /v1beta/credentials',
        'GET /v1beta/credentials/cred_bearer_123',
        'PATCH /v1beta/credentials/cred_bearer_123',
        'PATCH /v1beta/credentials/cred_env_123',
        'PATCH /v1beta/credentials/cred_oauth_123',
        'DELETE /v1beta/credentials/cred_bearer_123',
      ]);

      // Verify request bodies
      expect(capturedBodies[0]).toEqual({
        id: 'cred_bearer_123',
        type: 'bearer_token',
        token: 'test-bearer-token',
        header_name: 'X-Custom-Auth',
        prefix: 'Token',
      });
      expect(capturedBodies[1]).toEqual({
        id: 'cred_env_123',
        type: 'environment_variable',
        value: 'super-secret-key',
        injection_location: ['header', 'query'],
        trusted_domains: ['api.example.com', 'service.example.org'],
      });
      expect(capturedBodies[2]).toEqual({
        id: 'cred_oauth_123',
        type: 'oauth2',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        refresh_token: 'test-refresh-token',
        token_url: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
