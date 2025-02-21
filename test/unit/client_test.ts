/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {NodeClient} from '../../src/node/node_client';

describe('NodeClient', () => {
  afterEach(() => {
    delete process.env['GOOGLE_API_KEY'];
    delete process.env['GOOGLE_GENAI_USE_VERTEXAI'];
    delete process.env['GOOGLE_CLOUD_PROJECT'];
    delete process.env['GOOGLE_CLOUD_LOCATION'];
  });

  it('should initialize without any options', () => {
    const client = new NodeClient({});
    expect(client).toBeDefined();
  });

  it('should set apiKey from environment', () => {
    process.env['GOOGLE_API_KEY'] = 'test_api_key';
    const client = new NodeClient({});
    expect(client['apiKey']).toBe('test_api_key');
  });

  it('should set vertexai from environment', () => {
    process.env['GOOGLE_GENAI_USE_VERTEXAI'] = 'false';
    let client = new NodeClient({});
    expect(client.vertexai).toBe(false);

    process.env['GOOGLE_GENAI_USE_VERTEXAI'] = 'true';
    client = new NodeClient({});
    expect(client.vertexai).toBe(true);
  });

  it('should set project from environment', () => {
    process.env['GOOGLE_CLOUD_PROJECT'] = 'test_project';
    const client = new NodeClient({});
    expect(client['project']).toBe('test_project');
  });

  it('should set location from environment', () => {
    process.env['GOOGLE_CLOUD_LOCATION'] = 'test_location';
    const client = new NodeClient({});
    expect(client['location']).toBe('test_location');
  });

  it('should prioritize constructor options over environment variables', () => {
    process.env['GOOGLE_API_KEY'] = 'env_api_key';
    process.env['GOOGLE_GENAI_USE_VERTEXAI'] = 'true';
    process.env['GOOGLE_CLOUD_PROJECT'] = 'env_project';
    process.env['GOOGLE_CLOUD_LOCATION'] = 'env_location';

    const client = new NodeClient({
      apiKey: 'constructor_api_key',
      vertexai: false,
      project: 'constructor_project',
      location: 'constructor_location',
    });

    expect(client['apiKey']).toBe('constructor_api_key');
    expect(client.vertexai).toBe(false);
    expect(client['project']).toBe('constructor_project');
    expect(client['location']).toBe('constructor_location');
  });
});
