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
    // Only 002 models + flash 1.5 8b models are enabled with log probs option.
    model: 'gemini-1.5-flash-002',
    contents: 'Hello!',
    config: {
      responseLogprobs: true,
    },
  });

  console.debug(JSON.stringify(response));
}

async function generateContentFromVertexAI() {
  const client = new NodeClient({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await client.models.generateContent({
    // Only 002 models + flash 1.5 8b models are enabled with log probs option.
    model: 'gemini-1.5-flash-002',
    contents: 'Hello!',
    config: {
      responseLogprobs: true,
    },
  });

  console.debug(JSON.stringify(response));
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI().catch(
        (e) => console.error('got error', e),
    );
  } else {
    await generateContentFromMLDev().catch(
        (e) => console.error('got error', e),
    );
  }
}

main();
