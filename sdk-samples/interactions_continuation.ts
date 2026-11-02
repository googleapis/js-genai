/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ContinuationInterruptedError, GoogleGenAI} from '@google/genai';
import {MODEL_FLASH_LITE} from './constants.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

const LONG_PROMPT =
  'Write a very long, detailed novella about a lighthouse keeper. Do not ' +
  'stop until the story has a proper ending.';

/**
 * Automatic continuation is on by default: when the server stops a long
 * decode at its per-request limit (status 'requires_continuation'), the SDK
 * resumes it in further requests ("hops") and merges the hops into a single
 * interaction.
 */
async function automaticContinuationUnary(ai: GoogleGenAI) {
  const response = await ai.interactions.create({
    model: MODEL_FLASH_LITE,
    input: LONG_PROMPT,
    // generation_config.max_output_tokens (optional) is the budget for the
    // whole decode across hops; when unset the server chooses the default.
    generation_config: {max_output_tokens: 100_000},
  });

  console.log('status:', response.status);
  console.log('characters:', response.output_text?.length ?? 0);
  // Each hop is its own interaction on the server; `id` is the last one and
  // can be used as previous_interaction_id for the next turn.
  console.log('hops:', response.continuation_ids);
  console.log('usage (summed across hops):', response.usage);
}

/**
 * Streaming: the events of every hop are yielded in order, including each
 * hop's own interaction.created and interaction.completed events. Only an
 * interaction.completed event whose status is not 'requires_continuation'
 * ends the output.
 */
async function automaticContinuationStream(ai: GoogleGenAI) {
  const stream = await ai.interactions.create({
    model: MODEL_FLASH_LITE,
    input: LONG_PROMPT,
    stream: true,
  });

  for await (const event of stream) {
    switch (event.event_type) {
      case 'step.delta':
        if (event.delta?.type === 'text') {
          process.stdout.write(event.delta.text ?? '');
        }
        break;
      case 'interaction.completed':
        console.log(
          `\n[hop ${event.interaction?.id} ended with status ${event.interaction?.status}]`,
        );
        break;
    }
  }
}

/**
 * Opting out: the single server response is returned untouched. The caller
 * drives continuation by passing the token (and, with `store` enabled, the
 * id of the interaction that issued it as previous_interaction_id).
 */
async function manualContinuation(ai: GoogleGenAI) {
  let response = await ai.interactions.create({
    model: MODEL_FLASH_LITE,
    input: LONG_PROMPT,
    automatic_continuation: false,
  });
  let text = response.output_text ?? '';
  while (
    response.status === 'requires_continuation' &&
    response.continuation_token
  ) {
    response = await ai.interactions.create({
      model: MODEL_FLASH_LITE,
      previous_interaction_id: response.id,
      continuation_token: response.continuation_token,
      automatic_continuation: false,
    });
    text += response.output_text ?? '';
  }
  console.log('status:', response.status, 'characters:', text.length);
}

/**
 * If a later hop fails, the work already produced (and billed) is not lost:
 * a ContinuationInterruptedError carries the merged partial interaction and
 * the token to resume from.
 */
async function resumeAfterInterruption(ai: GoogleGenAI) {
  try {
    await ai.interactions.create(
      {model: MODEL_FLASH_LITE, input: LONG_PROMPT},
      // A per-request timeout bounds the whole call, across hops.
      {timeout_ms: 60_000},
    );
  } catch (e) {
    if (!(e instanceof ContinuationInterruptedError)) {
      throw e;
    }
    console.log(
      'interrupted after hops:',
      e.continuationIds,
      'cause:',
      e.cause,
    );
    const resumed = await ai.interactions.create({
      model: MODEL_FLASH_LITE,
      previous_interaction_id: e.interactionId,
      continuation_token: e.continuationToken,
    });
    console.log('resumed, status:', resumed.status);
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Interactions API is not yet supported on Vertex');
    return;
  }
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  await automaticContinuationUnary(ai);
  await automaticContinuationStream(ai);
  await manualContinuation(ai);
  await resumeAfterInterruption(ai);
}

main();
