/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function throwApiErrorForMLDev() {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const response = await ai.models.generateContent({
    model: 'non-existent-model',
    contents: 'Tell me a story in 300 words?',
  });
  console.log('text response: ', response.text);
}

async function throwApiErrorForVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const response = await ai.models.generateContent({
    model: 'non-existent-model',
    contents: 'Tell me a story in 300 words?',
  });

  console.log('text response: ', response.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await throwApiErrorForVertexAI().catch((e) => {
      console.error('error name: ', e.name);
      console.error('error message: ', e.message);
      console.error('error status: ', e.status);
    });
  } else {
    await throwApiErrorForMLDev().catch((e) => {
      console.error('error name: ', e.name);
      console.error('error message: ', e.message);
      console.error('error status: ', e.status);
    });
  }
}

main();
