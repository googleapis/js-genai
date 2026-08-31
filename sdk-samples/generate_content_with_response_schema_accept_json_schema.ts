/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

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
    model: MODEL_FLASH_LITE,
    contents: 'List 3 popular cookie recipes.',
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: schemaToBeProcessed,
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
    model: MODEL_FLASH_LITE,
    contents: 'List 3 popular cookie recipes.',
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: schemaToBeProcessed,
    },
  });

  console.debug(response.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI();
  } else {
    await generateContentFromMLDev();
  }
}

main();
