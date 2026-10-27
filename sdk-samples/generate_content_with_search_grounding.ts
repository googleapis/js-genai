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
    contents:
      'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.',
    config: {
      tools: [{googleSearch: {}}],
    },
  });
  console.debug(JSON.stringify(response?.candidates?.[0]?.groundingMetadata));
}

async function generateContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents:
      'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.',
    config: {
      tools: [{googleSearch: {}}],
    },
  });
  console.debug(JSON.stringify(response?.candidates?.[0]?.groundingMetadata));
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI();
  } else {
    await generateContentFromMLDev();
  }
}

main();
