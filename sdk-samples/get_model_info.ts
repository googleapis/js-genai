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

function configureClient(): GoogleGenAI {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    return new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });
  }
  return new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
}

async function main() {
  const ai = configureClient();
  try {
    const modelInfo = await ai.models.get({model: MODEL_FLASH_LITE});
    console.log(modelInfo);
  } catch (e) {
    console.error('got error', e);
  }
}

main();
