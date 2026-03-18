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
  const interaction = await ai.interactions.create({
    model: 'gemini-2.5-flash-preview-tts',
    input: 'Say cheerfully: Have a wonderful day!',
    response_modalities: ['audio'],
    generation_config: {
      speech_config: [{voice: 'achernar', language: 'en-US'}],
    },
  });

  interaction.outputs?.forEach((output, index) => {
    if (output.type === 'audio') {
      console.log(`Audio output ${index + 1}:`, output);
    } else {
      console.log(`Output ${index + 1}: ${output}`);
    }
  });
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
