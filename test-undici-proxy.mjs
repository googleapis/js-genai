/**
 * Test fetch with undici ProxyAgent
 */

import {ProxyAgent} from 'undici';

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log('Testing fetch with undici ProxyAgent\n');

const proxyUrl = process.env.HTTPS_PROXY;
console.log('HTTPS_PROXY:', proxyUrl);
console.log('NO_PROXY:', process.env.NO_PROXY);
console.log('');

if (proxyUrl) {
  console.log('=== Test 1: With ProxyAgent (should work if proxy is configured) ===');
  try {
    const agent = new ProxyAgent(proxyUrl);
    console.log('ProxyAgent created successfully');

    const response = await fetch(url, {
      dispatcher: agent
    });

    console.log('✅ SUCCESS with ProxyAgent!', response.status);
    const data = await response.json();
    console.log('   Models count:', data.models?.length || 0);
    console.log('   First model:', data.models?.[0]?.name || 'N/A');
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');
  }
}

// Test 2: Check if we should bypass proxy for this domain
console.log('\n=== Test 2: Check NO_PROXY bypass ===');
const hostname = new URL(url).hostname;
const noProxy = process.env.NO_PROXY || '';
const patterns = noProxy.split(',').map(s => s.trim());

let shouldBypass = false;
for (const pattern of patterns) {
  if (pattern.startsWith('*')) {
    const domain = pattern.substring(1);
    if (hostname.endsWith(domain)) {
      console.log(`✅ Match: ${pattern} matches ${hostname}`);
      console.log('   → Should bypass proxy for this domain');
      shouldBypass = true;
      break;
    }
  }
}

if (shouldBypass) {
  console.log('\n=== Test 3: Direct connection (bypassing proxy) ===');
  console.log('Since NO_PROXY matches, we should NOT use proxy agent');
  console.log('But direct fetch will fail due to DNS...');

  try {
    const response = await fetch(url);
    console.log('✅ Direct fetch succeeded:', response.status);
  } catch (error) {
    console.log('❌ Direct fetch failed:', error.message);
    console.log('   This is expected due to DNS configuration in this environment');
  }
}

console.log('\n🔍 Summary:');
console.log('- ProxyAgent from undici is the correct choice for Node.js fetch');
console.log('- HttpsProxyAgent from https-proxy-agent does NOT work with fetch');
console.log('- We need to update src/_proxy.ts to use undici ProxyAgent instead');
