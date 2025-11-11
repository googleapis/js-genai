/**
 * Proxy Diagnostics Script
 * 帮助诊断 proxy 连接问题
 */

import {GoogleGenAI} from '@githubmann/google-genai';
import {ProxyAgent} from 'undici';

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';
const PROXY_URL = 'http://127.0.0.1:7890';

console.log('🔍 Proxy Diagnostics Tool\n');
console.log('Testing proxy:', PROXY_URL);
console.log('');

// Test 1: Check if proxy server is reachable
async function testProxyReachability() {
  console.log('=== Test 1: Proxy Server Reachability ===');

  try {
    const agent = new ProxyAgent(PROXY_URL);

    // Try a simple HTTP request through proxy
    const response = await fetch('http://www.google.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    console.log('✅ Proxy server is reachable');
    console.log('   Status:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Cannot reach proxy server');
    console.log('   Error:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');
    console.log('');
    console.log('💡 Possible solutions:');
    console.log('   1. Make sure your proxy server is running on 127.0.0.1:7890');
    console.log('   2. Check if the port is correct');
    console.log('   3. Try: curl -x http://127.0.0.1:7890 http://www.google.com');
    return false;
  }
}

// Test 2: Test HTTPS through proxy
async function testHttpsProxy() {
  console.log('\n=== Test 2: HTTPS Through Proxy ===');

  try {
    const agent = new ProxyAgent(PROXY_URL);

    const response = await fetch('https://www.google.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(5000)
    });

    console.log('✅ HTTPS through proxy works');
    console.log('   Status:', response.status);
    return true;
  } catch (error) {
    console.log('❌ HTTPS through proxy failed');
    console.log('   Error:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');
    console.log('');
    console.log('💡 Your proxy might not support HTTPS CONNECT tunneling');
    return false;
  }
}

// Test 3: Test Google API endpoint
async function testGoogleApiEndpoint() {
  console.log('\n=== Test 3: Google API Endpoint (without SDK) ===');

  try {
    const agent = new ProxyAgent(PROXY_URL);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    const response = await fetch(url, {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000)
    });

    console.log('✅ Can reach Google API through proxy');
    console.log('   Status:', response.status);

    if (response.status === 403) {
      console.log('   Note: 403 means connection works, but API key might have issues');
    }

    return true;
  } catch (error) {
    console.log('❌ Cannot reach Google API through proxy');
    console.log('   Error:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');
    return false;
  }
}

// Test 4: Test with SDK
async function testWithSDK() {
  console.log('\n=== Test 4: Using SDK with Proxy ===');

  try {
    const client = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        proxy: PROXY_URL,
      },
    });

    console.log('✓ SDK client created');
    console.log('✓ Proxy config:', client.apiClient?.clientOptions?.httpOptions?.proxy);

    const chat = client.chats.create({ model: 'gemini-2.0-flash-exp' });

    console.log('✓ Chat created, sending message...');

    const response = await chat.sendMessage({
      message: 'Say "test" in one word',
    });

    console.log('✅ SDK works with proxy!');
    console.log('   Response:', response.text);
    return true;
  } catch (error) {
    console.log('❌ SDK failed with proxy');
    console.log('   Error:', error.message);
    console.log('   Cause:', error.cause?.message || 'N/A');

    // Show detailed error
    if (error.cause) {
      console.log('\n📋 Detailed Error:');
      console.log(error.cause);
    }

    return false;
  }
}

// Test 5: Test without proxy (baseline)
async function testWithoutProxy() {
  console.log('\n=== Test 5: SDK Without Proxy (Baseline) ===');

  try {
    const client = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        proxy: false, // Explicitly disable proxy
      },
    });

    const chat = client.chats.create({ model: 'gemini-2.0-flash-exp' });
    const response = await chat.sendMessage({
      message: 'Say "test" in one word',
    });

    console.log('✅ SDK works without proxy');
    console.log('   Response:', response.text);
    console.log('   → This means SDK is fine, proxy is the issue');
    return true;
  } catch (error) {
    console.log('❌ SDK also fails without proxy');
    console.log('   Error:', error.message);
    console.log('   → This suggests a network or API key issue, not proxy');
    return false;
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('Starting diagnostics...\n');
  console.log('='.repeat(70));

  const results = {
    proxyReachable: await testProxyReachability(),
    httpsProxy: false,
    googleApi: false,
    sdk: false,
    withoutProxy: false,
  };

  if (results.proxyReachable) {
    results.httpsProxy = await testHttpsProxy();

    if (results.httpsProxy) {
      results.googleApi = await testGoogleApiEndpoint();
      results.sdk = await testWithSDK();
    }
  }

  // Always test without proxy
  results.withoutProxy = await testWithoutProxy();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(70));
  console.log('Proxy reachable:        ', results.proxyReachable ? '✅' : '❌');
  console.log('HTTPS through proxy:    ', results.httpsProxy ? '✅' : '❌');
  console.log('Google API via proxy:   ', results.googleApi ? '✅' : '❌');
  console.log('SDK with proxy:         ', results.sdk ? '✅' : '❌');
  console.log('SDK without proxy:      ', results.withoutProxy ? '✅' : '❌');
  console.log('='.repeat(70));

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');

  if (!results.proxyReachable) {
    console.log('❌ PROXY SERVER NOT REACHABLE');
    console.log('   • Make sure your proxy is running: http://127.0.0.1:7890');
    console.log('   • Test with: curl -x http://127.0.0.1:7890 http://www.google.com');
    console.log('   • Common proxy software: v2ray, clash, shadowsocks, squid');
    console.log('   • Check if firewall is blocking port 7890');
  } else if (!results.httpsProxy) {
    console.log('⚠️  PROXY DOES NOT SUPPORT HTTPS');
    console.log('   • Your proxy needs to support HTTPS CONNECT method');
    console.log('   • Check proxy configuration/settings');
  } else if (!results.googleApi) {
    console.log('⚠️  CANNOT REACH GOOGLE API THROUGH PROXY');
    console.log('   • Proxy might be blocking googleapis.com');
    console.log('   • Check proxy whitelist/rules');
  } else if (!results.sdk) {
    console.log('🐛 SDK ISSUE WITH PROXY');
    console.log('   • This might be a bug in the SDK');
    console.log('   • Please report this issue with diagnostic output');
  } else {
    console.log('✅ EVERYTHING WORKS!');
    console.log('   Your proxy is configured correctly.');
  }

  console.log('');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n💥 Diagnostic script crashed:');
  console.error(error);
});
