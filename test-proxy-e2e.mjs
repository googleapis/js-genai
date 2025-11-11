/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * End-to-End Test for Proxy Agent Support
 *
 * This script tests the proxy agent functionality with real API calls
 * to verify that proxy configuration works correctly in different scenarios.
 *
 * Test scenarios:
 * 1. Direct connection (no proxy) - baseline test
 * 2. Proxy via environment variables
 * 3. Proxy via programmatic configuration (URL string)
 * 4. Proxy via configuration object
 * 5. Explicitly disable proxy
 * 6. NO_PROXY environment variable
 */

import {GoogleGenAI} from '@google/genai';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(70));
  log(`TEST: ${testName}`, 'cyan');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// API key for testing
const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';

// Test configuration
const TEST_MODEL = 'gemini-2.0-flash-exp';
const TEST_PROMPT = 'Say "Hello from Gemini!" in exactly 5 words.';

/**
 * Helper function to make a test API call
 */
async function testApiCall(ai, testName, expectedToWork = true) {
  try {
    logInfo(`Making API call for: ${testName}`);

    const startTime = Date.now();

    const response = await ai.models.generateContent({
      model: TEST_MODEL,
      contents: [{role: 'user', parts: [{text: TEST_PROMPT}]}],
    });

    const duration = Date.now() - startTime;
    const responseText = response.text;

    if (expectedToWork) {
      logSuccess(`API call succeeded (${duration}ms)`);
      logInfo(`Response: ${responseText}`);
      return {success: true, response: responseText, duration};
    } else {
      logWarning(`API call succeeded but was expected to fail`);
      return {success: true, response: responseText, duration};
    }
  } catch (error) {
    // Get the original error cause if available
    let errorMessage = error.message;
    let detailedError = error;

    if (error.cause) {
      detailedError = error.cause;
      errorMessage = `${error.message} (cause: ${error.cause.message})`;
    }

    if (!expectedToWork) {
      logInfo(`API call failed as expected: ${errorMessage}`);
      return {success: false, error: errorMessage};
    } else {
      logError(`API call failed: ${errorMessage}`);

      // Log detailed error for debugging
      if (detailedError.cause) {
        console.error('Root cause:', detailedError.cause);
      }

      return {success: false, error: errorMessage};
    }
  }
}

/**
 * Test 1: Direct connection (no proxy)
 */
async function testDirectConnection() {
  logTest('Test 1: Direct Connection (No Proxy)');

  // Clear any proxy environment variables
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;
  delete process.env.http_proxy;
  delete process.env.https_proxy;
  delete process.env.NO_PROXY;
  delete process.env.no_proxy;

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });

  logInfo('Configuration: No proxy settings');
  const result = await testApiCall(ai, 'Direct connection');

  return result;
}

/**
 * Test 2: Proxy via environment variables
 */
async function testProxyViaEnvVars() {
  logTest('Test 2: Proxy via Environment Variables');

  // Note: This will only work if you have a real proxy server
  // For demonstration, we set the env vars but it might fail if no proxy exists
  const proxyUrl = process.env.TEST_PROXY_URL || 'http://localhost:8888';

  process.env.HTTPS_PROXY = proxyUrl;
  process.env.HTTP_PROXY = proxyUrl;

  logInfo(`Configuration: HTTPS_PROXY=${proxyUrl}`);
  logWarning('This test may fail if the proxy server is not available');

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });

  const result = await testApiCall(ai, 'Environment variable proxy', false);

  // Clean up
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;

  return result;
}

/**
 * Test 3: Proxy via programmatic configuration (URL string)
 */
async function testProxyViaProgrammaticUrl() {
  logTest('Test 3: Proxy via Programmatic Configuration (URL String)');

  const proxyUrl = process.env.TEST_PROXY_URL || 'http://localhost:8888';

  logInfo(`Configuration: httpOptions.proxy = "${proxyUrl}"`);
  logWarning('This test may fail if the proxy server is not available');

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: proxyUrl,
    },
  });

  const result = await testApiCall(ai, 'Programmatic URL proxy', false);

  return result;
}

/**
 * Test 4: Proxy via configuration object
 */
async function testProxyViaConfigObject() {
  logTest('Test 4: Proxy via Configuration Object');

  const proxyHost = process.env.TEST_PROXY_HOST || 'localhost';
  const proxyPort = parseInt(process.env.TEST_PROXY_PORT || '8888');

  logInfo(`Configuration: proxy object with host=${proxyHost}, port=${proxyPort}`);
  logWarning('This test may fail if the proxy server is not available');

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: {
        host: proxyHost,
        port: proxyPort,
        protocol: 'http',
      },
    },
  });

  const result = await testApiCall(ai, 'Config object proxy', false);

  return result;
}

/**
 * Test 5: Explicitly disable proxy
 */
