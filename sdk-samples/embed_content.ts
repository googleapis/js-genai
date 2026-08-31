/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {MODEL_EMBEDDING} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function embedContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const response = await ai.models.embedContent({
    model: MODEL_EMBEDDING,
    contents: 'Hello world!',
  });

  console.debug(JSON.stringify(response));
}

async function embedContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION || 'us-central1',
  });

  const textResponse = await ai.models.embedContent({
    model: 'text-embedding-005',
    contents: 'Hello world!',
  });

  console.debug(JSON.stringify(textResponse));
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await embedContentFromVertexAI();
  } else {
    await embedContentFromMLDev();
  }
}

main();
