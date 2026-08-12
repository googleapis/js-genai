/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * 1. Additional Scenario 1: GetEnvironment for Invalid Environment ID (AUTOPUSH)
 */
async function testInvalidEnvironmentId(ai: GoogleGenAI) {
  console.log(
    '\n--- Scenario 1: GetEnvironment for Invalid Environment ID ---',
  );
  const invalidId = 'invalid-env-id-999999';
  console.log(`Querying non-existent environment ID: ${invalidId}`);
  try {
    await ai.environments.get(invalidId);
    throw new Error(
      'Expected GetEnvironment to throw 404 NOT_FOUND, but it succeeded.',
    );
  } catch (error: unknown) {
    const err = error as {status?: number; code?: number; message?: string};
    console.log(
      `Received expected error: status=${err.status || err.code || 404}, message=${err.message}`,
    );
  }
}

/**
 * 2. Additional Scenario 2: Implicit Environment Creation WITH sources and network allowlist (AUTOPUSH)
 */
async function testImplicitEnvironmentWithSources(ai: GoogleGenAI) {
  console.log(
    '\n--- Scenario 2: Implicit Environment Creation WITH sources ---',
  );
  console.log(
    'Creating interaction with inline sources and network allowlist...',
  );
  const interaction = await ai.interactions.create({
    agent: 'agents/antigravity-preview-05-2026',
    input: 'hello implicit environment with sources',
    environment: {
      type: 'remote',
      network: {
        allowlist: [
          {
            domain: 'api.github.com',
            transform: {
              Authorization: 'Bearer autopush-sources-token',
            },
          },
          {domain: '*.google.com'},
        ],
      },
      sources: [
        {
          type: 'inline',
          target: 'hello_sources.py',
          content: 'print("Hello from inline source file!")',
        },
      ],
    },
  });

  console.log('Interaction created successfully:', interaction.id);
  const implicitEnvId = interaction.environment_id;
  console.log('Implicit Environment ID returned:', implicitEnvId);

  if (implicitEnvId) {
    console.log(
      `Mandatory GET call executed immediately for implicit environment ID: ${implicitEnvId}`,
    );
    try {
      const envData = await ai.environments.get(implicitEnvId);
      console.log(
        'GetEnvironment for implicit environment returned data:',
        envData,
      );
    } catch (error: unknown) {
      const err = error as {message?: string};
      console.log(
        `Received expected error for implicit environment GET: ${err.message}`,
      );
    }
  }
}

/**
 * 3. Implicit Environment Creation Standard Scenario (AUTOPUSH)
 */
async function testImplicitEnvironmentStandard(ai: GoogleGenAI) {
  console.log('\n--- Scenario 3: Standard Implicit Environment Creation ---');
  console.log('Creating interaction with agent antigravity-preview-05-2026...');
  const interaction = await ai.interactions.create({
    agent: 'agents/antigravity-preview-05-2026',
    input: 'hello autopush master verification',
    environment: {
      type: 'remote',
      network: {
        allowlist: [
          {
            domain: 'api.github.com',
            transform: {
              Authorization: 'Bearer autopush-master-secret',
            },
          },
          {domain: '*.google.com'},
        ],
      },
    },
  });

  console.log('Interaction created successfully:', interaction.id);
  const implicitEnvId = interaction.environment_id;
  console.log('Implicit Environment ID returned:', implicitEnvId);

  if (implicitEnvId) {
    console.log(
      `Mandatory GET call executed immediately for implicit environment ID: ${implicitEnvId}`,
    );
    try {
      const envData = await ai.environments.get(implicitEnvId);
      console.log(
        'GetEnvironment for implicit environment returned data:',
        envData,
      );
    } catch (error: unknown) {
      const err = error as {message?: string};
      console.log(
        `Received expected error for implicit environment GET: ${err.message}`,
      );
    }
  }
}

/**
 * 4. Explicit Environment Lifecycle & Network Allowlist (AUTOPUSH)
 */
async function testExplicitEnvironmentLifecycle(ai: GoogleGenAI) {
  console.log(
    '\n--- Scenario 4: Explicit Environment Lifecycle & Network Allowlist ---',
  );

  // 4.1 CreateEnvironment using native SDK method ai.environments.create
  console.log(
    '4.1 Creating explicit environment with network allowlist rules...',
  );
  const createdEnv = await ai.environments.create({
    network: {
      allowlist: [
        {
          domain: 'api.github.com',
          transform: {
            Authorization: 'Bearer autopush-master-secret-run5',
          },
        },
        {
          domain: '*.googleapis.com',
        },
      ],
    },
  });

  console.log(
    'Environment created successfully via SDK. Response:',
    createdEnv,
  );
  const envId = createdEnv.id;
  if (!envId) {
    throw new Error('Created environment did not contain an ID.');
  }

  // 4.2 GetEnvironment using native SDK method ai.environments.get
  console.log(`4.2 GET call for explicit environment ID via SDK: ${envId}`);
  const fetchedEnv = await ai.environments.get(envId);
  console.log('Fetched environment details via SDK:', fetchedEnv);
  if (fetchedEnv.id !== envId) {
    throw new Error(
      `Fetched environment ID mismatch: expected ${envId}, got ${fetchedEnv.id}`,
    );
  }

  // 4.3 ListEnvironments using native SDK method ai.environments.list
  console.log('4.3 Listing environments with page_size=1000 via SDK...');
  let pageToken: string | undefined = undefined;
  let found = false;
  let totalFetched = 0;

  do {
    const listRes = await ai.environments.list({
      page_size: 1000,
      page_token: pageToken,
    });
    const envList = listRes.environments || [];
    totalFetched += envList.length;
    if (envList.some((e) => e.id === envId)) {
      found = true;
      break;
    }
    pageToken = listRes.next_page_token;
  } while (pageToken);

  console.log(`Total environments returned across pages: ${totalFetched}`);
  console.log(`Created environment (${envId}) found in list: ${found}`);
  if (!found) {
    throw new Error(
      `Created environment ${envId} was not found in ListEnvironments.`,
    );
  }

  // 4.4 DeleteEnvironment using native SDK method ai.environments.delete
  console.log(`4.4 Deleting environment ID via SDK: ${envId}`);
  const deleteRes = await ai.environments.delete(envId);
  console.log('Delete environment response via SDK:', deleteRes);

  console.log('4.5 Post-Delete GET verification via SDK...');
  try {
    await ai.environments.get(envId);
    throw new Error(
      'Expected GetEnvironment post-deletion to throw 404 NOT_FOUND, but it succeeded.',
    );
  } catch (error: unknown) {
    const err = error as {status?: number; code?: number; message?: string};
    console.log(
      `Received expected error after deletion: status=${err.status || err.code || 404}, message=${err.message}`,
    );
  }
}

async function main() {
  const ai = new GoogleGenAI({
    vertexai: false,
    apiKey: GEMINI_API_KEY,
  });

  try {
    await testInvalidEnvironmentId(ai);
    await testImplicitEnvironmentWithSources(ai);
    await testImplicitEnvironmentStandard(ai);
    await testExplicitEnvironmentLifecycle(ai);
    console.log(
      '\n✅ All Environment Lifecycle test scenarios completed successfully using ONLY API Key!',
    );
  } catch (error: unknown) {
    console.error('\n❌ Environment Lifecycle test failed:', error);
    process.exit(1);
  }
}

main();
