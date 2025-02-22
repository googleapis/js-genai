/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';

import {Auth} from './_auth';
import {HttpOptions, HttpResponse} from './types';

const CONTENT_TYPE_HEADER = 'Content-Type';
const USER_AGENT_HEADER = 'User-Agent';
const GOOGLE_API_CLIENT_HEADER = 'x-goog-api-client';
const SDK_VERSION = '0.1.0'; // x-release-please-version
const LIBRARY_LABEL = `google-genai-sdk/${SDK_VERSION}`;
const VERTEX_AI_API_DEFAULT_VERSION = 'v1beta1';
const GOOGLE_AI_API_DEFAULT_VERSION = 'v1beta';
const responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;

/**
 * Client errors raised by the GenAI API.
 */
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

/**
 * Server errors raised by the GenAI API.
 */
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
   * The object used for adding authentication headers to API requests.
   */
  auth: Auth;
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
   * Optional. A set of customizable configuration for HTTP requests.
   */
  httpOptions?: HttpOptions;
  /**
   * Optional. An extra string to append at the end of the User-Agent header.
   *
   * This can be used to e.g specify the runtime and its version.
   */
  userAgentExtra?: string;
}

/**
 * Represents the necessary information to send a request to an API endpoint.
 * This interface defines the structure for constructing and executing HTTP
 * requests.
 */
export interface HttpRequest {
  /**
   * URL path from the modules, this path is appended to the base API URL to
   * form the complete request URL.
   */
  path: string;
  /**
   * Optional query parameters to be appended to the request URL.
   */
  queryParams?: Record<string, string>;
  /**
   * Optional request body in json string format, GET request doesn't need a
   * request body.
   */
  body?: string | Blob;
  /**
   * The HTTP method to be used for the request.
   */
  httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /**
   * Optional set of customizable configuration for HTTP requests.
   */
  httpOptions?: HttpOptions;
}

/**
 * The ApiClient class is used to send requests to the Gemini API or Vertex AI
 * endpoints.
 */
export class ApiClient {
  private readonly clientOptions: ApiClientInitOptions;

  constructor(opts: ApiClientInitOptions) {
    this.clientOptions = {
      ...opts,
      project: opts.project,
      location: opts.location,
      apiKey: opts.apiKey,
      vertexai: opts.vertexai,
    };

    const initHttpOptions: HttpOptions = {};

    if (this.clientOptions.vertexai) {
      initHttpOptions.apiVersion =
        this.clientOptions.apiVersion ?? VERTEX_AI_API_DEFAULT_VERSION;
      initHttpOptions.baseUrl = `https://${this.clientOptions.location}-aiplatform.googleapis.com/`;
      this.clientOptions.apiKey = undefined; // unset API key.
    } else {
      initHttpOptions.apiVersion =
        this.clientOptions.apiVersion ?? GOOGLE_AI_API_DEFAULT_VERSION;
      initHttpOptions.baseUrl = `https://generativelanguage.googleapis.com/`;
    }

    initHttpOptions.headers = this.getDefaultHeaders();

    this.clientOptions.httpOptions = initHttpOptions;

    if (opts.httpOptions) {
      this.clientOptions.httpOptions = this.patchHttpOptions(
        initHttpOptions,
        opts.httpOptions,
      );
    }
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
    if (
      this.clientOptions.httpOptions &&
      this.clientOptions.httpOptions.apiVersion !== undefined
    ) {
      return this.clientOptions.httpOptions.apiVersion;
    }
    throw new Error('API version is not set.');
  }

  getBaseUrl() {
    if (
      this.clientOptions.httpOptions &&
      this.clientOptions.httpOptions.baseUrl !== undefined
    ) {
      return this.clientOptions.httpOptions.baseUrl;
    }
    throw new Error('Base URL is not set.');
  }

  getRequestUrl() {
    return this.getRequestUrlInternal(this.clientOptions.httpOptions);
  }

  getHeaders() {
    if (
      this.clientOptions.httpOptions &&
      this.clientOptions.httpOptions.headers !== undefined
    ) {
      return this.clientOptions.httpOptions.headers;
    } else {
      throw new Error('Headers are not set.');
    }
  }

