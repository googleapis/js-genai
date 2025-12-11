/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, Interactions} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  const conversationHistory: Interactions.InteractionCreateParams['input'] = [
    {
      type: 'text',
      text: 'What are the three largest cities in Spain?',
    },
  ];

  console.log('User: What are the three largest cities in Spain?');
  const response1 = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    store: false,
    input: conversationHistory,
  });
  console.log('Model: ', response1);

  if (response1.outputs) {
    conversationHistory.push(...response1.outputs);
  }
  conversationHistory.push({
    type: 'text',
    text: 'What is the most famous landmark in the second one?',
  });

  console.log('\nUser: What is the most famous landmark in the second one?');
  const response2 = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    store: false,
    input: conversationHistory,
  });
  console.log('Model: ', response2);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    throw new Error('Interactions API is not yet supported on Vertex');
  } else {
    await createInteractionsFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
