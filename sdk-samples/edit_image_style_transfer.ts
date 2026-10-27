/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, StyleReferenceImage} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function editImageStyleReferenceFromVertexAI() {
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
    prompt: 'A starry night sky painted with watercolors',
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

  // Edit the generated image.
  const styleReferenceImage = new StyleReferenceImage();
  styleReferenceImage.referenceId = 1;
  styleReferenceImage.referenceImage =
    generatedImagesResponse?.generatedImages?.[0]?.image;
  styleReferenceImage.config = {
    styleDescription: 'Watercolor',
  };
  const editImageResponse = await ai.models.editImage({
    model: 'imagen-3.0-capability-001',
    prompt:
      'Generate an image in the style of [1] based on the following caption: A church in the mountain.',
    referenceImages: [styleReferenceImage],
    config: {
      includeRaiReason: true,
      outputMimeType: 'image/jpeg',
    },
  });

  console.debug(editImageResponse?.generatedImages?.[0]?.image?.imageBytes);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    try {
      await editImageStyleReferenceFromVertexAI();
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
    console.error('Editing an image is not supported in Gemini Developer API.');
  }
}

main();
