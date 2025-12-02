/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from './_common.js';
import { BaseModule } from './_common.js';
import * as converters from './converters/_caches_converters.js';
import { PagedItem, Pager } from './pagers.js';
import * as types from './types.js';
export class Caches extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
        /**
         * Lists cached content configurations.
         *
         * @param params - The parameters for the list request.
         * @return The paginated results of the list of cached contents.
         *
         * @example
         * ```ts
         * const cachedContents = await ai.caches.list({config: {'pageSize': 2}});
         * for await (const cachedContent of cachedContents) {
         *   console.log(cachedContent);
         * }
         * ```
         */
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_CACHED_CONTENTS, (x) => this.listInternal(x), await this.listInternal(params), params);
        };
    }
    /**
     * Creates a cached contents resource.
     *
     * @remarks
     * Context caching is only supported for specific models. See [Gemini
     * Developer API reference](https://ai.google.dev/gemini-api/docs/caching?lang=node/context-cac)
     * and [Vertex AI reference](https://cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview#supported_models)
     * for more information.
     *
     * @param params - The parameters for the create request.
     * @return The created cached content.
     *
     * @example
     * ```ts
     * const contents = ...; // Initialize the content to cache.
     * const response = await ai.caches.create({
     *   model: 'gemini-2.0-flash-001',
     *   config: {
     *    'contents': contents,
     *    'displayName': 'test cache',
     *    'systemInstruction': 'What is the sum of the two pdfs?',
     *    'ttl': '86400s',
     *  }
     * });
     * ```
     */
    async create(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.createCachedContentParametersToVertex(this.apiClient, params);
            path = common.formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((resp) => {
                return resp;
            });
        }
        else {
            const body = converters.createCachedContentParametersToMldev(this.apiClient, params);
            path = common.formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((resp) => {
                return resp;
            });
        }
    }
    /**
     * Gets cached content configurations.
     *
     * @param params - The parameters for the get request.
     * @return The cached content.
     *
     * @example
     * ```ts
     * await ai.caches.get({name: '...'}); // The server-generated resource name.
     * ```
     */
    async get(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.getCachedContentParametersToVertex(this.apiClient, params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((resp) => {
                return resp;
            });
        }
        else {
            const body = converters.getCachedContentParametersToMldev(this.apiClient, params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((resp) => {
                return resp;
            });
        }
    }
    /**
     * Deletes cached content.
     *
     * @param params - The parameters for the delete request.
     * @return The empty response returned by the API.
     *
     * @example
     * ```ts
     * await ai.caches.delete({name: '...'}); // The server-generated resource name.
     * ```
     */
    async delete(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.deleteCachedContentParametersToVertex(this.apiClient, params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'DELETE',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.deleteCachedContentResponseFromVertex(apiResponse);
                const typedResp = new types.DeleteCachedContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = converters.deleteCachedContentParametersToMldev(this.apiClient, params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'DELETE',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.deleteCachedContentResponseFromMldev(apiResponse);
                const typedResp = new types.DeleteCachedContentResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    /**
     * Updates cached content configurations.
     *
     * @param params - The parameters for the update request.
     * @return The updated cached content.
     *
     * @example
     * ```ts
     * const response = await ai.caches.update({
     *   name: '...',  // The server-generated resource name.
     *   config: {'ttl': '7600s'}
     * });
     * ```
     */
    async update(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.updateCachedContentParametersToVertex(this.apiClient, params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'PATCH',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((resp) => {
                return resp;
            });
        }
        else {
            const body = converters.updateCachedContentParametersToMldev(this.apiClient, params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'PATCH',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json();
            });
            return response.then((resp) => {
                return resp;
            });
        }
    }
    async listInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.listCachedContentsParametersToVertex(params);
            path = common.formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.listCachedContentsResponseFromVertex(apiResponse);
                const typedResp = new types.ListCachedContentsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = converters.listCachedContentsParametersToMldev(params);
            path = common.formatMap('cachedContents', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            response = this.apiClient
                .request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'GET',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            })
                .then((httpResponse) => {
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.listCachedContentsResponseFromMldev(apiResponse);
                const typedResp = new types.ListCachedContentsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
}
