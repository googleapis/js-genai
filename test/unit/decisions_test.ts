/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Decisions API', () => {
  it('routes through Google GenAI client for create', async () => {
    const captured: string[] = [];
    const capturedBodies: unknown[] = [];
    const server = createServer((request, response) => {
      captured.push(`${request.method} ${request.url}`);
      let bodyStr = '';
      request.on('data', (chunk) => {
        bodyStr += chunk;
      });
      request.on('end', () => {
        if (bodyStr) {
          capturedBodies.push(JSON.parse(bodyStr));
        }
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            answers: {
              q1: {
                type: 'noul',
                noul: 0.95,
                confidence: 0.95,
              },
            },
          }),
        );
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
      const response = await ai.decisions.create({
        model: 'decisions-prerelease',
        input: 'User prompt context',
        questions: {
          q1: {
            type: 'noul',
            instructions: 'Does the user want a summary?',
          },
        },
      });

      expect(response.answers).toBeDefined();
      const answer = response.answers?.['q1'];
      expect(answer?.type).toBe('noul');
      if (answer?.type === 'noul') {
        expect(answer.noul).toBe(0.95);
        expect(answer.confidence).toBe(0.95);
      }
      expect(captured).toEqual(['POST /v1beta/decisions']);
      expect(capturedBodies[0]).toEqual({
        model: 'decisions-prerelease',
        input: 'User prompt context',
        questions: {
          q1: {
            type: 'noul',
            instructions: 'Does the user want a summary?',
          },
        },
      });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
