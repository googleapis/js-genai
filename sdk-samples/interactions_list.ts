/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function listInteractionsFromVertexAI() {
  const ai = new GoogleGenAI({});
  console.log('Calling interactions.list()...');
  const response = await ai.interactions.list();
  const interactions =
    'interaction_metadatas' in response && response.interaction_metadatas
      ? response.interaction_metadatas
      : [];
  console.log(`Found ${interactions.length} interaction(s):`);
  for (const item of interactions) {
    console.log(
      `- ID: ${item.id}, Status: ${item.status}, Created: ${item.created}`,
    );
  }
}

async function main() {
  if (
    !GOOGLE_GENAI_USE_VERTEXAI ||
    GOOGLE_GENAI_USE_VERTEXAI.toLowerCase() !== 'true'
  ) {
    console.log(
      'Interactions list is only supported on Vertex AI. ' +
        'Please set GOOGLE_GENAI_USE_VERTEXAI=true.',
    );
    return;
  }

  try {
    await listInteractionsFromVertexAI();
  } catch (e) {
    console.error('Failed:', e);
  }
}

main();
