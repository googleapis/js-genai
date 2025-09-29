/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tuningEndToEndFromVertexAI() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: GOOGLE_CLOUD_PROJECT,
    location: GOOGLE_CLOUD_LOCATION,
  });
  const tuningJob = await ai.tunings.tune({
    baseModel: 'gemini-2.0-flash-001',
    trainingDataset: {
      gcsUri:
        'gs://cloud-samples-data/ai-platform/generative_ai/gemini-1_5/text/sft_train_data.jsonl',
    },
  });
  console.log('Creating tuning job: ', tuningJob);
  const tuningJobName = tuningJob.name ?? '';

  let tunedModel = '';
  while (!tunedModel) {
    console.log('Waiting for tuned model to be available');
    await delay(10000);
    const fetchedTuningJob = await ai.tunings.get({name: tuningJobName});
    tunedModel = fetchedTuningJob.tunedModel?.model ?? '';
    // Remove the version number from the tuned model name.
    const regex = /@\d+$/;
    tunedModel = tunedModel.replace(regex, '');
  }

  console.log('Tuned model: ', tunedModel);
  const updatedModel = await ai.models.update({
    model: tunedModel,
    config: {
      displayName: 'sdk_tuning_display_name',
      description: 'SDK tuning description',
    },
  });
  console.log('Updated tuned model: ', updatedModel);
  const getModelResponse = await ai.models.get({model: tunedModel});
  console.log('Get updated tuned model: ', getModelResponse);

  // Vertex AI does not support deleting tuned GenAI 1P models.
}

async function main() {
  if (
    GOOGLE_GENAI_USE_VERTEXAI &&
    GOOGLE_GENAI_USE_VERTEXAI.toLowerCase() === 'true'
  ) {
    await tuningEndToEndFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    console.error(
      'Error: Tuning operations are only supported when using Vertex AI. ' +
        'Please set the environment variable GOOGLE_GENAI_USE_VERTEXAI=True ' +
        'and ensure GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION are also set.',
    );
  }
}

main();
