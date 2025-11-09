/**
 * Test NO_PROXY handling
 */

import {GoogleGenAI} from '@google/genai';

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';

console.log('🔍 Testing NO_PROXY handling\n');

console.log('Environment variables:');
console.log('  HTTPS_PROXY:', process.env.HTTPS_PROXY);
console.log('  NO_PROXY:', process.env.NO_PROXY);
console.log('');

console.log('Testing: generativelanguage.googleapis.com');
console.log('Should bypass proxy because NO_PROXY contains *.googleapis.com');
console.log('');

// Test with default env (should bypass proxy due to NO_PROXY)
console.log('=== Test 1: Using existing env vars (should bypass proxy) ===');
const ai1 = new GoogleGenAI({
  apiKey: API_KEY
});

try {
  console.log('Making API call...');
  const startTime = Date.now();

  const response = await ai1.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: 'Say hello in 3 words'
  });

  const duration = Date.now() - startTime;
  console.log(`✅ SUCCESS! (${duration}ms)`);
  console.log('Response:', response.text);
  console.log('→ This proves NO_PROXY is working correctly!');
} catch (error) {
  console.error('❌ FAILED:', error.message);
  console.error('→ This suggests NO_PROXY is not being respected');

  // Get more error details
  if (error.cause) {
    console.error('Cause:', error.cause);
  }
}

console.log('\n=== Test 2: Force using proxy (should fail without real proxy) ===');

// Temporarily remove NO_PROXY to force proxy usage
const originalNoProxy = process.env.NO_PROXY;
delete process.env.NO_PROXY;

const ai2 = new GoogleGenAI({
  apiKey: API_KEY
});

try {
  console.log('Making API call with proxy forced...');
  const response = await ai2.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: 'Say hello in 3 words'
  });

  console.log('✅ Succeeded (unexpected!)');
  console.log('Response:', response.text);
} catch (error) {
  console.log('❌ Failed as expected (proxy would be used but server might not be configured properly)');
  console.log('Error:', error.message);
}

// Restore NO_PROXY
process.env.NO_PROXY = originalNoProxy;

console.log('\n=== Test 3: Explicitly disable proxy ===');
const ai3 = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    proxy: false
  }
});

try {
  console.log('Making API call with proxy explicitly disabled...');
  const response = await ai3.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: 'Say hello in 3 words'
  });

  console.log('✅ SUCCESS!');
  console.log('Response:', response.text);
} catch (error) {
  console.error('❌ FAILED:', error.message);
}
