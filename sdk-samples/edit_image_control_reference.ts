/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ControlReferenceImage,
  ControlReferenceType,
  GoogleGenAI,
} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function editImageControlReferenceFromVertexAI() {
  // Only Vertex AI is currently supported.
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  // Generate an image first.
  const generatedImagesResponse = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: 'A square, circle, and triangle with a white background',
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
  const controlReferenceImage = new ControlReferenceImage();
  controlReferenceImage.referenceId = 1;
  controlReferenceImage.referenceImage =
    generatedImagesResponse?.generatedImages?.[0]?.image;
  controlReferenceImage.config = {
    controlType: ControlReferenceType.CONTROL_TYPE_SCRIBBLE,
    enableControlImageComputation: true,
  };
  const editImageResponse = await ai.models.editImage({
    model: 'imagen-3.0-capability-001',
    prompt: 'Change the colors aligning with the scribble map [1].',
    referenceImages: [controlReferenceImage],
    config: {
      includeRaiReason: true,
      outputMimeType: 'image/jpeg',
    },
  });

  console.debug(editImageResponse?.generatedImages?.[0]?.image?.imageBytes);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await editImageControlReferenceFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    console.error('Editing an image is not supported in Gemini Developer API.');
  }
}

main();
