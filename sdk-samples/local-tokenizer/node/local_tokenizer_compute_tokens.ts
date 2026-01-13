/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Example of using LocalTokenizer.computeTokens() to get detailed token information.
 * This includes token IDs, bytes (base64 encoded), and roles.
 */

import {LocalTokenizer} from '@google/genai/tokenizer/node';

async function computeDetailedTokens() {
  console.log('=== Compute Detailed Token Information ===\n');

  const tokenizer = new LocalTokenizer('gemini-2.0-flash-001');

  // Compute tokens for a simple string
  const result1 = await tokenizer.computeTokens('Hello world');
  console.log('Input: "Hello world"');
  console.log('Token IDs:', result1.tokensInfo?.[0]?.tokenIds);
  console.log('Tokens (base64):', result1.tokensInfo?.[0]?.tokens);
  console.log('Role:', result1.tokensInfo?.[0]?.role);

  // Compute tokens for structured content
  const result2 = await tokenizer.computeTokens([
    {role: 'user', parts: [{text: 'Explain quantum computing'}]},
  ]);
  console.log('Input: "Explain quantum computing"');
  console.log(
    `Number of token IDs: ${result2.tokensInfo?.[0]?.tokenIds?.length}\n`,
  );

  // Compute tokens for a multi-turn conversation
  const result3 = await tokenizer.computeTokens([
    {role: 'user', parts: [{text: 'Hi'}]},
    {role: 'model', parts: [{text: 'Hello! How can I help you?'}]},
  ]);
  console.log('Input: Multi-turn conversation');
  console.log(`Number of token segments: ${result3.tokensInfo?.length}`);
  if (result3.tokensInfo) {
    for (let i = 0; i < result3.tokensInfo.length; i++) {
      const info = result3.tokensInfo[i];
      console.log(
        `  Segment ${i + 1} (${info.role}): ${info.tokenIds?.length} tokens`,
      );
    }
  }
}

async function main() {
  try {
    await computeDetailedTokens();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