  private getRequestUrlInternal(httpOptions?: HttpOptions) {
    if (
      !httpOptions ||
      httpOptions.baseUrl === undefined ||
      httpOptions.apiVersion === undefined
    ) {
      throw new Error('HTTP options are not correctly set.');
    }
    if (!httpOptions.baseUrl.endsWith('/') && httpOptions.apiVersion) {
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
    if (this.clientOptions.httpOptions) {
      this.clientOptions.httpOptions.baseUrl = url;
    } else {
      throw new Error('HTTP options are not correctly set.');
    }
  }

  constructUrl(requestPath: string, patchedHttpOptions: HttpOptions): URL {
    const urlElement: Array<string> =
        [this.getRequestUrlInternal(patchedHttpOptions)];
    if (this.clientOptions.vertexai && !requestPath.startsWith('projects/')) {
      urlElement.push(this.getBaseResourcePath());
    }
    if (requestPath !== '') {
      urlElement.push(requestPath);
    }
    const url = new URL(`${urlElement.join('/')}`);

    return url;
  }

  async request(request: HttpRequest): Promise<HttpResponse> {
    let patchedHttpOptions = this.clientOptions.httpOptions!;
    if (request.httpOptions) {
      patchedHttpOptions = this.patchHttpOptions(
        this.clientOptions.httpOptions!,
        request.httpOptions,
      );
    }

    let url = this.constructUrl(request.path, patchedHttpOptions);
    if (request.queryParams) {
      for (const [key, value] of Object.entries(request.queryParams)) {
        url.searchParams.append(key, String(value));
      }
    }
    let requestInit: RequestInit = {};
    if (request.httpMethod === 'GET') {
      if (request.body && request.body !== '{}') {
        throw new Error(
          `Request body should be empty for GET request, but got: ${
            request.body
          }`,
        );
      }
    } else {
      requestInit.body = request.body;
    }
    requestInit = await this.includeExtraHttpOptionsToRequestInit(
      requestInit,
      patchedHttpOptions,
    );
    return this.unaryApiCall(url, requestInit, request.httpMethod);
  }

  private patchHttpOptions(
    baseHttpOptions: HttpOptions,
    requestHttpOptions: HttpOptions,
  ): HttpOptions {
    const patchedHttpOptions = JSON.parse(
      JSON.stringify(baseHttpOptions),
    ) as HttpOptions;

    for (const [key, value] of Object.entries(requestHttpOptions)) {
      // Records compile to objects.
      if (typeof value === 'object') {
        // @ts-expect-error TS2345TS7053: Element implicitly has an 'any' type because
        // expression of type 'string' can't be used to index type
        // 'HttpOptions'.
        patchedHttpOptions[key] = {...patchedHttpOptions[key], ...value};
      } else if (value !== undefined) {
        // @ts-expect-error TS2345TS7053: Element implicitly has an 'any' type because
        // expression of type 'string' can't be used to index type
        // 'HttpOptions'.
        patchedHttpOptions[key] = value;
      }
    }
    return patchedHttpOptions;
  }

  async requestStream(
    request: HttpRequest,
    // TODO: Replace with HttpResponse.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    let patchedHttpOptions = this.clientOptions.httpOptions!;
    if (request.httpOptions) {
      patchedHttpOptions = this.patchHttpOptions(
        this.clientOptions.httpOptions!,
        request.httpOptions,
      );
    }

    let url = this.constructUrl(request.path, patchedHttpOptions);
    if (!url.searchParams.has('alt') || url.searchParams.get('alt') !== 'sse') {
      url.searchParams.set('alt', 'sse');
    }

    let requestInit: RequestInit = {};
    requestInit.body = request.body;
    requestInit = await this.includeExtraHttpOptionsToRequestInit(
      requestInit,
      patchedHttpOptions,
    );
    return this.streamApiCall(url, requestInit, request.httpMethod);
  }

  private async includeExtraHttpOptionsToRequestInit(
    requestInit: RequestInit,
    httpOptions: HttpOptions,
  ): Promise<RequestInit> {
    if (httpOptions && httpOptions.timeout && httpOptions.timeout > 0) {
      const abortController = new AbortController();
      const signal = abortController.signal;
      setTimeout(() => abortController.abort(), httpOptions.timeout);
      requestInit.signal = signal;
    }
    requestInit.headers = await this.getHeadersInternal(httpOptions);
    return requestInit;
  }

  private async unaryApiCall(
    url: URL,
    requestInit: RequestInit,
    httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<HttpResponse> {
    return this.apiCall(url.toString(), {
      ...requestInit,
      method: httpMethod,
    })
      .then(async (response) => {
        await throwErrorIfNotOK(response, url.toString(), requestInit);
        return new HttpResponse(response);
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
    // TODO: Replace with HttpResponse.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<AsyncGenerator<any>> {
    return this.apiCall(url.toString(), {
      ...requestInit,
      method: httpMethod,
    })
      .then(async (response) => {
        await throwErrorIfNotOK(response, url.toString(), requestInit);
        return this.processStreamResponse(response);
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
    // TODO: Replace with HttpResponse.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    const versionHeaderValue =
      LIBRARY_LABEL + ' ' + this.clientOptions.userAgentExtra;

    headers[USER_AGENT_HEADER] = versionHeaderValue;
    headers[GOOGLE_API_CLIENT_HEADER] = versionHeaderValue;
    headers[CONTENT_TYPE_HEADER] = 'application/json';

    return headers;
  }

  private async getHeadersInternal(
    httpOptions: HttpOptions | undefined,
  ): Promise<Headers> {
    const headers = new Headers();
    if (httpOptions && httpOptions.headers) {
      for (const [key, value] of Object.entries(httpOptions.headers)) {
        headers.append(key, value);
      }
    }
    await this.clientOptions.auth.addAuthHeaders(headers);
    return headers;
  }

  /**
   * Uploads a file to the specified URL using resumable upload protocol.
   *
   * @param filePath The path to the file to upload.
   * @param uploadUrl The URL to upload the file to.
   * @param uploadSize The total size of the file in bytes.
   * @return A promise that resolves to the JSON response from the final upload
   *     request.
   * @throws An error if the upload fails or if the file cannot be read.
   */
  async uploadFile(filePath: string, uploadUrl: string, uploadSize: number):
      Promise<any> {
      const fileData =
          await fs.readFile(filePath);
      const fileBlob = new Blob([fileData]);

      let offset = 0;
      let response: HttpResponse;
      const chunkSize = 1024 * 1024 * 8;  // 8 MB chunk size
      while (offset < uploadSize) {
        const chunk = fileBlob.slice(offset, offset + chunkSize);
        const currentChunkSize = chunk.size;
        let uploadCommand = 'upload';

        if (offset + currentChunkSize >= uploadSize) {
          uploadCommand += ', finalize';
        }
        response = await this.request({
          path: '',
          body: chunk,
          httpMethod: 'POST',
          httpOptions: {
            apiVersion: '',
            baseUrl: uploadUrl,
            headers: {
              'X-Goog-Upload-Command': uploadCommand,
              'X-Goog-Upload-Offset': String(offset),
              'Content-Length': String(currentChunkSize),
            },
          },
        });

        if (response.headers?.['x-goog-upload-status'] !== 'active') {
          if (uploadSize <= offset) {
            const responseJson = await response.json();
            throw new Error(
                'All content has been uploaded, but the upload status is not' +
                ` finalized. ${response.headers}, body: ${responseJson}`);
          }
          if (response.headers?.['x-goog-upload-status'] !== 'final') {
            const responseJson = await response.json();
            throw new Error(
                'Failed to upload file: Upload status is not finalized. headers:' +
                ` ${response.headers}, body: ${responseJson}`);
          }
          const responseJson = await response.json();
          return responseJson;
        }
        offset += currentChunkSize;
      }
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
    let errorBody: Record<string, unknown>;
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
