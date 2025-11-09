/**
 * Test proxy with the fixed implementation (using undici ProxyAgent)
 */

import {GoogleGenAI} from '@google/genai';

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';

console.log('🧪 Testing Fixed Proxy Implementation\n');

// Get the proxy URL from environment
const proxyUrl = process.env.HTTPS_PROXY;
console.log('Environment:');
console.log('  HTTPS_PROXY:', proxyUrl);
console.log('  NO_PROXY:', process.env.NO_PROXY);
console.log('');

// Test 1: Force using proxy by providing it explicitly
console.log('=== Test 1: Explicitly configure proxy (force usage) ===');
if (proxyUrl) {
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: proxyUrl  // Explicitly set proxy to force its use
    }
  });

  try {
    console.log('Making API call through proxy...');
    const startTime = Date.now();

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Say hello in exactly 3 words'
    });

    const duration = Date.now() - startTime;
    console.log(`✅ SUCCESS! (${duration}ms)`);
    console.log('Response:', response.text);
    console.log('');
    console.log('🎉 PROXY IS WORKING with undici ProxyAgent!');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
} else {
  console.log('⚠️  No HTTPS_PROXY set, skipping test');
}

// Test 2: Auto-detect from environment (will respect NO_PROXY)
console.log('\n=== Test 2: Auto-detect from environment (respects NO_PROXY) ===');
const ai2 = new GoogleGenAI({
  apiKey: API_KEY
});

try {
  console.log('Making API call (auto-detect proxy from env)...');
  const response = await ai2.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: 'Say hello in exactly 3 words'
  });

  console.log('✅ SUCCESS!');
  console.log('Response:', response.text);
  console.log('→ Request succeeded (likely bypassed proxy due to NO_PROXY)');
} catch (error) {
  console.error('❌ FAILED:', error.message);
  console.error('→ This is expected if NO_PROXY caused bypass but DNS fails');
}

// Test 3: Explicitly disable proxy
console.log('\n=== Test 3: Explicitly disable proxy ===');
const ai3 = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    proxy: false
  }
});

try {
  console.log('Making API call with proxy disabled...');
  const response = await ai3.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: 'Say hello in exactly 3 words'
  });

  console.log('✅ SUCCESS!');
  console.log('Response:', response.text);
} catch (error) {
  console.error('❌ FAILED:', error.message);
  console.error('→ This is expected in this environment (DNS issue)');
}

console.log('\n' + '='.repeat(70));
console.log('Summary:');
console.log('- Test 1 shows if proxy works when explicitly configured');
console.log('- Test 2 shows auto-detection with NO_PROXY handling');
console.log('- Test 3 shows explicit proxy disable');
console.log('='.repeat(70));
