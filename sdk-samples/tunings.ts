/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function tuningEndToEndFromVertexAI() {
  const location =
    GOOGLE_CLOUD_LOCATION && GOOGLE_CLOUD_LOCATION !== 'global'
      ? GOOGLE_CLOUD_LOCATION
      : 'us-central1';
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location,
  });
  const tuningJob = await ai.tunings.tune({
    baseModel: 'gemini-2.5-flash',
    trainingDataset: {
      gcsUri:
        'gs://cloud-samples-data/ai-platform/generative_ai/gemini-1_5/text/sft_train_data.jsonl',
    },
  });
  console.log('Created tuning job: ', tuningJob.name);
  const tuningJobName = tuningJob.name ?? '';

  if (tuningJobName) {
    const fetchedTuningJob = await ai.tunings.get({name: tuningJobName});
    console.log('Fetched tuning job state: ', fetchedTuningJob.state);
    await ai.tunings.cancel({name: tuningJobName});
    console.log('Cancelled test tuning job successfully.');
  }
}

async function main() {
  if (
    GOOGLE_GENAI_USE_VERTEXAI &&
    GOOGLE_GENAI_USE_VERTEXAI.toLowerCase() === 'true'
  ) {
    await tuningEndToEndFromVertexAI();
  } else {
    console.error(
      'Error: Tuning operations are only supported when using Vertex AI. ' +
        'Please set the environment variable GOOGLE_GENAI_USE_VERTEXAI=True ' +
        'and ensure GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION are also set.',
    );
  }
}

main();
