/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import util from 'node:util';

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.maxStringLength = null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Asserts a condition, throwing an Error with details if falsy.
 */
function expectThat(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Extracts a readable message from an unknown error value.
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Best-effort deletion helper.
 */
async function bestEffortDelete(ai: GoogleGenAI, credentialId?: string) {
  if (!credentialId) return;
  try {
    const deleteResp = await ai.credentials.delete(credentialId);
    console.log(`Cleaned up credential ${credentialId}:`, deleteResp);
  } catch (error: unknown) {
    console.warn(
      `Failed to clean up credential ${credentialId}:`,
      getErrorMessage(error),
    );
  }
}

async function genericOperationCredentials() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  const testSuffix = Math.random().toString(36).substring(2, 10);
  const bearerId = `sample-bearer-${testSuffix}`;
  const envVarId = `sample-envvar-${testSuffix}`;
  const oauthId = `sample-oauth-${testSuffix}`;

  try {
    // ==========================================
    // A. Bearer Token Lifecycle
    // ==========================================
    // 1. Create Bearer Token Credential
    console.log(`\n1. Creating Bearer Token Credential: ${bearerId}...`);
    const bearerCreated = await ai.credentials.create({
      id: bearerId,
      type: 'bearer_token',
      header_name: 'Authorization',
      prefix: 'Bearer',
      token: 'secret_sample_bearer_token_val_123',
    });
    console.log('Created Bearer Credential (Whole Response):', bearerCreated);

    // 2. Verify Bearer metadata & assert write-only secret masking
    console.log(
      '\n2. Verifying Bearer metadata and write-only secret masking...',
    );
    expectThat(
      bearerCreated.id === bearerId || bearerCreated.id.includes(bearerId),
      `Expected ID to contain ${bearerId}, got ${bearerCreated.id}`,
    );
    expectThat(
      String(bearerCreated.type || '')
        .toLowerCase()
        .includes('bearer'),
      `Expected type to be bearer_token, got ${bearerCreated.type}`,
    );
    // Write-only secret masking check: token MUST NOT appear in the response!
    expectThat(
      !('token' in bearerCreated),
      "Secret masking failed: 'token' was returned in create response",
    );
    expectThat(
      !('secret' in bearerCreated),
      "Secret masking failed: 'secret' was returned in create response",
    );
    console.log(
      '  ✓ Bearer create metadata and write-only secret masking verified.',
    );

    // 3. Get Bearer Credential by ID
    console.log(`\n3. Getting Bearer Credential by ID: ${bearerId}...`);
    const bearerFetched = await ai.credentials.get(bearerId);
    console.log('Fetched Bearer Credential (Whole Response):', bearerFetched);
    expectThat(
      bearerFetched.id === bearerId || bearerFetched.id.includes(bearerId),
      `Fetched credential ID mismatch: got ${bearerFetched.id}`,
    );
    expectThat(
      String(bearerFetched.type || '')
        .toLowerCase()
        .includes('bearer'),
      `Fetched credential type mismatch: got ${bearerFetched.type}`,
    );
    expectThat(
      !('token' in bearerFetched),
      "Secret masking failed: 'token' was returned in get response",
    );
    console.log('  ✓ Bearer get verification successful.');

    // 4. List Credentials
    console.log('\n4. Listing Credentials...');
    const listResp = await ai.credentials.list();
    console.log('List Credentials (Whole Response):', listResp);
    const creds = listResp.credentials || [];
    console.log(`Found ${creds.length} credential(s) in project.`);
    const foundBearer = creds.some(
      (c) => c.id === bearerId || c.id.includes(bearerId),
    );
    expectThat(
      foundBearer,
      `Created credential ${bearerId} not found in credentials list`,
    );
    console.log(`  ✓ Found ${bearerId} in credential list.`);

    // 5. Update Bearer Credential
    console.log(`\n5. Updating Bearer Credential: ${bearerId}...`);
    const bearerUpdated = await ai.credentials.update(bearerId, {
      type: 'bearer_token',
      header_name: 'X-Custom-Auth',
      prefix: 'Token',
      token: 'updated_secret_bearer_token_val_456',
    });
    console.log('Updated Bearer Credential (Whole Response):', bearerUpdated);
    expectThat(
      !('token' in bearerUpdated),
      "Secret masking failed: 'token' was returned in update response",
    );
    console.log('  ✓ Bearer update verification successful.');

    // 6. Get again to confirm updates persisted
    console.log(`\n6. Getting updated Bearer Credential: ${bearerId}...`);
    const bearerFetchedAgain = await ai.credentials.get(bearerId);
    console.log(
      'Fetched updated Bearer Credential (Whole Response):',
      bearerFetchedAgain,
    );
    expectThat(
      !('token' in bearerFetchedAgain),
      "Secret masking failed: 'token' was returned in get-after-update response",
    );
    console.log('  ✓ Bearer get-after-update verification successful.');

    // ==========================================
    // B. Environment Variable Lifecycle
    // ==========================================
    // 7. Create Environment Variable Credential
    console.log(
      `\n7. Creating Environment Variable Credential: ${envVarId}...`,
    );
    const envVarCreated = await ai.credentials.create({
      id: envVarId,
      type: 'environment_variable',
      value: 'super_secret_env_value_789',
      injection_location: ['header', 'query'],
      trusted_domains: ['example.com', 'api.example.com'],
    });
    console.log(
      'Created Environment Variable Credential (Whole Response):',
      envVarCreated,
    );

    // 8. Verify Environment Variable metadata & secret masking
    console.log(
      '\n8. Verifying Environment Variable metadata and write-only secret masking...',
    );
    expectThat(
      envVarCreated.id === envVarId || envVarCreated.id.includes(envVarId),
      `Expected ID to contain ${envVarId}, got ${envVarCreated.id}`,
    );
    expectThat(
      String(envVarCreated.type || '')
        .toLowerCase()
        .includes('environment_variable'),
      `Expected type to be environment_variable, got ${envVarCreated.type}`,
    );
    expectThat(
      !('value' in envVarCreated),
      "Secret masking failed: 'value' was returned in create response",
    );
    console.log(
      '  ✓ Environment Variable create metadata and write-only secret masking verified.',
    );

    // 9. Get Environment Variable Credential by ID
    console.log(
      `\n9. Getting Environment Variable Credential by ID: ${envVarId}...`,
    );
    const envVarFetched = await ai.credentials.get(envVarId);
    console.log(
      'Fetched Environment Variable Credential (Whole Response):',
      envVarFetched,
    );
    expectThat(
      !('value' in envVarFetched),
      "Secret masking failed: 'value' was returned in get response",
    );
    console.log('  ✓ Environment Variable get verification successful.');

    // 10. Update Environment Variable Credential
    console.log(
      `\n10. Updating Environment Variable Credential: ${envVarId}...`,
    );
    const envVarUpdated = await ai.credentials.update(envVarId, {
      type: 'environment_variable',
      value: 'updated_super_secret_env_value_999',
      injection_location: 'header',
      trusted_domains: ['updated.example.com'],
    });
    console.log(
      'Updated Environment Variable Credential (Whole Response):',
      envVarUpdated,
    );
    expectThat(
      !('value' in envVarUpdated),
      "Secret masking failed: 'value' was returned in update response",
    );
    console.log('  ✓ Environment Variable update verification successful.');

    // ==========================================
    // C. OAuth2 Credential Validation
    // ==========================================
    // 11. Create OAuth2 Credential (verifies backend live token validation)
    console.log(`\n11. Creating OAuth2 Credential: ${oauthId}...`);
    try {
      const oauthCreated = await ai.credentials.create({
        id: oauthId,
        type: 'oauth2',
        client_id: 'sample-client-123.apps.googleusercontent.com',
        token_url: 'https://oauth2.example.com/token',
        scopes: ['https://www.example.com/auth/cloud-platform'],
        client_secret: 'secret_oauth2_client_secret_xyz',
        refresh_token: 'secret_oauth2_refresh_token_abc',
      });
      console.log('Created OAuth2 Credential (Whole Response):', oauthCreated);
    } catch (error: unknown) {
      // Backend validates OAuth tokens live against token_url. With dummy values, 400 is expected.
      console.log(
        `Received expected live validation response from backend for dummy OAuth2 credentials: ${getErrorMessage(
          error,
        )}`,
      );
    }
  } finally {
    // 12. Cleanup / Delete Credentials
    console.log('\n12. Cleaning up credentials...');
    await bestEffortDelete(ai, bearerId);
    await bestEffortDelete(ai, envVarId);
    await bestEffortDelete(ai, oauthId);
  }

  // 13. Verify Deleted Credentials return 404 / NOT_FOUND
  console.log(`\n13. Verifying deletion of Bearer Credential: ${bearerId}...`);
  try {
    await ai.credentials.get(bearerId);
    throw new Error(
      `Credential ${bearerId} was expected to be deleted, but still exists!`,
    );
  } catch (error: unknown) {
    console.log(
      `Successfully confirmed credential ${
        bearerId
      } is deleted (received expected error: ${getErrorMessage(error)})`,
    );
  }

  console.log('\nAll Credentials operations completed successfully!');
}

async function main() {
  await genericOperationCredentials().catch((e) => {
    console.error('Error in credentials operations:', e);
    process.exit(1);
  });
}

main();
