/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GOOGLE_API_KEY});

  const zodSchema = z.object({
    ingredients: z.array(z.string()).describe('Ingredients of the recipe'),
    timeItTook: z.string().describe('Time it took to cook the recipe'),
    recipeName: z.string().describe('Name of the recipe'),
  });

  const schemaToBeProcessed = zodToJsonSchema(zodSchema) as Record<
    string,
    unknown
  >;
  schemaToBeProcessed['propertyOrdering'] = [
    'timeItTook',
    'recipeName',
    'ingredients',
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'List 3 popular cookie recipes.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: schemaToBeProcessed,
    },
  });

  console.debug(response.text);
}

async function generateContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const zodSchema = z.object({
    ingredients: z.array(z.string()).describe('Ingredients of the recipe'),
    timeItTook: z.string().describe('Time it took to cook the recipe'),
    recipeName: z.string().describe('Name of the recipe'),
  });

  const schemaToBeProcessed = zodToJsonSchema(zodSchema) as Record<
    string,
    unknown
  >;
  schemaToBeProcessed['propertyOrdering'] = [
    'timeItTook',
    'recipeName',
    'ingredients',
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'List 3 popular cookie recipes.',
    config: {
      responseMimeType: 'application/json',
      responseSchema: schemaToBeProcessed,
    },
  });

  console.debug(response.text);
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
