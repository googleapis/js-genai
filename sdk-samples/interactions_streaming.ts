/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });
  const stream = await ai.interactions.create({
    model: MODEL_FLASH_LITE,
    input: 'Tell me a story',
    stream: true,
  });

  for await (const event of stream) {
    switch (event.event_type) {
      case 'step.delta':
        switch (event.delta?.type) {
          case 'text':
            process.stdout.write(event.delta.text ?? '');
            break;
        }
    }
  }

  process.stdout.write('\n');
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Interactions API is not yet supported on Vertex');
  } else {
    await createInteractionsFromMLDev();
  }
}

main();
