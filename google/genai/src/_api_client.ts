/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';

import * as types from './types';
import {HttpOptions} from './types';

const AUTHORIZATION_HEADER = 'Authorization';
const CONTENT_TYPE_HEADER = 'Content-Type';
const USER_AGENT_HEADER = 'User-Agent';
const GOOGLE_API_KEY = 'x-goog-api-key';
const GOOGLE_API_CLIENT_HEADER = 'x-goog-api-client';
const REQUIRED_VERTEX_AI_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform';
const SDK_VERSION = '0.1.0'; // x-release-please-version
const LIBRARY_LABEL = `google-genai-sdk/${SDK_VERSION}`;
const LANGUAGE_LABEL_PREFIX = 'gl-node/';
const VERTEX_AI_API_DEFAULT_VERSION = 'v1beta1';
const GOOGLE_AI_API_DEFAULT_VERSION = 'v1beta';
const responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
function getEnv(env: string): string | undefined {
  return process?.env?.[env]?.trim() ?? undefined;
}

function getBooleanEnv(env: string): boolean {
  return stringToBoolean(getEnv(env));
}
function stringToBoolean(str?: string): boolean {
  if (str === undefined) {
    return false;
  }
  return str.toLowerCase() === 'true';
}

// Client errors raised by the GenAI API.
export class ClientError extends Error {
  constructor(message: string, stackTrace?: string) {
    if (stackTrace) {
      super(message, {cause: stackTrace});
    } else {
      super(message, {cause: new Error().stack});
    }
    this.message = message;
    this.name = 'ClientError';
  }
}

// Server errors raised by the GenAI API.
export class ServerError extends Error {
  constructor(message: string, stackTrace?: string) {
    if (stackTrace) {
      super(message, {cause: stackTrace});
    } else {
      super(message, {cause: new Error().stack});
    }
    this.message = message;
    this.name = 'ServerError';
  }
}

/**
 * Options for initializing the ApiClient. The ApiClient uses the parameters
 * for authentication purposes as well as to infer if SDK should send the
 * request to Vertex AI or Gemini API.
 */
export interface ApiClientInitOptions {
  /**
   * Optional. The Google Cloud project ID for Vertex AI users.
   * It is not the numeric project name.
   * If not provided, SDK will try to resolve it from runtime environment.
   */
  project?: string;
  /**
   * Optional. The Google Cloud project location for Vertex AI users.
   * If not provided, SDK will try to resolve it from runtime environment.
   */
  location?: string;
  /**
   * The API Key. This is required for Gemini API users.
   */
  apiKey?: string;
  /**
   * Optional. Set to true if you intend to call Vertex AI endpoints.
   * If unset, default SDK behavior is to call Gemini API.
   */
  vertexai?: boolean;
  /**
   * Optional. The API version for the endpoint.
   * If unset, SDK will choose a default api version.
   */
  apiVersion?: string;
  /**
   * Optional. These are the authentication options provided by google-auth-library for Vertex AI users.
   * Complete list of authentication options are documented in the
   * GoogleAuthOptions interface:
   * https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts.
   */
  googleAuthOptions?: GoogleAuthOptions;
  /**
   * Optional. A set of customizable configuration for HTTP requests.
   */
  httpOptions?: HttpOptions;
}

export class ApiClient {
  private readonly clientOptions: ApiClientInitOptions;
  private readonly googleAuth?: GoogleAuth;

  constructor(opts: ApiClientInitOptions) {
    this.clientOptions = {
      ...opts,
      project: opts.project ?? getEnv('GOOGLE_CLOUD_PROJECT'),
      location: opts.location ?? getEnv('GOOGLE_CLOUD_LOCATION'),
      apiKey: opts.apiKey ?? getEnv('GOOGLE_API_KEY'),
      vertexai:
        opts.vertexai ?? getBooleanEnv('GOOGLE_GENAI_USE_VERTEXAI') ?? false,
    };

    const initHttpOptions: HttpOptions = {};

    if (this.clientOptions.vertexai) {
      initHttpOptions.apiVersion =
        this.clientOptions.apiVersion ?? VERTEX_AI_API_DEFAULT_VERSION;
      initHttpOptions.baseUrl = `https://${this.clientOptions.location}-aiplatform.googleapis.com/`;
      const googleAuthOptions: GoogleAuthOptions = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };
      let authOptions = buildGoogleAuthOptions(
        this.clientOptions.googleAuthOptions,
      );
      this.googleAuth = new GoogleAuth(authOptions);
      this.clientOptions.apiKey = undefined; // unset API key.
    } else {
      initHttpOptions.apiVersion =
        this.clientOptions.apiVersion ?? GOOGLE_AI_API_DEFAULT_VERSION;
      initHttpOptions.baseUrl = `https://generativelanguage.googleapis.com/`;
    }

