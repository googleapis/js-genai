/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;
const INLINE_TRAINING_DATA = [
  ['1', '2'],
  ['3', '4'],
  ['-3', '-2'],
  ['twenty two', 'twenty three'],
  ['two hundred', 'two hundred one'],
  ['ninety nine', 'one hundred'],
  ['8', '9'],
  ['-98', '-97'],
  ['1,000', '1,001'],
  ['10,100,000', '10,100,001'],
  ['thirteen', 'fourteen'],
  ['eighty', 'eighty one'],
  ['one', 'two'],
  ['three', 'four'],
  ['seven', 'eight'],
];

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tuningEndToEndFromMLDev() {
  const ai = new GoogleGenAI({vertexai: false, apiKey: GEMINI_API_KEY});
  const tuningExamples = INLINE_TRAINING_DATA.map(([input, output]) => {
    return {
      textInput: input,
      output: output,
    };
  });
  const tuningJob = await ai.tunings.tune({
    baseModel: 'models/gemini-1.5-flash-001-tuning',
    trainingDataset: {
      examples: tuningExamples,
    },
    config: {
      tunedModelDisplayName: 'uSDK_tuning_display_name',
    },
  });
  const tuningJobName = tuningJob.name ?? '';
  console.log('Creating tuning job name: ', tuningJobName);

  const fetchedTuningJob = await ai.tunings.get({name: tuningJobName});
  console.log('Fetched tuning job: ', fetchedTuningJob);
  const tunedModel = fetchedTuningJob.tunedModel?.model ?? '';
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

  const deleteResponse = await ai.models.delete({model: tunedModel});
  console.log('Deleted tuning model response: ', deleteResponse);
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
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    await tuningEndToEndFromVertexAI().catch((e) =>
      console.error('got error', e),
    );
  } else {
    await tuningEndToEndFromMLDev().catch((e) => console.error('got error', e));
  }
}

main();
