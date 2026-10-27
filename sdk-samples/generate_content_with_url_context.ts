/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents: 'What are the top headlines on https://news.google.com',
    config: {
      tools: [
        {
          urlContext: {},
        },
      ],
    },
  });
  console.debug(response.text);
  if (response.candidates) {
    console.debug(response.candidates[0].urlContextMetadata);
  }
}

async function generateContentFromVertexAI() {
  console.log("urlContext isn't supported on Vertex AI");
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI();
  } else {
    await generateContentFromMLDev();
  }
}

main();
