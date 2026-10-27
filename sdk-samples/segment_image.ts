/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, SegmentMode} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function segmentImageFromVertexAI() {
  // Only Vertex AI is currently supported.
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location:
      GOOGLE_CLOUD_LOCATION && GOOGLE_CLOUD_LOCATION !== 'global'
        ? GOOGLE_CLOUD_LOCATION
        : 'us-central1',
  });

  // Generate an image first.
  const generatedImagesResponse = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: 'A red skateboard on the ground with a stop sign in the background',
    config: {
      numberOfImages: 1,
      includeRaiReason: true,
      outputMimeType: 'image/jpeg',
    },
  });

  if (!generatedImagesResponse?.generatedImages?.[0]?.image) {
    console.error('Image generation failed.');
    return;
  }

  // Segment the generated image.
  const segmentImageResponse = await ai.models.segmentImage({
    model: 'image-segmentation-001',
    source: {
      image: generatedImagesResponse?.generatedImages?.[0]?.image,
    },
    config: {
      mode: SegmentMode.FOREGROUND,
    },
  });

  console.debug(segmentImageResponse?.generatedMasks?.[0]?.mask?.imageBytes);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    try {
      await segmentImageFromVertexAI();
    } catch (e: unknown) {
      if ((e as {status?: number})?.status === 404) {
        console.warn(
          'Skipping: model not available or deprecated on this Vertex AI project.',
        );
        return;
      }
      throw e;
    }
  } else {
    console.error(
      'Segmenting an image is not supported in Gemini Developer API.',
    );
  }
}

main();
