# Proxy Support

The Google GenAI SDK supports HTTP and HTTPS proxy configurations for both Gemini API and Vertex AI API requests in Node.js environments.

## Features

- ✅ HTTP and HTTPS proxy support
- ✅ Automatic proxy detection from environment variables
- ✅ Programmatic proxy configuration
- ✅ Proxy authentication support
- ✅ NO_PROXY support for bypassing specific domains
- ✅ Works with both Gemini API and Vertex AI

## Installation

Proxy support requires the `https-proxy-agent` package, which is included as a dependency:

```bash
npm install @google/genai
```

## Usage

### 1. Using Environment Variables (Recommended)

The SDK automatically reads proxy settings from environment variables:

```bash
# For HTTP requests
export HTTP_PROXY=http://proxy.example.com:8080
export http_proxy=http://proxy.example.com:8080

# For HTTPS requests
export HTTPS_PROXY=https://proxy.example.com:8080
export https_proxy=https://proxy.example.com:8080

# Bypass proxy for specific domains
export NO_PROXY=localhost,127.0.0.1,.local
export no_proxy=localhost,127.0.0.1,.local
```

Then use the SDK normally:

```typescript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: 'your-api-key'
});
```

### 2. Using a Proxy URL String

Configure proxy programmatically using a URL string:

```typescript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: 'your-api-key',
  httpOptions: {
    proxy: 'http://proxy.example.com:8080'
  }
});
```

**With authentication:**

```typescript
const ai = new GoogleGenAI({
  apiKey: 'your-api-key',
  httpOptions: {
    proxy: 'http://username:password@proxy.example.com:8080'
  }
});
```

### 3. Using a Proxy Configuration Object

For more control, use a proxy configuration object:

```typescript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: 'your-api-key',
  httpOptions: {
    proxy: {
      host: 'proxy.example.com',
      port: 8080,
      protocol: 'http',  // 'http' or 'https'
      auth: 'username:password'  // Optional
    }
  }
});
```

### 4. Disabling Proxy

To explicitly disable proxy even when environment variables are set:

```typescript
const ai = new GoogleGenAI({
  apiKey: 'your-api-key',
  httpOptions: {
    proxy: false
  }
});
```

### 5. Per-Request Proxy Configuration

You can also configure proxy settings for individual requests:

```typescript
const model = ai.models.get({model: 'gemini-2.0-flash-exp'});

const response = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [{text: 'Hello!'}]
  }],
  httpOptions: {
    proxy: 'http://custom-proxy.example.com:8080'
  }
});
```

## Proxy Priority

The SDK resolves proxy settings in the following order (highest to lowest priority):

1. **Request-level proxy** - Proxy specified in individual request `httpOptions`
2. **Client-level proxy** - Proxy specified in `GoogleGenAI` constructor `httpOptions`
3. **Environment variables** - System environment variables (HTTP_PROXY, HTTPS_PROXY, etc.)

Setting `proxy: false` at any level will disable proxy usage for that level and below.

## NO_PROXY Support

The SDK respects the `NO_PROXY` environment variable to bypass the proxy for specific domains:

```bash
export NO_PROXY=localhost,127.0.0.1,.example.com,*.local
```

Supported patterns:
- Exact match: `example.com`
- Wildcard: `*.example.com` or `.example.com`
- Domain suffix: `.example.com` matches `api.example.com`

## Vertex AI Example

Proxy works seamlessly with Vertex AI:

```typescript
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'your-project-id',
  location: 'us-central1',
  httpOptions: {
    proxy: 'http://proxy.example.com:8080'
  }
});
```

## Common Use Cases

### Corporate Networks

```typescript
// Use corporate proxy with authentication
const ai = new GoogleGenAI({
  apiKey: 'your-api-key',
  httpOptions: {
    proxy: {
      host: 'corporate-proxy.company.com',
      port: 3128,
      protocol: 'http',
      auth: 'domain\\username:password'
    }
  }
});
```

### Development with Local Proxy

```bash
# Set up a local proxy for debugging
export HTTP_PROXY=http://localhost:8888
export HTTPS_PROXY=http://localhost:8888
```

### Cloud Environments

```typescript
// Use environment-specific proxy from environment variables
// Set in your cloud platform (AWS, GCP, Azure)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
  // Proxy automatically read from environment
});
```

## Troubleshooting

### Proxy Not Working

1. Ensure `https-proxy-agent` is installed:
   ```bash
   npm list https-proxy-agent
   ```

2. Check environment variables:
   ```bash
   echo $HTTP_PROXY
   echo $HTTPS_PROXY
   ```

3. Verify proxy URL format:
   ```
   http://[username:password@]host:port
   ```

### Authentication Issues

- Ensure credentials are URL-encoded
- Check if your proxy requires NTLM or other advanced authentication
- Try using the proxy configuration object format

### SSL/TLS Issues

If you encounter SSL errors with HTTPS proxies:

```typescript
// Some proxies may require specific TLS settings
// Contact your network administrator for the correct configuration
```

## Browser Support

**Note:** Proxy configuration is only supported in Node.js environments. In browser environments:
- The `proxy` option is ignored
- Proxy settings are managed by the browser/OS
- Set proxy in browser settings or system preferences

## Security Considerations

1. **Never commit proxy credentials** to version control
2. Use environment variables for sensitive information
3. Consider using secret management services for production
4. Rotate proxy credentials regularly
5. Use HTTPS proxies when possible

## Example Code

See `examples/proxy-example.js` for complete working examples.

## API Reference

### ProxyConfig Interface

```typescript
interface ProxyConfig {
  host: string;           // Proxy server hostname
  port: number;           // Proxy server port
  protocol?: 'http' | 'https';  // Defaults to 'http'
  auth?: string;          // Format: 'username:password'
}
```

### HttpOptions.proxy

```typescript
httpOptions: {
  proxy?: string | ProxyConfig | false;
}
```

- `string`: Proxy URL (e.g., `'http://proxy.example.com:8080'`)
- `ProxyConfig`: Advanced configuration object
- `false`: Explicitly disable proxy

## Support

For issues or questions about proxy support, please file an issue on our [GitHub repository](https://github.com/googleapis/js-genai/issues).
