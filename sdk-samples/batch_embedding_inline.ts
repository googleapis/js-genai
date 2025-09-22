/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:no-default-export

import {GoogleGenAI} from '@google/genai';

import {JobState} from '../src/types.js';

// Get your API key from  https://aistudio.google.com/app/apikey
// and set it as the GEMINI_API_KEY environment variable.
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    // Use the staging endpoint for testing
    baseUrl: 'https://autopush-generativelanguage.sandbox.googleapis.com',
  },
});

const EMBEDDING_MODEL = 'models/gemini-embedding-001';

async function batchEmbedInline() {
  console.log('--- Batch Embedding with Inline Requests ---');

  // 1. Define the inline requests for embedding
  const inlinedRequests = {
    // Optional: Configure output dimensionality
    // config: { outputDimensionality: 5 },
    contents: [
      {parts: [{text: 'Hello world!'}]},
      {parts: [{text: 'How are you?'}]},
      {parts: [{text: 'This is an example of batch embedding.'}]},
      {parts: [{text: 'Google AI Studio.'}]},
    ],
  };

  // 2. Create the batch embedding job
  console.log('Creating batch embedding job...');
  const batchJob = await client.batches.createEmbeddings({
    model: EMBEDDING_MODEL,
    src: {inlinedRequests},
    config: {displayName: 'My Inline Embedding Batch'},
  });
  console.log(`Created batch job: ${batchJob.name}`);

  // A non-null assertion is safe here because `create` would have thrown an
  // error if it failed.
  const batchJobName = batchJob.name!;

  // 3. Poll for completion
  let result = await client.batches.get({name: batchJobName});

  while (
    result.state !== JobState.JOB_STATE_SUCCEEDED &&
    result.state !== JobState.JOB_STATE_FAILED &&
    result.state !== JobState.JOB_STATE_CANCELLED
  ) {
    console.log(
      `Batch job not done yet, current state: ${
        result.state
      }. Waiting 10 seconds...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
    result = await client.batches.get({name: batchJobName});
  }

  // 4. Handle final state
  console.log(`Batch job finished with state: ${result.state}`);

  if (result.state === JobState.JOB_STATE_SUCCEEDED) {
    console.log('Batch job succeeded!');
    console.log(result.dest?.inlinedEmbedContentResponses);
  } else if (result.state === JobState.JOB_STATE_FAILED) {
    console.error('Batch job failed:', result.error);
  } else {
    console.warn(`Batch job finished with state: ${result.state}`);
  }
}

batchEmbedInline();
