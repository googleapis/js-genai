/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BrowserUploader} from '../../../src/web/_browser_uploader';
import {GoogleGenAI} from '../../../src/web/web_client';

describe('Client', () => {
  it('should not initialize without any options', () => {
    expect(() => new GoogleGenAI({})).toThrowError(
      'An API Key must be set when running in a browser',
    );
  });
  it('should not allow project or location in constructor', () => {
    expect(() => {
      new GoogleGenAI({
        apiKey: 'constructor_api_key',
        vertexai: true,
        project: 'constructor_project',
        location: 'constructor_location',
      });
    }).toThrowError(
      'Vertex AI project based authentication is not supported on browser runtimes. Please do not provide a project or location.',
    );
  });
  it('should set uploader by default', () => {
    const client = new GoogleGenAI({apiKey: 'constructor_api_key'});
    expect(client['apiClient'].clientOptions.uploader).toBeInstanceOf(
      BrowserUploader,
    );
  });
  it('should set default base Gemini URL', () => {
    const client = new GoogleGenAI({apiKey: 'constructor_api_key'});
    client.setDefaultBaseUrls({geminiUrl: 'https://gemini.google.com'});
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
  it('should set default base Vertex URL', () => {
    const client = new GoogleGenAI({
      apiKey: 'constructor_api_key',
      vertexai: true,
    });
    client.setDefaultBaseUrls({vertexUrl: 'https://vertexai.googleapis.com'});
    expect(client['apiClient'].getBaseUrl()).toBe(
      'https://vertexai.googleapis.com',
    );
  });
  it('should not override base URL if set via httpOptions', () => {
    const client = new GoogleGenAI({
      apiKey: 'constructor_api_key',
      httpOptions: {baseUrl: 'https://gemini.google.com'},
    });
    client.setDefaultBaseUrls({vertexUrl: 'https://vertexai.googleapis.com'});
    expect(client['apiClient'].getBaseUrl()).toBe('https://gemini.google.com');
  });
});
