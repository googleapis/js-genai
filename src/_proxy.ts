/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as types from './types.js';

/**
 * Checks if we're in a Node.js environment with process.env available
 */
function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env !== undefined &&
    process.env !== null
  );
}

/**
 * Gets an environment variable value safely
 */
function getEnvVar(name: string): string | undefined {
  if (!isNodeEnvironment()) {
    return undefined;
  }
  return process.env[name];
}

/**
 * Gets the proxy URL from environment variables based on the target URL protocol.
 * @param targetUrl The URL being requested
 * @returns The proxy URL or undefined if no proxy is configured
 */
export function getProxyFromEnvironment(targetUrl: string): string | undefined {
  if (!isNodeEnvironment()) {
    return undefined;
  }

  const url = new URL(targetUrl);
  const protocol = url.protocol.toLowerCase();

  // Check if the target URL should bypass the proxy
  if (shouldBypassProxy(url.hostname)) {
    return undefined;
  }

  // Get proxy URL based on protocol
  if (protocol === 'https:') {
    return (
      getEnvVar('HTTPS_PROXY') ||
      getEnvVar('https_proxy') ||
      getEnvVar('HTTP_PROXY') ||
      getEnvVar('http_proxy')
    );
  } else if (protocol === 'http:') {
    return getEnvVar('HTTP_PROXY') || getEnvVar('http_proxy');
  }

  return undefined;
}

/**
 * Checks if a hostname should bypass the proxy based on NO_PROXY environment variable.
 * @param hostname The hostname to check
 * @returns True if the hostname should bypass the proxy
 */
function shouldBypassProxy(hostname: string): boolean {
  const noProxy = getEnvVar('NO_PROXY') || getEnvVar('no_proxy');
  if (!noProxy) {
    return false;
  }

  const patterns = noProxy.split(',').map((s: string) => s.trim());
  const normalizedHostname = hostname.toLowerCase();

  for (const pattern of patterns) {
    if (!pattern) continue;

    const normalizedPattern = pattern.toLowerCase();

    // Exact match
    if (normalizedHostname === normalizedPattern) {
      return true;
    }

    // Wildcard match (e.g., *.example.com or .example.com)
    if (normalizedPattern.startsWith('*')) {
      const domain = normalizedPattern.substring(1);
      if (normalizedHostname.endsWith(domain)) {
        return true;
      }
    } else if (normalizedPattern.startsWith('.')) {
      if (normalizedHostname.endsWith(normalizedPattern)) {
        return true;
      }
    }

    // Domain suffix match
    if (normalizedHostname.endsWith('.' + normalizedPattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Converts a ProxyConfig object to a proxy URL string.
 * @param config The proxy configuration object
 * @returns The proxy URL string
 */
export function proxyConfigToUrl(config: types.ProxyConfig): string {
  const protocol = config.protocol || 'http';
  const auth = config.auth ? `${config.auth}@` : '';
  return `${protocol}://${auth}${config.host}:${config.port}`;
}

/**
 * Resolves the proxy URL to use for a given request.
 * @param targetUrl The URL being requested
 * @param proxyOption The proxy option from HttpOptions
 * @returns The proxy URL to use, or undefined if no proxy should be used
 */
export function resolveProxyUrl(
  targetUrl: string,
  proxyOption?: string | types.ProxyConfig | false,
): string | undefined {
  // If proxy is explicitly disabled, don't use any proxy
  if (proxyOption === false) {
    return undefined;
  }

  // If a proxy is explicitly configured, use it
  if (typeof proxyOption === 'string') {
    return proxyOption;
  } else if (typeof proxyOption === 'object' && proxyOption !== null) {
    return proxyConfigToUrl(proxyOption);
  }

  // Fall back to environment variables
  return getProxyFromEnvironment(targetUrl);
}

/**
 * Creates a proxy agent for Node.js fetch requests.
 * Node.js v18+ uses undici for fetch, which requires undici's ProxyAgent.
 * This function dynamically imports the undici library to avoid
 * bundling it in web environments.
 * @param proxyUrl The proxy URL
 * @returns A proxy agent or undefined if the library is not available
 */
export async function createProxyAgent(
  proxyUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | undefined> {
  if (!isNodeEnvironment()) {
    return undefined;
  }

  try {
    // Node.js v18+ uses undici for fetch, which requires ProxyAgent from undici
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {ProxyAgent} = (await import('undici')) as any;
    return new ProxyAgent(proxyUrl);
  } catch (error) {
    console.warn('undici not available. Proxy support is disabled.', error);
    return undefined;
  }
}
