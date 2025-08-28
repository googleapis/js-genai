/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ContentListUnion, createPartFromUri, GoogleGenAI} from '@google/genai';
import * as fs from 'fs/promises';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;
const INPUT_IMAGE_PATH = process.env.INPUT_IMAGE_PATH;

async function generateContentFromFileUploadMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const contents: ContentListUnion = [
    'Add this logo as the label on a soda bottle, make it realistic',
  ];

  const file = await ai.files.upload({
    file: INPUT_IMAGE_PATH!,
  });

  contents.push(createPartFromUri(file.uri!, file.mimeType!));

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: contents,
    config: {
      responseModalities: ['image', 'text'],
      responseMimeType: 'text/plain',
    },
  });

  let imageCount = 0;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('Response did not include parts');
  }

  for (const part of parts) {
    // Based on the part type, either log the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      imageCount++;
      const buffer = Buffer.from(part.inlineData.data!, 'base64');
      const extension = mimeTypeToExtension(part.inlineData.mimeType);
      const filename = `generated-image-${imageCount}${extension}`;
      await fs.writeFile(filename, buffer);
      console.log(`Image saved as ${filename}`);
    }
  }
}

function mimeTypeToExtension(mimeType: string | undefined): string {
  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpeg';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '.blob';
  }
}

async function main() {
  if (!INPUT_IMAGE_PATH) {
    throw new Error('The INPUT_IMAGE_PATH environment variable must be set');
  }
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    throw new Error('Vertex AI is not supported for this sample.');
  } else {
    await generateContentFromFileUploadMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
