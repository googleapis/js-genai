/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai/node';
import {GoogleAuth} from 'google-auth-library';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function registerFilesMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // auth: {} will use application default credentials to access GCS.
  // Note: registerFiles is only supported by the Gemini Developer API (MLDev), not Vertex AI.
  const auth = new GoogleAuth({
    scopes:
        'https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/devstorage.read_only',
  });
  console.log(auth);

  const response = await ai.files.registerFiles({
    auth: auth,
    // This file is publicly accessible and could skip the registration step,
    // but we include it here since it can be used from any project.
    uris: ['gs://generativeai-downloads/data/jetpack.png'],
  });

  const file = response.files?.[0];
  if (!file) {
    throw new Error('No files were registered.');
  }

  console.log('Registered file: ', file);

  // Add the file to the contents.
  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      'can you summarize this file?',
      {fileData: {fileUri: file.uri}},
    ],
  });

  console.log(result.text);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('registerFiles is only supported by the Gemini Developer API (MLDev), not Vertex AI.');
    return;
  } else {
    await registerFilesMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
