/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Voices Lifecycle', () => {
  it('routes through Google GenAI client for create, list, get, and delete', async () => {
    const captured: string[] = [];
    const capturedBodies: unknown[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      let bodyStr = '';
      request.on('data', (chunk) => {
        bodyStr += chunk;
      });
      request.on('end', () => {
        if (
          bodyStr &&
          ['POST', 'PATCH', 'PUT'].includes(request.method || '')
        ) {
          try {
            capturedBodies.push(JSON.parse(bodyStr));
          } catch {
            capturedBodies.push(bodyStr);
          }
        }
        response.setHeader('content-type', 'application/json');
        if (
          request.method === 'GET' &&
          (request.url === '/v1beta/voices' ||
            request.url?.startsWith('/v1beta/voices?'))
        ) {
          response.end(
            JSON.stringify({
              voices: [
                {
                  id: 'voice_abc123',
                  display_name: 'Warm Narrator',
                  type: 'prompted',
                  gender: 'female',
                  language_code: 'en-US',
                  prompted: {
                    input: 'A warm, friendly narrator voice.',
                  },
                },
                {
                  id: 'Puck',
                  display_name: 'Puck',
                  type: 'prebuilt',
                  gender: 'male',
                  language_code: 'en-US',
                },
              ],
              next_page_token: 'token_next_123',
            }),
          );
        } else if (request.method === 'DELETE') {
          response.end(JSON.stringify({}));
        } else {
          response.end(
            JSON.stringify({
              id: 'voice_abc123',
              display_name: 'Warm Narrator',
              type: 'prompted',
              gender: 'female',
              language_code: 'en-US',
              prompted: {
                input: 'A warm, friendly narrator voice.',
              },
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
      // 1. Create prompted voice
      const created = await ai.voices.create({
        store: true,
        voice: {
          type: 'prompted',
          display_name: 'Warm Narrator',
          gender: 'female',
          language_code: 'en-US',
          prompted: {
            input: 'A warm, friendly narrator voice.',
          },
        },
      });
      expect(created.id).toBe('voice_abc123');
      expect(created.display_name).toBe('Warm Narrator');

      // 2. List voices
      const listResponse = await ai.voices.list({
        language_code: ['en-US'],
      });
      expect(listResponse.voices?.length).toBe(2);
      expect(listResponse.next_page_token).toBe('token_next_123');

      // 3. Get voice
      const fetched = await ai.voices.get('voice_abc123');
      expect(fetched.id).toBe('voice_abc123');

      // 4. Delete voice
      await ai.voices.delete('voice_abc123');

      expect(captured).toEqual([
        'POST /v1beta/voices',
        'GET /v1beta/voices?language_code=en-US',
        'GET /v1beta/voices/voice_abc123',
        'DELETE /v1beta/voices/voice_abc123',
      ]);

      expect(capturedBodies[0]).toEqual({
        store: true,
        voice: {
          type: 'prompted',
          display_name: 'Warm Narrator',
          gender: 'female',
          language_code: 'en-US',
          prompted: {
            input: 'A warm, friendly narrator voice.',
          },
        },
      });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