    initHttpOptions.headers = this._getDefaultHeaders();

    this.clientOptions.httpOptions = initHttpOptions;

    if (opts.httpOptions) {
      this.clientOptions.httpOptions = this._patchHttpOptions(
        initHttpOptions,
        opts.httpOptions,
      );
    }
  }

  private fetchToken(): Promise<string | null | undefined> {
    if (!this.googleAuth) {
      throw new Error('Invalid auth error.');
    }
    const tokenPromise = this.googleAuth.getAccessToken().catch((e: Error) => {
      throw new Error(`invalid auth error: ${e}`);
    });
    return tokenPromise;
  }

  isVertexAI(): boolean {
    return this.clientOptions.vertexai ?? false;
  }

  getProject() {
    return this.clientOptions.project;
  }

  getLocation() {
    return this.clientOptions.location;
  }

  getApiVersion() {
    return this.clientOptions.httpOptions!.apiVersion!;
  }

  getBaseUrl() {
    return this.clientOptions.httpOptions!.baseUrl!;
  }

  getRequestUrl() {
    return this._getRequestUrl(this.clientOptions.httpOptions!);
  }

  getHeaders() {
    return this.clientOptions.httpOptions!.headers!;
  }

  private _getRequestUrl(httpOptions: HttpOptions) {
    if (!httpOptions.baseUrl!.endsWith('/')) {
      return `${httpOptions.baseUrl}/${httpOptions.apiVersion}`;
    }
    return `${httpOptions.baseUrl}${httpOptions.apiVersion}`;
  }

  getBaseResourcePath() {
    return `projects/${this.clientOptions.project}/locations/${
      this.clientOptions.location
    }`;
  }

  getApiKey() {
    return this.clientOptions.apiKey;
  }

  getWebsocketBaseUrl() {
    const baseUrl = this.getBaseUrl();
    const urlParts = new URL(baseUrl);
    urlParts.protocol = 'wss';
    return urlParts.toString();
  }

  setBaseUrl(url: string) {
    this.clientOptions.httpOptions!.baseUrl = url;
  }

  get(
    path: string,
    requestObject: any,
    respType?: any,
    requestHttpOptions?: HttpOptions,
  ): Promise<any> {
    return this._request(
      path,
      requestObject,
      'GET',
      respType,
      requestHttpOptions,
    );
  }

  post(
    path: string,
    requestObject: any,
    respType?: any,
    requestHttpOptions?: HttpOptions,
  ): Promise<any> {
    return this._request(
      path,
      requestObject,
      'POST',
      respType,
      requestHttpOptions,
    );
  }

  patch(
    path: string,
    requestObject: any,
    respType?: any,
    requestHttpOptions?: HttpOptions,
  ): Promise<any> {
    return this._request(
      path,
      requestObject,
      'PATCH',
      respType,
      requestHttpOptions,
    );
  }

  delete(
    path: string,
    requestObject: any,
    respType?: any,
    requestHttpOptions?: HttpOptions,
  ): Promise<any> {
    return this._request(
      path,
      requestObject,
      'DELETE',
      respType,
      requestHttpOptions,
    );
  }

  async _request(
    path: string,
    requestJson: any,
    httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    respType?: any,
    requestHttpOptions?: HttpOptions,
  ): Promise<any> {
    // Copy the json locally so as to not modify the user provided one.
    let localRequestJson: any = JSON.parse(JSON.stringify(requestJson));
    // _url is a special dict for populating the url.
    delete localRequestJson._url;

    let patchedHttpOptions = this.clientOptions.httpOptions!;
    if (requestHttpOptions) {
      patchedHttpOptions = this._patchHttpOptions(
        this.clientOptions.httpOptions!,
        requestHttpOptions,
      );
    }

    if (this.clientOptions.vertexai && !path.startsWith('projects/')) {
      path = `${this.getBaseResourcePath()}/${path}`;
    }
    const url = new URL(`${this._getRequestUrl(patchedHttpOptions)}/${path}`);
    if (localRequestJson._query) {
      for (const [key, value] of Object.entries(localRequestJson._query)) {
        url.searchParams.append(key, String(value));
      }
      delete localRequestJson._query;
    }
    if (localRequestJson.config) {
      Object.assign(localRequestJson, localRequestJson.config);
      delete localRequestJson.config;
    }
    let requestInit: RequestInit = {};
    const body = JSON.stringify(localRequestJson);
    if (httpMethod === 'GET') {
      if (body !== '{}') {
        throw new Error(
          `Request body should be empty for GET request, but got: ${body}`,
        );
      }
    } else {
      requestInit.body = body;
    }
    requestInit = await this._includeExtraHttpOptionsToRequestInit(
      requestInit,
      patchedHttpOptions,
    );
    return this.unaryApiCall(url, requestInit, httpMethod, respType);
  }

  _patchHttpOptions(
    baseHttpOptions: HttpOptions,
    requestHttpOptions: HttpOptions,
  ): HttpOptions {
    let patchedHttpOptions = JSON.parse(
      JSON.stringify(baseHttpOptions),
    ) as HttpOptions;

    for (const [key, value] of Object.entries(requestHttpOptions)) {
      // Records compile to objects.
      if (typeof value === 'object') {
        // @ts-ignore TS2345TS7053: Element implicitly has an 'any' type because
        // expression of type 'string' can't be used to index type
        // 'HttpOptions'.
        patchedHttpOptions[key] = {...patchedHttpOptions[key], ...value};
      } else if (value) {
        // @ts-ignore TS2345TS7053: Element implicitly has an 'any' type because
        // expression of type 'string' can't be used to index type
        // 'HttpOptions'.
        patchedHttpOptions[key] = value;
      }
    }
    return patchedHttpOptions;
  }

  async postStream(
    path: string,
    requestJson: any,
    chunkType?: any,
    requestHttpOptions?: HttpOptions,
  ): Promise<any> {
    // _url is a special dict for populating the url.
    delete requestJson._url;

    let patchedHttpOptions = this.clientOptions.httpOptions!;
    if (requestHttpOptions) {
      patchedHttpOptions = this._patchHttpOptions(
        this.clientOptions.httpOptions!,
        requestHttpOptions,
      );
    }

    if (this.clientOptions.vertexai && !path.startsWith('projects/')) {
      path = `${this.getBaseResourcePath()}/${path}`;
    }
    const url = new URL(`${this._getRequestUrl(patchedHttpOptions)}/${path}`);
    if (!url.searchParams.has('alt') || url.searchParams.get('alt') !== 'sse') {
      url.searchParams.set('alt', 'sse');
    }
    let requestInit: RequestInit = {};
    requestInit.body = JSON.stringify(requestJson);
    requestInit = await this._includeExtraHttpOptionsToRequestInit(
      requestInit,
      patchedHttpOptions,
    );
    return this.streamApiCall(url, requestInit, 'POST', chunkType);
  }

  private async _includeExtraHttpOptionsToRequestInit(
    requestInit: RequestInit,
    httpOptions: HttpOptions,
  ): Promise<RequestInit> {
    if (httpOptions && httpOptions.timeout && httpOptions.timeout > 0) {
      const abortController = new AbortController();
      const signal = abortController.signal;
      setTimeout(() => abortController.abort(), httpOptions.timeout);
      requestInit.signal = signal;
    }
    requestInit.headers = await this._getHeaders(httpOptions);
    return requestInit;
  }

  private async unaryApiCall(
    url: URL,
    requestInit: RequestInit,
    httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    respType?: any,
  ): Promise<any> {
    return this.apiCall(url.toString(), {
      ...requestInit,
      method: httpMethod,
    })
      .then(async (response) => {
        await throwErrorIfNotOK(response, url.toString(), requestInit);
        if ( response.headers.get('content-type')?.includes('application/json')) {
          return response.json();
        } else {
          return response.text();
        }
      })
      .catch((e) => {
        if (e instanceof Error) {
          throw e;
        } else {
          throw new Error(JSON.stringify(e));
        }
      });
  }

  private async streamApiCall(
    url: URL,
    requestInit: RequestInit,
    httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    chunkType: any,
  ): Promise<AsyncGenerator<any>> {
    return this.apiCall(url.toString(), {
      ...requestInit,
      method: httpMethod,
    })
      .then(async (response) => {
        await throwErrorIfNotOK(response, url.toString(), requestInit);
        return this.processStreamResponse(response, chunkType);
      })
      .catch((e) => {
        if (e instanceof Error) {
          throw e;
        } else {
          throw new Error(JSON.stringify(e));
        }
      });
  }

  async *processStreamResponse(
    response: Response,
    chunkType: any,
  ): AsyncGenerator<any> {
    const reader = response?.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    if (!reader) {
      throw new Error('Response body is empty');
    }

    try {
      let buffer = '';
      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          if (buffer.trim().length > 0) {
            throw new Error(`Incomplete JSON segment at the end: ${buffer}`);
          }
          break;
        }
        const chunkString = decoder.decode(value);
        buffer += chunkString;
        let match = buffer.match(responseLineRE);
        while (match) {
          const processedChunkString = match[1];
          try {
            const chunkData = JSON.parse(processedChunkString);
            if (chunkType) {
              Object.setPrototypeOf(chunkData, chunkType.prototype);
            }
            yield chunkData;
            buffer = buffer.slice(match[0].length);
            match = buffer.match(responseLineRE);
          } catch (e) {
            throw new Error(
              `exception parsing stream chunk ${processedChunkString}. ${e}`,
            );
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  private async apiCall(
    url: string,
    requestInit: RequestInit,
  ): Promise<Response> {
    return fetch(url, requestInit).catch((e) => {
      throw new Error(
        `exception ${e} sending request to url: ${url} with requestInit: ${JSON.stringify(
          requestInit,
        )}}`,
      );
    });
  }

  private _getDefaultHeaders(): Record<string, any> {
    const headers: Record<string, any> = {};

    const languageLabel = LANGUAGE_LABEL_PREFIX + process.version;
    const versionHeaderValue = LIBRARY_LABEL + ' ' + languageLabel;

    headers[USER_AGENT_HEADER] = versionHeaderValue;
    headers[GOOGLE_API_CLIENT_HEADER] = versionHeaderValue;
    headers[CONTENT_TYPE_HEADER] = 'application/json';

    if (!this.isVertexAI()) {
      headers[GOOGLE_API_KEY] = this.clientOptions.apiKey;
    }
    return headers;
  }

  private async _getHeaders(
    httpOptions: HttpOptions | undefined,
  ): Promise<Headers> {
    const headers = new Headers();
    if (httpOptions && httpOptions.headers) {
      for (const [key, value] of Object.entries(httpOptions.headers)) {
        headers.append(key, value);
      }
    }
    if (this.isVertexAI() && headers.get(AUTHORIZATION_HEADER) === null) {
      let token: string | undefined | null;
      token = await this.fetchToken();
      headers.append(AUTHORIZATION_HEADER, `Bearer ${token}`);
    }
    return headers;
  }
}

async function throwErrorIfNotOK(
  response: Response | undefined,
  url: string,
  requestInit: RequestInit,
) {
  if (response === undefined) {
    throw new ServerError('response is undefined');
  }
  if (!response.ok) {
    const status: number = response.status;
    const statusText: string = response.statusText;
    let errorBody;
    if (response.headers.get('content-type')?.includes('application/json')) {
      errorBody = await response.json();
    } else {
      errorBody = {
        error: {
          message: `exception parsing response from url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`,
          code: response.status,
          status: response.statusText,
        },
      };
    }
    const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(
      errorBody,
    )}`;
    if (status >= 400 && status < 500) {
      const clientError = new ClientError(errorMessage);
      throw clientError;
    } else if (status >= 500 && status < 600) {
      const serverError = new ServerError(errorMessage);
      throw serverError;
    }
    throw new Error(errorMessage);
  }
}

function buildGoogleAuthOptions(
  googleAuthOptions?: GoogleAuthOptions,
): GoogleAuthOptions {
  let authOptions: GoogleAuthOptions;
  if (!googleAuthOptions) {
    authOptions = {
      scopes: [REQUIRED_VERTEX_AI_SCOPE],
    };
    return authOptions;
  } else {
    authOptions = googleAuthOptions;
    if (!authOptions.scopes) {
      authOptions.scopes = [REQUIRED_VERTEX_AI_SCOPE];
      return authOptions;
    } else if (
      (typeof authOptions.scopes === 'string' &&
        authOptions.scopes !== REQUIRED_VERTEX_AI_SCOPE) ||
      (Array.isArray(authOptions.scopes) &&
        authOptions.scopes.indexOf(REQUIRED_VERTEX_AI_SCOPE) < 0)
    ) {
      throw new Error(
        `Invalid auth scopes. Scopes must include: ${REQUIRED_VERTEX_AI_SCOPE}`,
      );
    }
    return authOptions;
  }
}