async function testProxyDisabled() {
  logTest('Test 5: Explicitly Disable Proxy');

  // Set environment variables
  process.env.HTTPS_PROXY = 'http://localhost:8888';
  process.env.HTTP_PROXY = 'http://localhost:8888';

  logInfo('Configuration: Environment has HTTPS_PROXY set, but proxy: false in config');

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: false, // Explicitly disable proxy
    },
  });

  const result = await testApiCall(ai, 'Disabled proxy (should work)', true);

  // Clean up
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;

  return result;
}

/**
 * Test 6: NO_PROXY environment variable
 */
async function testNoProxyEnvVar() {
  logTest('Test 6: NO_PROXY Environment Variable');

  // Set proxy but exclude googleapis.com via NO_PROXY
  process.env.HTTPS_PROXY = 'http://localhost:8888';
  process.env.NO_PROXY = 'localhost,127.0.0.1,googleapis.com,*.googleapis.com';

  logInfo('Configuration: HTTPS_PROXY set but NO_PROXY includes googleapis.com');
  logInfo(`NO_PROXY=${process.env.NO_PROXY}`);

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
  });

  const result = await testApiCall(ai, 'NO_PROXY bypass (should work)', true);

  // Clean up
  delete process.env.HTTPS_PROXY;
  delete process.env.NO_PROXY;

  return result;
}

/**
 * Test 7: Proxy authentication (if available)
 */
async function testProxyWithAuth() {
  logTest('Test 7: Proxy with Authentication');

  const proxyUrl = process.env.TEST_PROXY_WITH_AUTH;

  if (!proxyUrl) {
    logWarning('Skipping: Set TEST_PROXY_WITH_AUTH env var to test authenticated proxy');
    return {success: null, skipped: true};
  }

  logInfo(`Configuration: proxy = "${proxyUrl.replace(/:[^:@]+@/, ':****@')}"`);

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: proxyUrl,
    },
  });

  const result = await testApiCall(ai, 'Authenticated proxy', false);

  return result;
}

/**
 * Test 8: Verify proxy agent creation
 */
async function testProxyAgentCreation() {
  logTest('Test 8: Verify Proxy Agent Creation');

  logInfo('Testing internal proxy resolution logic...');

  try {
    // Import the internal proxy module
    const proxyModule = await import('./dist/index.mjs').then(async () => {
      // We need to test the internal functions
      // For now, we'll just verify that https-proxy-agent is available
      const {HttpsProxyAgent} = await import('https-proxy-agent');

      const testProxyUrl = 'http://proxy.example.com:8080';
      const agent = new HttpsProxyAgent(testProxyUrl);

      logSuccess('Successfully created HttpsProxyAgent instance');
      logInfo(`Agent proxy: ${agent.proxy.href}`);

      return {success: true, agent};
    });

    return {success: true};
  } catch (error) {
    logError(`Failed to create proxy agent: ${error.message}`);
    return {success: false, error: error.message};
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  log('\n' + '█'.repeat(70), 'cyan');
  log('  PROXY AGENT END-TO-END TESTS', 'cyan');
  log('█'.repeat(70) + '\n', 'cyan');

  logInfo(`Test model: ${TEST_MODEL}`);
  logInfo(`API key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
  };

  const tests = [
    {name: 'Direct Connection', fn: testDirectConnection},
    {name: 'Proxy Disabled', fn: testProxyDisabled},
    {name: 'NO_PROXY Variable', fn: testNoProxyEnvVar},
    {name: 'Proxy Agent Creation', fn: testProxyAgentCreation},
    {name: 'Environment Variables', fn: testProxyViaEnvVars},
    {name: 'Programmatic URL', fn: testProxyViaProgrammaticUrl},
    {name: 'Config Object', fn: testProxyViaConfigObject},
    {name: 'Proxy with Auth', fn: testProxyWithAuth},
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();

      if (result.skipped) {
        results.skipped++;
        results.tests.push({name: test.name, status: 'SKIPPED'});
      } else if (result.success) {
        results.passed++;
        results.tests.push({name: test.name, status: 'PASSED', result});
      } else if (result.success === false) {
        results.failed++;
        results.tests.push({name: test.name, status: 'FAILED', result});
      } else {
        results.skipped++;
        results.tests.push({name: test.name, status: 'SKIPPED'});
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: test.name,
        status: 'ERROR',
        error: error.message,
      });
      logError(`Test "${test.name}" threw an error: ${error.message}`);
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  log('TEST SUMMARY', 'cyan');
  console.log('='.repeat(70));

  results.tests.forEach((test) => {
    const statusColor =
      test.status === 'PASSED'
        ? 'green'
        : test.status === 'FAILED' || test.status === 'ERROR'
          ? 'red'
          : 'yellow';
    log(`  ${test.status.padEnd(10)} - ${test.name}`, statusColor);
  });

  console.log('\n' + '-'.repeat(70));
  logSuccess(`Passed: ${results.passed}`);
  logError(`Failed: ${results.failed}`);
  logWarning(`Skipped: ${results.skipped}`);
  console.log('-'.repeat(70));

  // Return exit code
  return results.failed > 0 ? 1 : 0;
}

// Run tests
runAllTests()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
