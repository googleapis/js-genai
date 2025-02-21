/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {Type} from '@google/genai';
import {NodeClient} from '@google/genai/node';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const client = new NodeClient({vertexai: false, apiKey: GOOGLE_API_KEY});

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'List a popular cookie recipe.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          'recipeName': {
            type: Type.STRING,
            description: 'Name of the recipe',
            nullable: false,
          },
        },
        required: ['recipeName'],
      },
    },
  });

  console.debug(response.text());
}

async function generateContentFromVertexAI() {
  const client = new NodeClient({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'List a popular cookie recipe.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          'recipeName': {
            type: Type.STRING,
            description: 'Name of the recipe',
            nullable: false,
          },
        },
        required: ['recipeName'],
      },
    },
  });

  console.debug(response.text());
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await generateContentFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
