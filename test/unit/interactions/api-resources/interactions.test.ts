/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { BaseInteractions } from 'gemini-next-gen-api/resources/interactions';

import GeminiNextGenAPIClient from 'gemini-next-gen-api';
import { createClient, type PartialGeminiNextGenAPIClient } from 'gemini-next-gen-api/tree-shakable';

const client = new GeminiNextGenAPIClient({
  apiKey: 'My API Key',
  baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010',
  clientAdapter: {
    isVertexAI: () => false,
    getProject: () => undefined,
    getLocation: () => undefined,
    getAuthHeaders: () => new Headers(),
  },
});

const partialClient = createClient({
  apiKey: 'My API Key',
  baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010',
  resources: [BaseInteractions],
  clientAdapter: {
    isVertexAI: () => false,
    getProject: () => undefined,
    getLocation: () => undefined,
    getAuthHeaders: () => new Headers(),
  },
});

const runTests = (client: PartialGeminiNextGenAPIClient<{ interactions: BaseInteractions }>) => {
  // Mock server tests are disabled
  test.skip('create: only required params', async () => {
    const responsePromise = client.interactions.create({
      api_version: 'api_version',
      input: { text: 'text', type: 'text' },
      model: 'gemini-2.5-computer-use-preview-10-2025',
    });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('create: required and optional params', async () => {
    const response = await client.interactions.create({
      api_version: 'api_version',
      input: {
        text: 'text',
        type: 'text',
        annotations: [
          {
            type: 'url_citation',
            end_index: 0,
            start_index: 0,
            title: 'title',
            url: 'url',
          },
        ],
      },
      model: 'gemini-2.5-computer-use-preview-10-2025',
      background: true,
      environment: 'string',
      generation_config: {
        image_config: { aspect_ratio: '1:1', image_size: '1K' },
        max_output_tokens: 0,
        seed: 0,
        speech_config: [
          {
            language: 'language',
            speaker: 'speaker',
            voice: 'voice',
          },
        ],
        stop_sequences: ['string'],
        temperature: 0,
        thinking_level: 'minimal',
        thinking_summaries: 'auto',
        tool_choice: 'auto',
        top_p: 0,
      },
      previous_interaction_id: 'previous_interaction_id',
      response_format: [
        {
          type: 'audio',
          bit_rate: 0,
          delivery: 'inline',
          mime_type: 'audio/mp3',
          sample_rate: 0,
        },
      ],
      response_mime_type: 'response_mime_type',
      response_modalities: ['text'],
      service_tier: 'flex',
      store: true,
      stream: false,
      system_instruction: 'system_instruction',
      tools: [
        {
          type: 'function',
          description: 'description',
          name: 'name',
          parameters: {},
        },
      ],
      webhook_config: {
        uris: ['string'],
        user_metadata: { foo: 'bar' },
      },
    });
  });

  // Mock server tests are disabled
  test.skip('delete: only required params', async () => {
    const responsePromise = client.interactions.delete('id', { api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('delete: required and optional params', async () => {
    const response = await client.interactions.delete('id', { api_version: 'api_version' });
  });

  // Mock server tests are disabled
  test.skip('cancel: only required params', async () => {
    const responsePromise = client.interactions.cancel('id', { api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('cancel: required and optional params', async () => {
    const response = await client.interactions.cancel('id', { api_version: 'api_version' });
  });

  // Mock server tests are disabled
  test.skip('get: only required params', async () => {
    const responsePromise = client.interactions.get('id', { api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('get: required and optional params', async () => {
    const response = await client.interactions.get('id', {
      api_version: 'api_version',
      include_input: true,
      last_event_id: 'last_event_id',
      stream: false,
    });
  });
};
describe('resource interactions', () => runTests(client));
describe('resource interactions (tree shakable, base)', () => runTests(partialClient));
