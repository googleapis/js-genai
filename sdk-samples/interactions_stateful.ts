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

  // Start the conversation
  console.log('User: What are the three largest cities in Spain?');
  const response1 = await ai.interactions.create({
    model: MODEL_FLASH_LITE,
    input: 'What are the three largest cities in Spain?',
  });
  console.log('Model: ', response1);

  // Continue the conversation using the previous interaction ID
  console.log('\nUser: What is the most famous landmark in the second one?');
  const response2 = await ai.interactions.create({
    model: MODEL_FLASH_LITE,
    input: 'What is the most famous landmark in the second one?',
    previous_interaction_id: response1.id,
  });
  console.log('Model: ', response2);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Interactions API is not yet supported on Vertex');
  } else {
    await createInteractionsFromMLDev();
  }
}

main();
