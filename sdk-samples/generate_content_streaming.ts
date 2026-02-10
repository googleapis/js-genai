/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, Modality} from '@google/genai';
import * as fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function generateContentFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-exp',
    contents:
      'Generate a story about a cute baby turtle in a 3d digital art style. For each scene, generate an image.',
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let i = 0;
  for await (const chunk of response) {
    const text = chunk.text;
    const data = chunk.data;
    if (text) {
      console.debug(text);
    } else if (data) {
      const fileName = `generate_content_streaming_image_${i++}.png`;
      console.debug(`Writing response image to file: ${fileName}.`);
      fs.writeFileSync(fileName, data);
    }
  }
}

async function generateContentFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-exp',
    contents:
      'Generate a story about a cute baby turtle in a 3d digital art style. For each scene, generate an image.',
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let i = 0;
  for await (const chunk of response) {
    const text = chunk.text;
    const data = chunk.data;
    if (text) {
      console.debug(text);
    } else if (data) {
      const fileName = `generate_content_streaming_image_${i++}.png`;
      console.debug(`Writing response image to file: ${fileName}.`);
      fs.writeFileSync(fileName, data);
    }
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await generateContentFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await generateContentFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
