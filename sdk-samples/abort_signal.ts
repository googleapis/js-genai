/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function abortStreaming() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  const abortController = new AbortController();
  const abortSignal = abortController.signal;
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: 'Tell me a stroy in 300 words?',
    config: {
      abortSignal: abortSignal,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    console.debug(text);
    abortController.abort();
  }
}

async function main() {
  await abortStreaming().catch((e) =>
    console.error('got expected abort error', e),
  );
}

main();
