/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {setDefaultBaseUrls} from '../../../src/_base_url.js';
import {GoogleGenAI} from '../../../src/node/node_client.js';

describe('setDefaultBaseUrls', () => {
  afterEach(() => {
    delete process.env['GOOGLE_GEMINI_BASE_URL'];
    delete process.env['GOOGLE_VERTEX_BASE_URL'];

    setDefaultBaseUrls({});
  });

  it('should set default base Gemini URL', () => {
    setDefaultBaseUrls({geminiUrl: 'https://gemini.google.com'});
    const client = new GoogleGenAI({});
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
  it('should set default base Vertex URL', () => {
    setDefaultBaseUrls({vertexUrl: 'https://vertexai.googleapis.com'});
    const client = new GoogleGenAI({vertexai: true});
    expect(client['apiClient'].getBaseUrl()).toBe(
      'https://vertexai.googleapis.com',
    );
  });
  it('should set default base Gemini URL from environment variables', () => {
    process.env['GOOGLE_GEMINI_BASE_URL'] = 'https://gemini.google.com';
    const client = new GoogleGenAI({});
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
  it('should set default base Vertex URL from environment variables', () => {
    process.env['GOOGLE_VERTEX_BASE_URL'] = 'https://vertexai.googleapis.com';
    const client = new GoogleGenAI({vertexai: true});
    expect(client['apiClient'].getBaseUrl()).toBe(
      'https://vertexai.googleapis.com',
    );
  });
  it('should not override base URL if set via httpOptions', () => {
    setDefaultBaseUrls({vertexUrl: 'https://vertexai.googleapis.com'});
    const client = new GoogleGenAI({
      httpOptions: {baseUrl: 'https://gemini.google.com'},
    });
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
});
