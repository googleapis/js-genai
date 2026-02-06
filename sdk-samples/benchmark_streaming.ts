/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, Modality} from '@google/genai';
import {performance} from 'node:perf_hooks';

/**
 * This benchmark measures the performance of streaming responses,
 * particularly for large payloads like images.
 *
 * It compares the Interactions API with the GenerateContent API.
 */

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ||
    process.env.GCLOUD_API_KEY;

const client = new GoogleGenAI({
  apiKey: apiKey,
});

const warmUp = async () => {
  console.log('Warming up...');
  try {
    await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'A cat',
      config: {
        responseModalities: [Modality.TEXT],
      },
    });
    console.log('Warm up done.');
  } catch (e) {
    console.warn(
        'Warm up failed (this is expected if no valid API key is set):',
        e.message);
  }
};

const interactionsWithStreaming = async () => {
  const start = performance.now();
  const stream = await client.interactions.create({
    stream: true,
    model: 'gemini-3-pro-image-preview',
    input: 'A cat',
    response_modalities: ['image', 'text'],
    generation_config: {
      thinking_summaries: 'auto',
      image_config: {aspect_ratio: '1:1', image_size: '4K'},
    },
  });

  let bytes = 0;
  for await (const event of stream) {
    if (event.event_type === 'content.delta' && event.delta?.type === 'image') {
      bytes += event.delta.data?.length ?? 0;
    }
  }
  const duration = performance.now() - start;
  console.log(
      `  Interactions: ${(duration / 1000).toFixed(1)}s (${bytes} bytes)`);
  return duration;
};

const generateContentWithStreaming = async () => {
  const start = performance.now();
  const stream = await client.models.generateContentStream({
    model: 'gemini-3-pro-image-preview',
    contents: 'A cat',
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      thinkingConfig: {includeThoughts: true},
      imageConfig: {aspectRatio: '1:1', imageSize: '4K'},
    },
  });

  let bytes = 0;
  for await (const chunk of stream) {
    for (const cand of chunk.candidates ?? []) {
      for (const part of cand.content?.parts ?? []) {
        if (part.inlineData) {
          bytes += part.inlineData.data?.length ?? 0;
        }
      }
    }
  }
  const duration = performance.now() - start;
  console.log(
      `  GenerateContent: ${(duration / 1000).toFixed(1)}s (${bytes} bytes)`);
  return duration;
};

async function runBenchmark() {
  if (!apiKey) {
    console.error(
        'ERROR: GEMINI_API_KEY, GOOGLE_API_KEY, or GCLOUD_API_KEY environment variable is required.');
    process.exit(1);
  }

  await warmUp();

  const runs = 3;
  const interactionsResults: number[] = [];
  const generateContentResults: number[] = [];

  for (let i = 0; i < runs; i += 1) {
    console.log(`Run ${i + 1}/${runs}...`);

    const intTime = await interactionsWithStreaming();
    interactionsResults.push(intTime);

    const genTime = await generateContentWithStreaming();
    generateContentResults.push(genTime);
  }

  const avg = (arr: number[]) =>
      (arr.reduce((a, b) => a + b, 0) / arr.length / 1000).toFixed(1);

  console.log('\nResults Summary:');
  console.log(`Interactions API (Streaming) AVG: ${avg(interactionsResults)}s`);
  console.log(
      `GenerateContent API (Streaming) AVG: ${avg(generateContentResults)}s`);
}

runBenchmark().catch(console.error);
