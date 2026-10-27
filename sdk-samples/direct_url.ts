/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, createPartFromUri} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

const uri =
  'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf';

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents: [
      // equivalent to Part.from_uri(file_uri=uri, mime_type="...")
      createPartFromUri(uri, 'application/pdf'),
      'summarize this file',
    ],
  });

  console.log(response.text);
}

async function generateContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const response = await ai.models.generateContent({
    model: MODEL_FLASH_LITE,
    contents: [
      // equivalent to Part.from_uri(file_uri=uri, mime_type="...")
      createPartFromUri(uri, 'application/pdf'),
      'summarize this file',
    ],
  });

  console.log(response.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI();
  } else {
    await generateContentFromMLDev();
  }
}

main();
