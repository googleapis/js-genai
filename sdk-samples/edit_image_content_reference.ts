/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ContentReferenceImage,
  GoogleGenAI,
  StyleReferenceImage,
} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function editImageContentReferenceFromVertexAI() {
  // Only Vertex AI is currently supported.
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const contentReferenceImage = new ContentReferenceImage();
  contentReferenceImage.referenceId = 1;
  contentReferenceImage.referenceImage = {
    gcsUri: 'gs://genai-sdk-tests/inputs/images/dog.jpg',
  };

  const styleReferenceImage = new StyleReferenceImage();
  styleReferenceImage.referenceId = 2;
  styleReferenceImage.referenceImage = {
    gcsUri: 'gs://genai-sdk-tests/inputs/images/cyberpunk.jpg',
  };
  styleReferenceImage.config = {
    styleDescription: 'cyberpunk style',
  };

  const editImageResponse = await ai.models.editImage({
    model: 'imagen-4.0-ingredients-preview',
    prompt:
      'Dog in [1] sleeping on the ground at the bottom of the image with the cyberpunk city landscape in [2] in the background visible on the side of the mug.',
    referenceImages: [contentReferenceImage, styleReferenceImage],
    config: {
      includeRaiReason: true,
      outputMimeType: 'image/jpeg',
    },
  });

  console.debug(editImageResponse?.generatedImages?.[0]?.image?.imageBytes);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await editImageContentReferenceFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    console.error('Editing an image is not supported in Gemini Developer API.');
  }
}

main();
