/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {once} from 'node:events';
import {createServer, Server} from 'node:http';

import {GoogleGenAI} from '../../src/client.js';

const thought = (signature: string) => ({
  type: 'thought',
  signature,
  summary: [{type: 'text', text: `summary ${signature}`}],
});
const text = (value: string) => ({
  type: 'model_output',
  content: [{type: 'text', text: value}],
});

// Interaction id -> steps returned by the fake server.
const STEPS: Record<string, unknown[]> = {
  // Long decode: thoughts interleaved with several model_output steps,
  // including one with no content.
  'multi_step': [
    thought('a'),
    text('First part. '),
    thought('b'),
    text('Second part. '),
    {type: 'model_output'},
    text('Third part.'),
    thought('c'),
  ],
  'tool_boundary': [
    text('Before tool call. '),
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
    thought('a'),
    text('Final part 1. '),
    thought('b'),
    text('Final part 2.'),
    {type: 'function_call', id: 'call_trailing', name: 'noop', arguments: {}},
  ],
  'user_boundary': [
    text('Previous turn. '),
    {type: 'user_input', content: [{type: 'text', text: 'Next question'}]},
    thought('a'),
    text('A'),
    thought('b'),
    text('B'),
  ],
  'non_text_barrier': [
    {
      type: 'model_output',
      content: [
        {type: 'text', text: 'X'},
        {type: 'image', data: 'aW1hZ2U=', mime_type: 'image/png'},
      ],
    },
    thought('a'),
    text('Y'),
  ],
};

describe('Interactions Output Properties', () => {
  let server: Server;
  let ai: GoogleGenAI;

  beforeAll(async () => {
    server = createServer((request, response) => {
      const id = Object.keys(STEPS).find((key) =>
        request.url?.includes(`/interactions/${key}`),
      );
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({id, status: 'completed', steps: id ? STEPS[id] : []}),
      );
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('Server failed to bind.');
    }
    ai = new GoogleGenAI({
      apiKey: 'test-api-key',
      httpOptions: {
        apiVersion: 'v1beta',
        baseUrl: `http://127.0.0.1:${address.port}`,
      },
    });
  });

  afterAll(async () => {
    server.close();
    await once(server, 'close');
  });

  it('concatenates output_text across thoughts and multiple model_output steps', async () => {
    const interaction = await ai.interactions.get('multi_step');
    expect(interaction.output_text).toBe(
      'First part. Second part. Third part.',
    );
  });

  it('stops output_text at tool boundaries', async () => {
    const interaction = await ai.interactions.get('tool_boundary');
    expect(interaction.output_text).toBe('Final part 1. Final part 2.');
  });

  it('stops output_text at user_input', async () => {
    const interaction = await ai.interactions.get('user_boundary');
    expect(interaction.output_text).toBe('AB');
  });

  it('stops output_text at non-text content', async () => {
    const interaction = await ai.interactions.get('non_text_barrier');
    expect(interaction.output_text).toBe('Y');
  });
});
