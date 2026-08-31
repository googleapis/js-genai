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

async function abortStreamingFromMLDev() {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const abortController = new AbortController();
  const abortSignal = abortController.signal;
  const response = await ai.models.generateContentStream({
    model: MODEL_FLASH_LITE,
    contents: 'Tell me a story in 300 words?',
    config: {
      abortSignal: abortSignal,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    console.debug(text);
    abortController.abort();
  }
}

async function abortStreamingFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const abortController = new AbortController();
  const abortSignal = abortController.signal;
  const response = await ai.models.generateContentStream({
    model: MODEL_FLASH_LITE,
    contents: 'Tell me a story in 300 words?',
    config: {
      abortSignal: abortSignal,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    console.debug(text);
    abortController.abort();
  }
}

async function main() {
  const handleAbortError = (e: unknown) => {
    if (
      e instanceof Error &&
      (e.name === 'AbortError' || e.message.toLowerCase().includes('abort'))
    ) {
      console.log('got expected abort error:', e.message);
    } else {
      throw e;
    }
  };
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await abortStreamingFromVertexAI().catch(handleAbortError);
  } else {
    await abortStreamingFromMLDev().catch(handleAbortError);
  }
}

main();
