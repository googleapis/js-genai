/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example of using LocalTokenizer with tools, system instructions, and response schemas.
 * This shows how to count tokens for complex requests that include function calling.
 */

import {Type} from '@google/genai/node';
import {LocalTokenizer} from '@google/genai/tokenizer/node';

async function countTokensWithTools() {
  console.log('=== Count Tokens with Tools and Configuration ===\n');

  const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');

  // Define a tool for function calling
  const calculatorTool = {
    functionDeclarations: [
      {
        name: 'calculate',
        description: 'Performs arithmetic calculations on two numbers',
        parameters: {
          type: Type.OBJECT,
          properties: {
            operation: {
              type: Type.STRING,
              description: 'The operation to perform',
              enum: ['add', 'subtract', 'multiply', 'divide'],
            },
            a: {
              type: Type.NUMBER,
              description: 'First number',
            },
            b: {
              type: Type.NUMBER,
              description: 'Second number',
            },
          },
          required: ['operation', 'a', 'b'],
        },
      },
    ],
  };

  // Count tokens with tool definition
  const result1 = await tokenizer.countTokens(
    [{role: 'user', parts: [{text: 'Calculate 15 + 27'}]}],
    {
      tools: [calculatorTool],
    },
  );
  console.log('Request with calculator tool:');
  console.log(`Total tokens: ${result1.totalTokens}`);
  console.log('(includes tool definition tokens)\n');

  // Count tokens with system instruction
  const result2 = await tokenizer.countTokens(
    [{role: 'user', parts: [{text: 'What is 5 times 3?'}]}],
    {
      tools: [calculatorTool],
      systemInstruction:
        'You are a helpful calculator assistant. Always use the calculate function to perform arithmetic operations.',
    },
  );
  console.log('Request with tool and system instruction:');
  console.log(`Total tokens: ${result2.totalTokens}`);
  console.log('(includes tool + system instruction tokens)\n');

  // Count tokens with response schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      result: {
        type: Type.NUMBER,
        description: 'The result of the calculation',
      },
      explanation: {
        type: Type.STRING,
        description: 'Step-by-step explanation',
      },
    },
    required: ['result', 'explanation'],
  };

  const result3 = await tokenizer.countTokens(
    [{role: 'user', parts: [{text: 'What is 100 divided by 4?'}]}],
    {
      tools: [calculatorTool],
      systemInstruction: 'You are a helpful calculator assistant.',
      generationConfig: {
        responseSchema: responseSchema,
      },
    },
  );
  console.log('Request with tool, system instruction, and response schema:');
  console.log(`Total tokens: ${result3.totalTokens}`);
  console.log('(includes all configuration tokens)\n');
}

async function countTokensWithFunctionCall() {
  console.log('=== Count Tokens with Function Call and Response ===\n');

  const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');

  // Count tokens for a conversation with function call
  const result = await tokenizer.countTokens([
    {role: 'user', parts: [{text: 'What is the weather in San Francisco?'}]},
    {
      role: 'model',
      parts: [
        {
          functionCall: {
            name: 'get_weather',
            args: {city: 'San Francisco'},
          },
        },
      ],
    },
    {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: 'get_weather',
            response: {temperature: 68, condition: 'sunny'},
          },
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'The weather in San Francisco is sunny with a temperature of 68°F.',
        },
      ],
    },
  ]);

  console.log('Multi-turn conversation with function calling:');
  console.log(`Total tokens: ${result.totalTokens}`);
  console.log('(includes function call and response tokens)\n');
}

async function main() {
  try {
    await countTokensWithTools();
    await countTokensWithFunctionCall();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
