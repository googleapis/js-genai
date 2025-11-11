/**
 * Real proxy test with actual API calls
 */

import {GoogleGenAI} from '@google/genai';

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';

async function testDirectCall() {
  console.log('\n=== Test 1: Direct API call (no proxy) ===');

  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: false  // Explicitly disable proxy
    }
  });

  try {
    console.log('Making API call...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Say hello in exactly 3 words'
    });

    console.log('✅ Success!');
    console.log('Response:', response.text);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message);
    }
    return false;
  }
}

async function testWithProxyConfig() {
  console.log('\n=== Test 2: With proxy configuration ===');

  // Test that proxy config is accepted (won't actually work without real proxy)
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: 'http://localhost:8888'
    }
  });

  console.log('SDK created with proxy config');
  console.log('Proxy setting:', ai.apiClient.clientOptions.httpOptions.proxy);

  // Try the call (will fail if no proxy server, but shows config is used)
  try {
    console.log('Attempting API call through proxy...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Say hello in exactly 3 words'
    });

    console.log('✅ Success with proxy!');
    console.log('Response:', response.text);
    return true;
  } catch (error) {
    console.log('⚠️  Call failed (expected if no proxy server running)');
    console.log('Error:', error.message);
    return false;
  }
}

async function testWithEnvProxy() {
  console.log('\n=== Test 3: With environment variable ===');

  // Set env var
  process.env.HTTPS_PROXY = 'http://localhost:8888';

  const ai = new GoogleGenAI({
    apiKey: API_KEY
  });

  console.log('SDK created, should auto-detect HTTPS_PROXY');

  try {
    console.log('Attempting API call with env proxy...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Say hello in exactly 3 words'
    });

    console.log('✅ Success with env proxy!');
    console.log('Response:', response.text);
    return true;
  } catch (error) {
    console.log('⚠️  Call failed (expected if no proxy server running)');
    console.log('Error:', error.message);
    return false;
  } finally {
    delete process.env.HTTPS_PROXY;
  }
}

// Run tests
console.log('🧪 Testing Proxy Agent Implementation');
console.log('Using API Key:', API_KEY.substring(0, 15) + '...');

testDirectCall()
  .then(() => testWithProxyConfig())
  .then(() => testWithEnvProxy())
  .then(() => {
    console.log('\n✅ Tests completed!');
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error);
  });
