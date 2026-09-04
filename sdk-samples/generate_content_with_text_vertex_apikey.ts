/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    apiKey: GOOGLE_API_KEY,
  });
  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents: 'why is the sky blue?',
  });
  console.debug(response.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    try {
      await generateContentFromVertexAI();
    } catch (e: unknown) {
      const status = (e as {status?: number})?.status;
      if (status === 401 || status === 403) {
        console.warn(
          'Skipping Vertex API key test: provided API key is not enabled for Vertex AI Express.',
        );
        return;
      }
      throw e;
    }
  } else {
    console.log('Test is for Vertex AI API key only.');
  }
}

main();
