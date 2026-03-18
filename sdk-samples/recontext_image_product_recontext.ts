/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function recontextImageProductRecontextFromVertexAI() {
  // Only Vertex AI is currently supported.
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const productImage = {
    productImage: {
      gcsUri: 'gs://genai-sdk-tests/inputs/images/backpack1.png',
    },
  };

  const recontextImageResponse = await ai.models.recontextImage({
    model: 'imagen-product-recontext-preview-06-30',
    source: {
      prompt: 'On a school desk.',
      productImages: [productImage],
    },
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
    },
  });

  console.debug(
    recontextImageResponse?.generatedImages?.[0]?.image?.imageBytes,
  );
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await recontextImageProductRecontextFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    console.error(
      'Product recontext is not supported in Gemini Developer API.',
    );
  }
}

main();
