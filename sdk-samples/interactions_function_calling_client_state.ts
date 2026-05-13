/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI, Interactions} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

async function createInteractionsFromMLDev() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  const fcConversationHistory: Interactions.Step[] = [
    {
      type: 'user_input',
      content: [
        {
          type: 'text',
          text: 'Schedule a meeting for 2025-11-01 at 10 am with Peter and Amir about the Next Gen API.',
        },
      ],
    },
  ];

  // 1. Model decides to call the function
  const response = await ai.interactions.create({
    model: 'gemini-2.5-flash',
    input: fcConversationHistory,
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

  // add model response back to history
  fcConversationHistory.push(...response.steps);

  for (const step of response.steps) {
    if (step.type == 'function_call') {
      console.log(
        `Function call: ${step.name} with arguments ${JSON.stringify(
          step.arguments,
        )}`,
      );

      // 2. Execute the function and get a result
      // In a real app, you would call your function here.
      // const call_result = schedule_meeting(step.arguments);

      // 3. Send the result back to the model
      fcConversationHistory.push({
        type: 'function_result',
        name: step.name!,
        call_id: step.id!,
        result: 'Meeting scheduled successfully.',
      });

      const response2 = await ai.interactions.create({
        model: 'gemini-2.5-flash',
        input: fcConversationHistory,
      });
      console.log(`Final response: ${response2}`);
    } else {
      console.log(`Output: ${step}`);
    }
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log('Interactions API is not yet supported on Vertex');
  } else {
    await createInteractionsFromMLDev().catch((e) =>
      console.error('got error', e),
    );
  }
}

main();
