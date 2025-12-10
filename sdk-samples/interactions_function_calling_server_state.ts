/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // 1. Model decides to call the function
  const response = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    input:
      'Schedule a meeting for 2025-11-01 at 10 am with Peter and Amir about the Next Gen API',
    tools: [
      {
        name: 'schedule_meeting',
        description:
          'Schedules a meeting with specified attendees at a given time and date.',
        parameters: {
          type: 'object',
          properties: {
            attendees: {
              type: 'array',
              items: {type: 'string'},
              description: 'List of people attending the meeting.',
            },
            date: {
              type: 'string',
              description: 'Date of the meeting (e.g., 2024-07-29)',
            },
            time: {
              type: 'string',
              description: 'Time of the meeting (e.g., 15:00)',
            },
            topic: {
              type: 'string',
              description: 'The subject or topic of the meeting.',
            },
          },
          required: ['attendees', 'date', 'time', 'topic'],
        },
        type: 'function',
      },
    ],
  });

  for (const output of response.outputs ?? []) {
    if (output.type == 'function_call') {
      console.log(
        `Function call: ${output.name} with arguments ${output.arguments}`,
      );

      // 2. Execute the function and get a result
      // In a real app, you would call your function here.
      // const call_result = schedule_meeting(output.arguments);

      // 3. Send the result back to the model
      const response2 = await ai.interactions.create({
        model: 'gemini-2.5-flash',
        input: [
          {
            type: 'function_result',
            name: output.name,
            call_id: output.id,
            result: 'Meeting scheduled successfully.',
          },
        ],
      });
      console.log(`Final response: ${response2}`);
    } else {
      console.log(`Output: ${output}`);
    }
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    throw new Error('Interactions API is not yet supported on Vertex');
  } else {
    await createInteractionsFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
