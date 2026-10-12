/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;
const MODEL = process.env.GEMINI_MODEL || MODEL_FLASH_LITE;

function printInteractionText(
  interaction: Awaited<ReturnType<GoogleGenAI['interactions']['create']>>,
) {
  if ('output_text' in interaction && interaction.output_text) {
    process.stdout.write(interaction.output_text);
    return;
  }
  if ('steps' in interaction && interaction.steps) {
    for (const step of interaction.steps) {
      if (step.type === 'model_output' && step.content) {
        for (const content of step.content) {
          if (content.type === 'text' && content.text) {
            process.stdout.write(content.text);
          }
        }
      }
    }
  }
}

async function runAutomaticUnaryContinuation(ai: GoogleGenAI) {
  console.log('--- Automatic Unary Continuation ---');
  const interaction = await ai.interactions.create({
    model: MODEL,
    input: 'Write a 500 word story about a robot.',
    automatic_continuation: true,
  });
  printInteractionText(interaction);
  console.log(`\nFinal status: ${interaction.status}`);
}

async function runAutomaticStreamingContinuation(ai: GoogleGenAI) {
  console.log('\n--- Automatic Streaming Continuation ---');
  const stream = await ai.interactions.create({
    model: MODEL,
    input: 'Write a 500 word story about a robot.',
    stream: true,
    automatic_continuation: true,
  });

  let status: string | undefined;
  for await (const event of stream) {
    if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
      process.stdout.write(event.delta.text ?? '');
    } else if (event.event_type === 'interaction.completed') {
      status = event.interaction.status;
    }
  }
  console.log(`\nFinal stream status: ${status}`);
}

async function runUnaryContinuation(ai: GoogleGenAI) {
  console.log('\n--- Manual Unary Continuation ---');
  let interaction = await ai.interactions.create({
    model: MODEL,
    input: 'Write a 500 word story about a robot.',
  });

  while (
    interaction.status === 'continuation_required' &&
    interaction.continuation_token
  ) {
    interaction = await ai.interactions.create({
      model: MODEL,
      input: 'Write a 500 word story about a robot.',
      continuation_token: interaction.continuation_token,
    });
  }
  printInteractionText(interaction);
  console.log(`\nFinal status: ${interaction.status}`);
}

async function runStreamingContinuation(ai: GoogleGenAI) {
  console.log('\n--- Manual Streaming Continuation ---');
  let continuationToken: string | undefined;
  let status: string | undefined;

  do {
    const stream = await ai.interactions.create({
      model: MODEL,
      input: 'Write a 500 word story about a robot.',
      continuation_token: continuationToken,
      stream: true,
    });

    status = undefined;
    for await (const event of stream) {
      if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
        process.stdout.write(event.delta.text ?? '');
      } else if (event.event_type === 'interaction.completed') {
        status = event.interaction.status;
        continuationToken = event.interaction.continuation_token;
      }
    }
  } while (status === 'continuation_required' && continuationToken);
  console.log(`\nFinal stream status: ${status}`);
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Interactions API is not yet supported on Vertex');
    return;
  }
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });
  await runAutomaticUnaryContinuation(ai);
  await runAutomaticStreamingContinuation(ai);
  await runUnaryContinuation(ai);
  await runStreamingContinuation(ai);
}

main();
