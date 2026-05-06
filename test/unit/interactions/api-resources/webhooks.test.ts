/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { BaseWebhooks } from 'gemini-next-gen-api/resources/webhooks';

import GeminiNextGenAPIClient from 'gemini-next-gen-api';
import { createClient, type PartialGeminiNextGenAPIClient } from 'gemini-next-gen-api/tree-shakable';

const client = new GeminiNextGenAPIClient({
  apiKey: 'My API Key',
  baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010',
});

const partialClient = createClient({
  apiKey: 'My API Key',
  baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010',
  resources: [BaseWebhooks],
});

const runTests = (client: PartialGeminiNextGenAPIClient<{ webhooks: BaseWebhooks }>) => {
  // Mock server tests are disabled
  test.skip('create: only required params', async () => {
    const responsePromise = client.webhooks.create({
      api_version: 'api_version',
      subscribed_events: ['batch.succeeded'],
      uri: 'uri',
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
    const response = await client.webhooks.create({
      api_version: 'api_version',
      subscribed_events: ['batch.succeeded'],
      uri: 'uri',
      name: 'name',
    });
  });

  // Mock server tests are disabled
  test.skip('update: only required params', async () => {
    const responsePromise = client.webhooks.update('id', { api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('update: required and optional params', async () => {
    const response = await client.webhooks.update('id', {
      api_version: 'api_version',
      update_mask: 'update_mask',
      name: 'name',
      state: 'enabled',
      subscribed_events: ['batch.succeeded'],
      uri: 'uri',
    });
  });

  // Mock server tests are disabled
  test.skip('list: only required params', async () => {
    const responsePromise = client.webhooks.list({ api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('list: required and optional params', async () => {
    const response = await client.webhooks.list({
      api_version: 'api_version',
      page_size: 0,
      page_token: 'page_token',
    });
  });

  // Mock server tests are disabled
  test.skip('delete: only required params', async () => {
    const responsePromise = client.webhooks.delete('id', { api_version: 'api_version' });
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
    const response = await client.webhooks.delete('id', { api_version: 'api_version' });
  });

  // Mock server tests are disabled
  test.skip('get: only required params', async () => {
    const responsePromise = client.webhooks.get('id', { api_version: 'api_version' });
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
    const response = await client.webhooks.get('id', { api_version: 'api_version' });
  });

  // Mock server tests are disabled
  test.skip('ping: only required params', async () => {
    const responsePromise = client.webhooks.ping('id', { api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('ping: required and optional params', async () => {
    const response = await client.webhooks.ping('id', {
      api_version: 'api_version',
      body: {},
    });
  });

  // Mock server tests are disabled
  test.skip('rotateSigningSecret: only required params', async () => {
    const responsePromise = client.webhooks.rotateSigningSecret('id', { api_version: 'api_version' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('rotateSigningSecret: required and optional params', async () => {
    const response = await client.webhooks.rotateSigningSecret('id', {
      api_version: 'api_version',
      revocation_behavior: 'revoke_previous_secrets_after_h24',
    });
  });
};
describe('resource webhooks', () => runTests(client));
describe('resource webhooks (tree shakable, base)', () => runTests(partialClient));
