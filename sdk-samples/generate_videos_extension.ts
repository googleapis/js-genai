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

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateVideosFromMLDev() {
  const ai = new GoogleGenAI({
    vertexai: false,
    apiKey: GEMINI_API_KEY,
  });
  let operation1 = await ai.models.generateVideos({
    model: 'veo-3-exp',
    prompt: 'Rain',
    config: {
      numberOfVideos: 1,
    },
  });

  while (!operation1.done) {
    console.log('Waiting for completion');
    await delay(10000);
    operation1 = await ai.operations.get({operation: operation1});
  }

  const videos = operation1.response?.generatedVideos;
  if (videos === undefined || videos.length === 0) {
    throw new Error('No videos generated');
  }

  videos.forEach((video, i) => {
    ai.files.download({
      file: video,
      downloadPath: `video${i}.mp4`,
    });
    console.log('Downloaded video', `video${i}.mp4`);
  });

  let operation2 = await ai.models.generateVideos({
    model: 'veo-3-exp',
    source: {
      prompt: 'Sun',
      video: videos[0].video,
    },
    config: {
      numberOfVideos: 1,
    },
  });

  while (!operation2.done) {
    console.log('Waiting for completion');
    await delay(10000);
    operation2 = await ai.operations.get({operation: operation2});
  }

  const videos2 = operation2.response?.generatedVideos;
  if (videos2 === undefined || videos2.length === 0) {
    throw new Error('No videos generated');
  }

  videos2.forEach((video, i) => {
    ai.files.download({
      file: video,
      downloadPath: `video${i}.mp4`,
    });
    console.log('Downloaded extended video', `video${i}.mp4`);
  });
}

async function generateVideosFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    source: {prompt: 'Man with a dog'},
  });

  while (!operation.done) {
    console.log('Waiting for completion');
    await delay(10000);
    operation = await ai.operations.get({operation: operation});
  }

  const videos = operation.response?.generatedVideos;
  if (videos === undefined || videos.length === 0) {
    throw new Error('No videos generated');
  }

  videos.forEach((video, i) => {
    ai.files.download({
      file: video,
      downloadPath: `video${i}.mp4`,
    });
    console.log('Downloaded video', `video${i}.mp4`);
  });
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateVideosFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await generateVideosFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
