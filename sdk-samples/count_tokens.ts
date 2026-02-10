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

async function countTokensFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const response = await ai.models.countTokens({
    model: 'gemini-2.0-flash',
    contents: 'The quick brown fox jumps over the lazy dog.',
  });

  console.debug(JSON.stringify(response));
}

async function countTokensFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  // const response = await ai.models.countTokens({
  //   model: 'gemini-2.0-flash-001',
  //   contents: 'What is your name?',
  // });

  // console.debug(JSON.stringify(response));

  // Count tokens in a simple string
  const result1 = await ai.models.countTokens({
    model: 'gemini-2.0-flash-001',
    contents: 'What is your name?',
  });
  console.debug(JSON.stringify(result1));
  console.log('Input: "What is your name?"');
  console.log(`Total tokens: ${result1.totalTokens}\n`);

  // Count tokens in a longer text
  const longText =
    'The quick brown fox jumps over the lazy dog. This is a sample sentence for tokenization.';
  const result2 = await ai.models.countTokens({
    model: 'gemini-2.0-flash-001',
    contents: longText,
  });
  console.log(`Input: "${longText}"`);
  console.log(`Total tokens: ${result2.totalTokens}\n`);

  // Count tokens with structured content
  const result3 = await ai.models.countTokens({
    model: 'gemini-2.0-flash-001',
    contents: [{role: 'user', parts: [{text: 'Hello, how are you?'}]}],
  });
  console.log('Input: User message "Hello, how are you?"');
  console.log(`Total tokens: ${result3.totalTokens}\n`);

  // Count tokens in a multi-turn conversation
  const result4 = await ai.models.countTokens({
    model: 'gemini-2.0-flash-001',
    contents: [
      {role: 'user', parts: [{text: 'What is the capital of France?'}]},
      {role: 'model', parts: [{text: 'The capital of France is Paris.'}]},
      {role: 'user', parts: [{text: 'What about Spain?'}]},
    ],
  });
  console.log('Input: Multi-turn conversation');
  console.log(`Total tokens: ${result4.totalTokens}\n`);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await countTokensFromVertexAI().catch((e) => console.error('got error', e));
  } else {
    await countTokensFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
