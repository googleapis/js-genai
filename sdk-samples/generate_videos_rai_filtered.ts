/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentFromVertexAI() {
  const location =
    GOOGLE_CLOUD_LOCATION && GOOGLE_CLOUD_LOCATION !== 'global'
      ? GOOGLE_CLOUD_LOCATION
      : 'us-central1';
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location,
  });
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    source: {
      prompt: 'Man with a dog',
    },
    config: {
      personGeneration: 'dont_allow',
    },
  });

  while (!operation.done) {
    console.log('Waiting for completion');
    await delay(10000);
    operation = await ai.operations.get({operation: operation});
  }

  const videos = operation.response?.generatedVideos;
  if (videos === undefined || videos.length === 0) {
    console.log(
      `No videos generated due to: ${JSON.stringify(
        operation.response?.raiMediaFilteredReasons,
        null,
        2,
      )}`,
    );
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    try {
      await generateContentFromVertexAI();
    } catch (e: unknown) {
      if ((e as {status?: number})?.status === 429) {
        console.warn(
          'Skipping video RAI filtered test due to rate limit / quota (429).',
        );
        return;
      }
      throw e;
    }
  } else {
    console.log('personGeneration filtering is only supported on Vertex AI.');
  }
}

main();
