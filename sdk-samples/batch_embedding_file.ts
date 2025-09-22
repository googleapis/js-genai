/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:no-default-export

import {GoogleGenAI} from '@google/genai';
import * as fs from 'fs/promises';
import {tmpdir} from 'os';
import * as path from 'path';

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

async function batchEmbedFile() {
  console.log('--- Batch Embedding with File Input ---');

  // 1. Prepare the input file content (JSONL)
  const jsonlContent = [
    {
      'key': 'request_1',
      'request': {
        'model': EMBEDDING_MODEL,
        'content': {'parts': [{'text': 'The quick brown fox'}]},
        'outputDimensionality': 5,
      },
    },
    {
      'key': 'request_2',
      'request': {
        'model': EMBEDDING_MODEL,
        'content': {'parts': [{'text': 'jumps over the lazy dog'}]},
      },
      'outputDimensionality': 5,
    },
    {
      'key': 'request_3',
      'request': {
        'model': EMBEDDING_MODEL,
        'content': {'parts': [{'text': 'A delightful summer day'}]},
        'outputDimensionality': 5,
      },
    },
  ]
    .map((obj) => JSON.stringify(obj))
    .join('\n');

  const tempDir = tmpdir();
  const tempFilePath = path.join(tempDir, 'embedding_input.jsonl');
  let inputFile = '';

  try {
    await fs.writeFile(tempFilePath, jsonlContent);
    console.log(`Temporary input file written to: ${tempFilePath}`);

    // 2. Upload the file using the File API
    console.log('Uploading input file...');
    const uploadedFile = await client.files.upload({
      file: tempFilePath,
      config: {
        mimeType: 'application/vnd.google.generativeai.jsonl',
        displayName: 'batch-embedding-input',
      },
    });
    console.log(`Uploaded file as: ${uploadedFile.name}`);
    inputFile = uploadedFile.name!;
  } catch (err) {
    console.error('Error during file preparation or upload:', err);
    return;
  } finally {
    // Clean up the temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (err) {
      console.error(`Failed to delete temporary file: ${tempFilePath}`, err);
    }
  }

  if (!inputFile) {
    console.error('Failed to get an input file name from upload.');
    return;
  }

  // 3. Create the batch embedding job using the uploaded file name
  console.log(`Creating batch embedding job with file: ${inputFile}`);
  const batchJob = await client.batches.createEmbeddings({
    model: EMBEDDING_MODEL,
    src: {fileName: inputFile},
    config: {displayName: 'My File Embedding Batch TS'},
  });
  console.log(`Created batch job: ${batchJob.name}`);

  // A non-null assertion is safe here because `create` would have thrown an
  // error if it failed.
  const batchJobName = batchJob.name!;

  // 4. Poll for completion
  let result = await client.batches.get({name: batchJobName});
  console.log('result: ', result);

  while (
    result.state !== JobState.JOB_STATE_SUCCEEDED &&
    result.state !== JobState.JOB_STATE_FAILED &&
    result.state !== JobState.JOB_STATE_CANCELLED
  ) {
    console.log(
      `Batch job not done yet, current state: ${
        result.state
      }. Waiting 60 seconds...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 60 seconds
    result = await client.batches.get({name: batchJobName});
  }

  console.log(`Batch job finished with state: ${result.state}`);

  if (result.state === JobState.JOB_STATE_SUCCEEDED) {
    console.log('Batch job succeeded!');
    if (result.dest?.fileName) {
      // Download the file to the temporary path
      const tempFilePath = 'batch.jsonl';
      await client.files.download({
        file: result.dest.fileName,
        downloadPath: tempFilePath,
      });

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

      console.log(`File downloaded to: ${tempFilePath}`);

      // Read the content from the temporary file
      const contentString = await fs.readFile(tempFilePath, {encoding: 'utf8'});

      const lines = contentString.trim().split('\n');
      const parsedContent = lines.map((line) => {
        return JSON.parse(line);
      });

      console.log('Parsed output content:');
      console.log(JSON.stringify(parsedContent, null, 2));
    } else {
      console.warn('Batch job succeeded but no output file name was found.');
    }
  } else if (result.state === JobState.JOB_STATE_FAILED) {
    console.error('Batch job failed:', result.error);
  } else {
    console.warn(`Batch job finished with unexpected state: ${result.state}`);
  }
}

batchEmbedFile();
