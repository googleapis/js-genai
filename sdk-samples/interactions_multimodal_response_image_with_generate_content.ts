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
  console.log('[Interactions] Start interactions multimodal response image');

  const interaction = await ai.interactions.create({
    model: 'gemini-2.5-flash-image-preview',
    response_modalities: ['image'],
    input: 'Generate an image of a futuristic cityscape at sunset.',
  });

  interaction.outputs?.forEach((output, index) => {
    if (output.type === 'image') {
      console.log(`Image output ${index + 1}:`, output);
    } else {
      console.log(`Output ${index + 1}: ${output}`);
    }
  });

  console.log('[Generate Content] Start generate content');
  const generateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Generate an image of a futuristic cityscape at sunset.',
          },
        ],
      },
    ],
  });
  console.debug(
    'Generate Content response text: ',
    generateContentResponse.text,
  );
  console.debug(
    'Generate Content response data: ',
    generateContentResponse.data,
  );
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
