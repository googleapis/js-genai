/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function embedContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: 'Hello world!',
  });

  console.debug(JSON.stringify(response));
}

async function embedContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const textResponse = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: 'Hello world!',
  });

  const multimodalResponse = await ai.models.embedContent({
    model: 'gemini-embedding-2-exp-11-2025',
    contents: [
      {
        parts: [
          {text: 'Similar things to the following image:'},
          {
            fileData: {
              mimeType: 'image/png',
              fileUri:
                'gs://cloud-samples-data/generative-ai/image/a-man-and-a-dog.png',
            },
          },
        ],
      },
    ],
  });

  console.debug(JSON.stringify(textResponse));
  console.debug(JSON.stringify(multimodalResponse));
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await embedContentFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await embedContentFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
