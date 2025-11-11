/**
 * 快速测试你的 proxy 配置
 *
 * 使用方法：
 * 1. 修改下面的 PROXY_PORT 为你的实际端口
 * 2. 运行: node test-your-proxy.mjs
 */

import {GoogleGenAI} from '@githubmann/google-genai';
import {ProxyAgent} from 'undici';

// 🔧 修改这里的端口号为你的实际端口
const PROXY_PORT = 7890;  // 常见: 7890 (Clash), 10809 (v2ray), 1080 (Shadowsocks)
const PROXY_URL = `http://127.0.0.1:${PROXY_PORT}`;

const API_KEY = 'AIzaSyCLy1-EbdPx7nHZKALXXC4-j2nFeBHACGk';

console.log(`🧪 Testing proxy: ${PROXY_URL}\n`);

// Step 1: Test if proxy is reachable
console.log('Step 1: Testing proxy connectivity...');
try {
  const agent = new ProxyAgent(PROXY_URL);
  const response = await fetch('http://www.google.com', {
    dispatcher: agent,
    signal: AbortSignal.timeout(5000),
  });
  console.log('✅ Proxy is reachable!\n');
} catch (error) {
  console.log('❌ Proxy is NOT reachable!');
  console.log(`   Error: ${error.message}`);
  console.log(`   Cause: ${error.cause?.message || 'N/A'}\n`);
  console.log('💡 Solutions:');
  console.log(`   1. Make sure your proxy is running on port ${PROXY_PORT}`);
  console.log('   2. Try different ports: 7890, 10809, 1080');
  console.log('   3. Check your proxy software settings');
  process.exit(1);
}

// Step 2: Test with SDK
console.log('Step 2: Testing with Google GenAI SDK...');
try {
  const client = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      proxy: PROXY_URL,
    },
  });

  const chat = client.chats.create({ model: 'gemini-2.0-flash-exp' });
  const response = await chat.sendMessage({
    message: 'Say hello in 3 words',
  });

  console.log('✅ SDK works with proxy!');
  console.log(`   Response: ${response.text}\n`);
  console.log('🎉 Success! Your proxy configuration is correct.');
  console.log(`   Use: proxy: '${PROXY_URL}' in your code`);

} catch (error) {
  console.log('❌ SDK failed');
  console.log(`   Error: ${error.message}`);
  console.log(`   Cause: ${error.cause?.message || 'N/A'}\n`);

  if (error.message.includes('403')) {
    console.log('💡 Note: 403 error means proxy works, but API key has issues');
  }
}
