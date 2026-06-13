/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * g3-prettier-ignore-file
 */

import * as models from "../models/index.js";
import { env } from "../lib/env.js";
import { RequestInput } from "../lib/http.js";
import {
  BeforeCreateRequestContext,
  BeforeCreateRequestHook,
  BeforeRequestContext,
  BeforeRequestHook,
} from "./types.js";

export const GOOGLE_GENAI_API_REVISION = "2026-05-20";

type GoogleGenAISecurity = models.Security;

type GoogleGenAISecurityResolver = {
  defaultHeaders?: HeadersInit | undefined;
  getDefaultHeaders?: () => HeadersInit | undefined;
  resolveGoogleGenAISecurity?: (
    url: string,
  ) =>
    | GoogleGenAISecurity
    | undefined
    | Promise<GoogleGenAISecurity | undefined>;
};

export class GoogleGenAISecurityProvider {
  constructor(
    private readonly options: {
      defaultHeaders?: HeadersInit | undefined;
      getAuthHeaders: (url?: string) => Headers | Promise<Headers>;
    },
  ) {}

  getDefaultHeaders(): HeadersInit | undefined {
    return this.options.defaultHeaders;
  }

  async resolveGoogleGenAISecurity(
    url: string,
  ): Promise<GoogleGenAISecurity | undefined> {
    return securityFromHeaders(await this.options.getAuthHeaders(url));
  }
}

export class GoogleGenAIAuthHook
  implements BeforeCreateRequestHook, BeforeRequestHook
{
  beforeCreateRequest(
    _hookCtx: BeforeCreateRequestContext,
    input: RequestInput,
  ): RequestInput {
    return {
      ...input,
      url: decodeSDKLevelAPIVersionPath(input.url),
    };
  }

  async beforeRequest(
    hookCtx: BeforeRequestContext,
    request: Request,
  ): Promise<Request> {
    applyDefaultHeaders(
      request.headers,
      getStaticDefaultHeaders(hookCtx.security_source),
    );
    applyApiRevision(hookCtx, request.headers);
    applyUserProject(hookCtx, request.headers);

    if (hasAuthHeaders(request.headers)) {
      return request;
    }

    const security = await resolveSecurity(
      hookCtx.security_source,
      request.url,
    );
    applyDefaultHeaders(request.headers, security?.default_headers);
    applyAuth(request.headers, security);

    return request;
  }
}

function decodeSDKLevelAPIVersionPath(url: URL): URL {
  const [, apiVersion, ...rest] = url.pathname.split("/");
  if (!apiVersion) {
    return url;
  }

  const decodedAPIVersion = decodeURIComponent(apiVersion);
  if (!decodedAPIVersion.includes("/")) {
    return url;
  }

  const nextURL = new URL(url);
  nextURL.pathname = `/${decodedAPIVersion}/${rest.join("/")}`;
  return nextURL;
}

async function resolveSecurity(
  securitySource: unknown,
  requestURL: string,
): Promise<GoogleGenAISecurity | undefined> {
  if (isSecurityResolver(securitySource)) {
    return securitySource.resolveGoogleGenAISecurity(requestURL);
  }

  const security =
    typeof securitySource === "function"
      ? await securitySource()
      : securitySource;

  if (isSecurity(security)) {
    return withEnvSecurity(security);
  }

  return withEnvSecurity(undefined);
}

function getStaticDefaultHeaders(
  securitySource: unknown,
): HeadersInit | undefined {
  if (isSecurityResolver(securitySource)) {
    return (
      securitySource.getDefaultHeaders?.() ?? securitySource.defaultHeaders
    );
  }

  if (isSecurity(securitySource)) {
    return securitySource.default_headers;
  }

  return undefined;
}

function withEnvSecurity(
  security: GoogleGenAISecurity | undefined,
): GoogleGenAISecurity | undefined {
  const envVars = env();
  const nextSecurity: GoogleGenAISecurity = {
    ...security,
    api_key: security?.api_key ?? envVars.GOOGLE_GENAI_API_KEY,
    access_token: security?.access_token ?? envVars.GOOGLE_GENAI_ACCESS_TOKEN,
  };

  return hasSecurityValue(nextSecurity) ? nextSecurity : undefined;
}

function securityFromHeaders(
  headers: Headers,
): GoogleGenAISecurity | undefined {
  const defaultHeaders: Record<string, string> = {};

  for (const [key, value] of headers) {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== "authorization" && lowerKey !== "x-goog-api-key") {
      defaultHeaders[key] = value;
    }
  }

  const security: GoogleGenAISecurity = {
    access_token: headers.get("authorization") ?? undefined,
    api_key: headers.get("x-goog-api-key") ?? undefined,
    default_headers: Object.keys(defaultHeaders).length
      ? defaultHeaders
      : undefined,
  };

  return hasSecurityValue(security) ? security : undefined;
}

function applyDefaultHeaders(
  target: Headers,
  source: HeadersInit | undefined,
): void {
  if (!source) {
    return;
  }

  for (const [key, value] of new Headers(source)) {
    if (target.get(key) === null) {
      target.set(key, value);
    }
  }
}

function applyApiRevision(
  hookCtx: BeforeRequestContext,
  headers: Headers,
): void {
  if (headers.get("api-revision") === null) {
    headers.set(
      "Api-Revision",
      hookCtx.options.api_revision ?? GOOGLE_GENAI_API_REVISION,
    );
  }
}

function applyUserProject(
  hookCtx: BeforeRequestContext,
  headers: Headers,
): void {
  if (
    hookCtx.options.user_project !== undefined &&
    headers.get("x-goog-user-project") === null
  ) {
    headers.set("x-goog-user-project", hookCtx.options.user_project);
  }
}

function applyAuth(
  headers: Headers,
  security: GoogleGenAISecurity | undefined,
): void {
  if (!security) {
    return;
  }

  if (security.api_key) {
    headers.set("x-goog-api-key", security.api_key);
    return;
  }

  if (security.access_token) {
    headers.set("Authorization", bearer(security.access_token));
  }
}

function hasAuthHeaders(headers: Headers): boolean {
  return (
    headers.get("authorization") !== null ||
    headers.get("x-goog-api-key") !== null
  );
}

function bearer(token: string): string {
  return token.slice(0, 7).toLowerCase() === "bearer "
    ? token
    : `Bearer ${token}`;
}

function isSecurity(value: unknown): value is GoogleGenAISecurity {
  return typeof value === "object" && value !== null;
}

function isSecurityResolver(
  value: unknown,
): value is GoogleGenAISecurityResolver & {
  resolveGoogleGenAISecurity: NonNullable<
    GoogleGenAISecurityResolver["resolveGoogleGenAISecurity"]
  >;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "resolveGoogleGenAISecurity" in value &&
    typeof value.resolveGoogleGenAISecurity === "function"
  );
}

function hasSecurityValue(security: GoogleGenAISecurity): boolean {
  return (
    security.api_key !== undefined ||
    security.access_token !== undefined ||
    security.default_headers !== undefined
  );
}
