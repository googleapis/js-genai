/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // Load and encode the audio
  const audioUrl =
    'https://storage.googleapis.com/generativeai-downloads/data/Apollo-11_Day-01-Highlights-10s.mp3';
  const audioResponse = await fetch(audioUrl);
  const arrayBuffer = await audioResponse.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString('base64');

  const response = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    input: [
      {
        type: 'text',
        text: 'What does this audio say?',
      },
      {
        type: 'audio',
        data: base64Audio,
        mime_type: 'audio/mpeg',
      },
    ],
  });

  console.debug(response);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Interactions API is not yet supported on Vertex');
  } else {
    await createInteractionsFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
