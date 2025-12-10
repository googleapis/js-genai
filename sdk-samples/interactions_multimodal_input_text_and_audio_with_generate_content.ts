/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // Load and encode the audio
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const audioPath = path.join(__dirname, '../sample_audio.mp3');
  const audioBuffer = fs.readFileSync(audioPath);
  const base64Audio = audioBuffer.toString('base64');

  console.log(
    '[Interactions] Start interactions multimodal input text and audio',
  );

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

  console.log('[Generate Content] Start generate content');

  const generateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'What does this audio say?',
          },
          {
            inlineData: {
              mimeType: 'audio/mpeg',
              data: base64Audio,
            },
          },
        ],
      },
    ],
  });

  console.debug(generateContentResponse.text);
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
