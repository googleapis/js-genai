/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Basic example of using LocalTokenizer to count tokens offline.
 * No API calls are made - tokenization happens locally.
 */

import {LocalTokenizer} from '@google/genai/tokenizer/node';

async function basicCountTokens() {
  console.log('=== Basic Token Counting ===\n');

  // Create a local tokenizer for gemini-2.0-flash
  const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');

  // Count tokens in a simple string
  const result1 = await tokenizer.countTokens('What is your name?');
  console.log('Input: "What is your name?"');
  console.log(`Total tokens: ${result1.totalTokens}\n`);

  // Count tokens in a longer text
  const longText =
    'The quick brown fox jumps over the lazy dog. This is a sample sentence for tokenization.';
  const result2 = await tokenizer.countTokens(longText);
  console.log(`Input: "${longText}"`);
  console.log(`Total tokens: ${result2.totalTokens}\n`);

  // Count tokens with structured content
  const result3 = await tokenizer.countTokens([
    {role: 'user', parts: [{text: 'Hello, how are you?'}]},
  ]);
  console.log('Input: User message "Hello, how are you?"');
  console.log(`Total tokens: ${result3.totalTokens}\n`);

  // Count tokens in a multi-turn conversation
  const result4 = await tokenizer.countTokens([
    {role: 'user', parts: [{text: 'What is the capital of France?'}]},
    {role: 'model', parts: [{text: 'The capital of France is Paris.'}]},
    {role: 'user', parts: [{text: 'What about Spain?'}]},
  ]);
  console.log('Input: Multi-turn conversation');
  console.log(`Total tokens: ${result4.totalTokens}\n`);
}

async function main() {
  try {
    await basicCountTokens();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
