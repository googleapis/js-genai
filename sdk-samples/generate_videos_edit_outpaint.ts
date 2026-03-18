/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, VideoGenerationMaskMode} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateVideosEditOutpaintFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-preview',
    source: {
      prompt: 'A mountain landscape',
      video: {
        uri: 'gs://genai-sdk-tests/inputs/videos/editing_demo.mp4',
      },
    },
    config: {
      outputGcsUri: 'gs://genai-sdk-tests/outputs/videos',
      aspectRatio: '16:9',
      mask: {
        image: {
          gcsUri: 'gs://genai-sdk-tests/inputs/videos/video_outpaint_mask.png',
          mimeType: 'image/png',
        },
        maskMode: VideoGenerationMaskMode.OUTPAINT,
      },
    },
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
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateVideosEditOutpaintFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    console.error('Editing a video is not supported for Gemini Developer API.');
  }
}

main();
