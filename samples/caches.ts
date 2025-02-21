/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {Part} from '@google/genai';
import {NodeClient} from '@google/genai/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createCacheFromMLDev() {
  // TODO: b/377544962 - Add example after file upload is supported.
}

async function createCacheFromVertexAI() {
  const client = new NodeClient({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });

  const cachedContent1: Part = {
    fileData: {
      fileUri: 'gs://cloud-samples-data/generative-ai/pdf/2403.05530.pdf',
      mimeType: 'application/pdf',
    },
  };

  const cachedContent2: Part = {
    fileData: {
      fileUri: 'gs://cloud-samples-data/generative-ai/pdf/2312.11805v3.pdf',
      mimeType: 'application/pdf',
    },
  };

  const cache = await client.caches.create({
    model: 'gemini-1.5-pro-002',
    config: {contents: [cachedContent1, cachedContent2]},
  });

  console.debug(JSON.stringify(cache));
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await createCacheFromVertexAI().catch((e) => console.error('got error', e));
  } else {
    await createCacheFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
