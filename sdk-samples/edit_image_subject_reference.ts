/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  GoogleGenAI,
  SubjectReferenceImage,
  SubjectReferenceType,
} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function editImageSubjectReferenceFromVertexAI() {
  // Only Vertex AI is currently supported.
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  // Generate an image first.
  const generatedImagesResponse = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt:
      'A logo with the letters "SERN" in a futuristic font with a white background',
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
  const subjectReferenceImage = new SubjectReferenceImage();
  subjectReferenceImage.referenceId = 1;
  subjectReferenceImage.referenceImage =
    generatedImagesResponse?.generatedImages?.[0]?.image;
  subjectReferenceImage.config = {
    subjectType: SubjectReferenceType.SUBJECT_TYPE_PRODUCT,
    subjectDescription: 'Product logo',
  };
  const editImageResponse = await ai.models.editImage({
    model: 'imagen-3.0-capability-001',
    prompt:
      'Generate an image containing a mug with the product logo [1] visible on the side of the mug.',
    referenceImages: [subjectReferenceImage],
    config: {
      includeRaiReason: true,
      outputMimeType: 'image/jpeg',
    },
  });

  console.debug(editImageResponse?.generatedImages?.[0]?.image?.imageBytes);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await editImageSubjectReferenceFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    console.error('Editing an image is not supported in Gemini Developer API.');
  }
}

main();
