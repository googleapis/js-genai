/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    apiVersion: 'v1alpha',
  });
  const response = await ai.interactions.create({
    model: 'gemini-3-pro-preview',
    input: 'What is the weather in New York?',
    tools: [
      {
        type: 'function',
        name: 'get_weather',
        description: 'Get the current weather in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g. San Francisco, CA',
            },
          },
          required: ['location'],
        },
      },
    ],
    response_format: {
      type: 'object',
      properties: {
        location: {type: 'string'},
        temperature: {type: 'number'},
        condition: {type: 'string'},
        recommendation: {type: 'string'},
      },
      required: ['location', 'temperature', 'condition', 'recommendation'],
    },
    response_mime_type: 'application/json',
  });

  console.debug(response);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    throw new Error(
      'This version of the GenAI SDK does not support Vertex AI API for interactions.',
    );
  } else {
    await createInteractionsFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
