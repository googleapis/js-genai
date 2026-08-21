/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_GENAI_USE_VERTEXAI = process.env.GOOGLE_GENAI_USE_VERTEXAI;

/**
 * Demonstrates Environment file operations using the Google GenAI TypeScript SDK:
 * 1. Creating an environment with initial source files.
 * 2. Listing files at root using ai.environments.files.list.
 * 3. Inspecting file metadata (name, size, type).
 * 4. Querying nested directories recursively.
 * 5. Cleaning up the environment.
 */
async function environmentFilesSample(ai: GoogleGenAI) {
  console.log('\n--- 1. Creating Environment with Workspace Files ---');
  const env = await ai.environments.create({
    sources: [
      {
        type: 'inline',
        target: 'main.py',
        content: 'print("Hello from Environment Files demo!")\n',
      },
      {
        type: 'inline',
        target: 'config.json',
        content: '{"version": "1.0", "debug": true}\n',
      },
      {
        type: 'inline',
        target: 'src/utils.py',
        content: 'def greet(name: str) -> str:\n  return f"Hello, {name}!"\n',
      },
    ],
  });

  const envId = env.id;
  if (!envId) {
    throw new Error('Failed to create environment: no ID returned.');
  }
  console.log(`Environment created successfully! ID: ${envId}`);

  try {
    // 2. List root files
    console.log('\n--- 2. Listing Files at Root Directory (path=".") ---');
    const rootFilesResponse = await ai.environments.files.list({
      environment: envId,
      path: '.',
    });

    console.log('Root files response:');
    const files = rootFilesResponse.files || [];
    for (const file of files) {
      console.log(
        ` - ${file.name} (type=${file.type ?? 'file'}, size=${file.size_bytes ?? 'unknown'} bytes)`,
      );
    }

    if (files.length === 0) {
      console.log(' (No files returned at root)');
    }

    // 3. Query nested subdirectory
    console.log(
      '\n--- 3. Querying Subdirectory (path="src", recursive=true) ---',
    );
    const srcFilesResponse = await ai.environments.files.list({
      environment: envId,
      path: 'src',
      recursive: true,
    });

    console.log('Subdirectory files response:');
    for (const file of srcFilesResponse.files || []) {
      console.log(
        ` - ${file.name} (type=${file.type ?? 'file'}, size=${file.size_bytes ?? 'unknown'} bytes)`,
      );
    }

    // 4. Verify specific file presence
    console.log('\n--- 4. Querying Specific File Path (path="main.py") ---');
    const mainFileResponse = await ai.environments.files.list({
      environment: envId,
      path: 'main.py',
    });
    console.log('main.py file query response:', mainFileResponse);
  } finally {
    // 5. Clean up
    console.log(`\n--- 5. Cleaning up Environment ID: ${envId} ---`);
    const deleteRes = await ai.environments.delete(envId);
    console.log('Environment deleted successfully:', deleteRes);
  }
}

async function main() {
  if (GOOGLE_GENAI_USE_VERTEXAI) {
    console.log(
      'Environment Files API is currently supported on Gemini API (MLDev). Skipping on Vertex.',
    );
    return;
  }

  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    apiVersion: 'v1alpha',
  });

  try {
    await environmentFilesSample(ai);
    console.log('\n✅ Environment Files SDK sample completed successfully!');
  } catch (error: unknown) {
    console.error('\n❌ Environment Files SDK sample failed:', error);
    process.exit(1);
  }
}

main();
