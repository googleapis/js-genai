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

async function setApiVersionForMLDev() {
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY, apiVersion: 'v1alpha'});
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Tell me a stroy in 300 words?',
  });
  console.log('text response: ', response.text);
}

async function setApiVersionForVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
    apiVersion: 'v1',
  });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Tell me a stroy in 300 words?',
  });

  console.log('text response: ', response.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await setApiVersionForVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await setApiVersionForMLDev().catch((e) => console.error('got error', e));
  }
}

main();
