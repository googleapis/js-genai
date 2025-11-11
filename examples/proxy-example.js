/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example demonstrating how to use proxy support with the Google GenAI SDK
 *
 * This example shows three different ways to configure proxy settings:
 * 1. Using environment variables (automatic)
 * 2. Using a proxy URL string (programmatic)
 * 3. Using a proxy configuration object (programmatic with advanced options)
 */

// Example 1: Using environment variables (automatic configuration)
// Set these before running your application:
// export HTTP_PROXY=http://proxy.example.com:8080
// export HTTPS_PROXY=https://proxy.example.com:8080
// export NO_PROXY=localhost,127.0.0.1,.local

import {GoogleGenAI} from '@google/genai';

// When environment variables are set, the SDK will automatically use them
const aiWithEnvProxy = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Example 2: Using a proxy URL string (programmatic)
const aiWithProxyUrl = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    // Proxy URL with authentication
    proxy: 'http://username:password@proxy.example.com:8080',
  },
});

// Example 3: Using a proxy configuration object (programmatic with advanced options)
const aiWithProxyConfig = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    proxy: {
      host: 'proxy.example.com',
      port: 8080,
      protocol: 'http',
      auth: 'username:password', // Optional
    },
  },
});

// Example 4: Explicitly disable proxy (even if environment variables are set)
const aiWithoutProxy = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    proxy: false, // This will ignore environment variables
  },
});

// Example 5: Using proxy with Vertex AI
const vertexAiWithProxy = new GoogleGenAI({
  vertexai: true,
  project: 'your-project-id',
  location: 'us-central1',
  httpOptions: {
    proxy: 'http://proxy.example.com:8080',
  },
});

// Using the client with proxy
async function generateContentWithProxy() {
  try {
    const model = aiWithProxyUrl.models.get({model: 'gemini-2.0-flash-exp'});
    const response = await model.generateContent({
      contents: [{role: 'user', parts: [{text: 'Hello! How are you?'}]}],
    });

    console.log('Response:', response.text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Uncomment to run the example
// generateContentWithProxy();

export {
  aiWithEnvProxy,
  aiWithProxyUrl,
  aiWithProxyConfig,
  aiWithoutProxy,
  vertexAiWithProxy,
};
