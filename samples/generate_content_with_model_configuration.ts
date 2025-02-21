/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {NodeClient} from '@google/genai/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const client = new NodeClient({vertexai: false, apiKey: GEMINI_API_KEY});

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Tell me a story about a magic backpack.',
    config: {
      candidateCount: 1,
      stopSequences: ['x'],
      maxOutputTokens: 20,
      temperature: 1.0,
    },
  });

  console.debug(response.text());
}

async function generateContentFromVertexAI() {
  const client = new NodeClient({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Tell me a story about a magic backpack.',
    config: {
      candidateCount: 1,
      stopSequences: ['x'],
      maxOutputTokens: 20,
      temperature: 1.0,
    },
  });

  console.debug(response.text());
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await generateContentFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
