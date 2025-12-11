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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  console.log(
    '[Interactions] Start interactions multimodal input text and image',
  );

  // Load and encode the image
  const imagePath = path.join(__dirname, '../car.png');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    input: [
      {
        type: 'text',
        text: 'What is this landmark?',
      },
      {
        type: 'image',
        data: base64Image,
        mime_type: 'image/png',
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
            text: 'What is this landmark?',
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image,
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
