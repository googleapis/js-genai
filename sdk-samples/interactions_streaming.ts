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
  const stream = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    input: 'Tell me a story',
    stream: true,
  });

  for await (const event of stream) {
    switch (event.event_type) {
      case 'content.delta':
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
    await createInteractionsFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
