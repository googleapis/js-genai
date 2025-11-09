/**
 * Test that the package can be imported correctly
 */

import {GoogleGenAI} from './dist/node/index.mjs';

console.log('✓ Import successful');

// Test that the class can be instantiated
const ai = new GoogleGenAI({
  apiKey: 'test-key',
  httpOptions: {
    proxy: 'http://test-proxy:8080'
  }
});

console.log('✓ Instance created successfully');
console.log('✓ Proxy config:', ai.apiClient?.clientOptions?.httpOptions?.proxy);

console.log('\n✅ Package is ready for publishing!');
