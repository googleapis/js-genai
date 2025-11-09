/**
 * Test fetch with HttpsProxyAgent
 */

import {HttpsProxyAgent} from 'https-proxy-agent';

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log('Testing fetch with HttpsProxyAgent\n');

// Test 1: Direct fetch (should fail with DNS error)
console.log('=== Test 1: Direct fetch (no agent) ===');
try {
  const response = await fetch(url);
  console.log('✅ Success:', response.status);
} catch (error) {
  console.log('❌ Failed:', error.message);
  console.log('   Cause:', error.cause?.message || 'N/A');
}

// Test 2: With HttpsProxyAgent using env proxy
console.log('\n=== Test 2: With HttpsProxyAgent (using env HTTPS_PROXY) ===');
const proxyUrl = process.env.HTTPS_PROXY;
console.log('Proxy URL:', proxyUrl);

if (proxyUrl) {
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    console.log('Agent created:', agent.constructor.name);

    const response = await fetch(url, {
      // Try dispatcher option (undici-style)
      dispatcher: agent
    });

    console.log('✅ Success with dispatcher:', response.status);
    const data = await response.json();
    console.log('   Models:', data.models?.length || 0);
  } catch (error) {
    console.log('❌ Failed with dispatcher:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');
  }

  // Test 3: Try with agent option
  console.log('\n=== Test 3: With HttpsProxyAgent (using agent option) ===');
  try {
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch(url, {
      // Try agent option (traditional Node.js style)
      agent: agent
    });

    console.log('✅ Success with agent:', response.status);
    const data = await response.json();
    console.log('   Models:', data.models?.length || 0);
  } catch (error) {
    console.log('❌ Failed with agent:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');
  }
}

// Test 4: Manually bypass proxy (use direct connection)
console.log('\n=== Test 4: NO_PROXY bypass test ===');
console.log('NO_PROXY:', process.env.NO_PROXY);
console.log('Target: generativelanguage.googleapis.com');
console.log('Should match: *.googleapis.com');

// Test the bypass logic manually
const hostname = 'generativelanguage.googleapis.com';
const noProxyPatterns = (process.env.NO_PROXY || '').split(',').map(s => s.trim());

for (const pattern of noProxyPatterns) {
  if (pattern.startsWith('*')) {
    const domain = pattern.substring(1);
    if (hostname.endsWith(domain)) {
      console.log(`✅ Match found: ${pattern} matches ${hostname}`);
      console.log('   → Should bypass proxy!');
      break;
    }
  }
}
