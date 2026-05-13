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

  interaction.steps.forEach((step, index) => {
    if (step.type === 'model_output') {
      step.content?.forEach((content) => {
        if (content.type === 'audio') {
          console.log(`Audio output in step ${index + 1}:`, content);
        } else {
          console.log(`Output in step ${index + 1}:`, content);
        }
      });
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
