/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents: 'What is the current stock price for GOOGL?',
    config: {
      tools: [{googleSearch: {}}],
      toolConfig: {
        retrievalConfig: {
          latLng: {latitude: 37.7749, longitude: -122.4194},
        },
      },
    },
  });

  console.debug(response!.candidates![0]!.content);
}

async function generateContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents: 'What is the current stock price for GOOGL?',
    config: {
      tools: [{googleSearch: {}}],
      toolConfig: {
        retrievalConfig: {
          latLng: {latitude: 37.7749, longitude: -122.4194},
        },
      },
    },
  });

  console.debug(response!.candidates![0].content!);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI();
  } else {
    await generateContentFromMLDev();
  }
}

main();
