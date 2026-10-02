/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

describe('Interactions Output Properties', () => {
  it('concatenates output_text across interleaved thought steps and stops at tool boundaries', async () => {
    const server = createServer((request, response) => {
      response.setHeader('content-type', 'application/json');
      if (request.url?.includes('v1_multihop_123')) {
        response.end(
          JSON.stringify({
            id: 'v1_multihop_123',
            status: 'completed',
            steps: [
              {
                type: 'thought',
                content: [{type: 'text', text: 'Thinking before hop 1...'}],
              },
              {
                type: 'model_output',
                content: [{type: 'text', text: 'Hop 1 text. '}],
              },
              {
                type: 'thought',
                content: [{type: 'text', text: 'Thinking before hop 2...'}],
              },
              {
                type: 'model_output',
                content: [{type: 'text', text: 'Hop 2 text. '}],
              },
              {
                type: 'thought',
                content: [{type: 'text', text: 'Thinking before hop 3...'}],
              },
              {
                type: 'model_output',
                content: [{type: 'text', text: 'Hop 3 text.'}],
              },
              {
                type: 'thought',
                content: [{type: 'text', text: 'Trailing thought'}],
              },
            ],
          }),
        );
      } else {
        response.end(
          JSON.stringify({
            id: 'v1_tool_boundary_123',
            status: 'completed',
            steps: [
              {
                type: 'model_output',
                content: [{type: 'text', text: 'Before tool call. '}],
              },
              {
                type: 'function_call',
                id: 'call_1',
                name: 'get_weather',
                arguments: {city: 'Mountain View'},
              },
              {
                type: 'function_result',
                call_id: 'call_1',
                name: 'get_weather',
                result: 'Sunny',
              },
              {
                type: 'thought',
                content: [{type: 'text', text: 'Post-tool thought 1'}],
              },
              {
                type: 'model_output',
                content: [{type: 'text', text: 'After tool hop 1. '}],
              },
              {
                type: 'thought',
                content: [{type: 'text', text: 'Post-tool thought 2'}],
              },
              {
                type: 'model_output',
                content: [{type: 'text', text: 'After tool hop 2.'}],
              },
              {
                type: 'function_call',
                id: 'call_trailing',
                name: 'noop',
                arguments: {},
              },
            ],
          }),
        );
      }
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
      const multihop = await ai.interactions.get('v1_multihop_123');
      expect(multihop.output_text).toBe('Hop 1 text. Hop 2 text. Hop 3 text.');

      const toolBoundary = await ai.interactions.get('v1_tool_boundary_123');
      expect(toolBoundary.output_text).toBe(
        'After tool hop 1. After tool hop 2.',
      );
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
