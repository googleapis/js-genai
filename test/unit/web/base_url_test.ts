/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {setDefaultBaseUrls} from '../../../src/_base_url.js';
import {GoogleGenAI} from '../../../src/web/web_client.js';

describe('setDefaultBaseUrls', () => {
  afterEach(() => {
    setDefaultBaseUrls({});
  });

  it('should set default base Gemini URL', () => {
    setDefaultBaseUrls({geminiUrl: 'https://gemini.google.com'});
    const client = new GoogleGenAI({apiKey: 'constructor_api_key'});
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
  it('should set default base Vertex URL', () => {
    setDefaultBaseUrls({vertexUrl: 'https://vertexai.googleapis.com'});
    const client = new GoogleGenAI({
      apiKey: 'constructor_api_key',
      vertexai: true,
    });
    expect(client['apiClient'].getBaseUrl()).toBe(
      'https://vertexai.googleapis.com',
    );
  });
  it('should not override base URL if set via httpOptions', () => {
    setDefaultBaseUrls({vertexUrl: 'https://vertexai.googleapis.com'});
    const client = new GoogleGenAI({
      apiKey: 'constructor_api_key',
      httpOptions: {baseUrl: 'https://gemini.google.com'},
    });
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
});
