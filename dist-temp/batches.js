/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from './_common.js';
import { BaseModule } from './_common.js';
import * as converters from './converters/_batches_converters.js';
import { PagedItem, Pager } from './pagers.js';
import * as types from './types.js';
export class Batches extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
        /**
         * Create batch job.
         *
         * @param params - The parameters for create batch job request.
         * @return The created batch job.
         *
         * @example
         * ```ts
         * const response = await ai.batches.create({
         *   model: 'gemini-2.0-flash',
         *   src: {gcsUri: 'gs://bucket/path/to/file.jsonl', format: 'jsonl'},
         *   config: {
         *     dest: {gcsUri: 'gs://bucket/path/output/directory', format: 'jsonl'},
         *   }
         * });
         * console.log(response);
         * ```
         */
        this.create = async (params) => {
            if (this.apiClient.isVertexAI()) {
                // Format destination if not provided
                // Cast params.src as Vertex AI path does not handle InlinedRequest[]
                params.config = this.formatDestination(params.src, params.config);
            }
            return this.createInternal(params);
        };
        /**
         * **Experimental** Creates an embedding batch job.
         *
         * @param params - The parameters for create embedding batch job request.
         * @return The created batch job.
         *
         * @example
         * ```ts
         * const response = await ai.batches.createEmbeddings({
         *   model: 'text-embedding-004',
         *   src: {fileName: 'files/my_embedding_input'},
         * });
         * console.log(response);
         * ```
         */
        this.createEmbeddings = async (params) => {
            console.warn('batches.createEmbeddings() is experimental and may change without notice.');
            if (this.apiClient.isVertexAI()) {
                throw new Error('Vertex AI does not support batches.createEmbeddings.');
            }
            return this.createEmbeddingsInternal(params);
        };
        /**
         * Lists batch job configurations.
         *
         * @param params - The parameters for the list request.
         * @return The paginated results of the list of batch jobs.
         *
         * @example
         * ```ts
         * const batchJobs = await ai.batches.list({config: {'pageSize': 2}});
         * for await (const batchJob of batchJobs) {
         *   console.log(batchJob);
         * }
         * ```
         */
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_BATCH_JOBS, (x) => this.listInternal(x), await this.listInternal(params), params);
        };
    }
    // Helper function to handle inlined generate content requests
    createInlinedGenerateContentRequest(params) {
        const body = converters.createBatchJobParametersToMldev(this.apiClient, // Use instance apiClient
        params);
        const urlParams = body['_url'];
        const path = common.formatMap('{model}:batchGenerateContent', urlParams);
        const batch = body['batch'];
        const inputConfig = batch['inputConfig'];
        const requestsWrapper = inputConfig['requests'];
        const requests = requestsWrapper['requests'];
        const newRequests = [];
        for (const request of requests) {
            const requestDict = { ...request }; // Clone
            if (requestDict['systemInstruction']) {
                const systemInstructionValue = requestDict['systemInstruction'];
                delete requestDict['systemInstruction'];
                const requestContent = requestDict['request'];
                requestContent['systemInstruction'] = systemInstructionValue;
                requestDict['request'] = requestContent;
            }
            newRequests.push(requestDict);
        }
        requestsWrapper['requests'] = newRequests;
        delete body['config'];
        delete body['_url'];
        delete body['_query'];
        return { path, body };
    }
    // Helper function to get the first GCS URI
    getGcsUri(src) {
        if (typeof src === 'string') {
            return src.startsWith('gs://') ? src : undefined;
        }
        if (!Array.isArray(src) && src.gcsUri && src.gcsUri.length > 0) {
            return src.gcsUri[0];
        }
        return undefined;
    }
    // Helper function to get the BigQuery URI
    getBigqueryUri(src) {
        if (typeof src === 'string') {
            return src.startsWith('bq://') ? src : undefined;
        }
        if (!Array.isArray(src)) {
            return src.bigqueryUri;
        }
        return undefined;
    }
    // Function to format the destination configuration for Vertex AI
    formatDestination(src, config) {
        const newConfig = config ? { ...config } : {};
        const timestampStr = Date.now().toString();
        if (!newConfig.displayName) {
            newConfig.displayName = `genaiBatchJob_${timestampStr}`;
        }
        if (newConfig.dest === undefined) {
            const gcsUri = this.getGcsUri(src);
            const bigqueryUri = this.getBigqueryUri(src);
            if (gcsUri) {
                if (gcsUri.endsWith('.jsonl')) {
                    // For .jsonl files, remove suffix and add /dest
                    newConfig.dest = `${gcsUri.slice(0, -6)}/dest`;
                }
                else {
                    // Fallback for other GCS URIs
                    newConfig.dest = `${gcsUri}_dest_${timestampStr}`;
                }
            }
            else if (bigqueryUri) {
                newConfig.dest = `${bigqueryUri}_dest_${timestampStr}`;
            }
            else {
                throw new Error('Unsupported source for Vertex AI: No GCS or BigQuery URI found.');
            }
        }
        return newConfig;
    }
    /**
     * Internal method to create batch job.
     *
     * @param params - The parameters for create batch job request.
     * @return The created batch job.
     *
     */
    async createInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.createBatchJobParametersToVertex(this.apiClient, params);
            path = common.formatMap('batchPredictionJobs', body['_url']);
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
            return response.then((apiResponse) => {
                const resp = converters.batchJobFromVertex(apiResponse);
                return resp;
            });
        }
        else {
            const body = converters.createBatchJobParametersToMldev(this.apiClient, params);
            path = common.formatMap('{model}:batchGenerateContent', body['_url']);
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
            return response.then((apiResponse) => {
                const resp = converters.batchJobFromMldev(apiResponse);
                return resp;
            });
        }
    }
    /**
     * Internal method to create batch job.
     *
     * @param params - The parameters for create batch job request.
     * @return The created batch job.
     *
     */
    async createEmbeddingsInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.createEmbeddingsBatchJobParametersToMldev(this.apiClient, params);
            path = common.formatMap('{model}:asyncBatchEmbedContent', body['_url']);
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
            return response.then((apiResponse) => {
                const resp = converters.batchJobFromMldev(apiResponse);
                return resp;
            });
        }
    }
    /**
     * Gets batch job configurations.
     *
     * @param params - The parameters for the get request.
     * @return The batch job.
     *
     * @example
     * ```ts
     * await ai.batches.get({name: '...'}); // The server-generated resource name.
     * ```
     */
    async get(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.getBatchJobParametersToVertex(this.apiClient, params);
            path = common.formatMap('batchPredictionJobs/{name}', body['_url']);
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
            return response.then((apiResponse) => {
                const resp = converters.batchJobFromVertex(apiResponse);
                return resp;
            });
        }
        else {
            const body = converters.getBatchJobParametersToMldev(this.apiClient, params);
            path = common.formatMap('batches/{name}', body['_url']);
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
            return response.then((apiResponse) => {
                const resp = converters.batchJobFromMldev(apiResponse);
                return resp;
            });
        }
    }
    /**
     * Cancels a batch job.
     *
     * @param params - The parameters for the cancel request.
     * @return The empty response returned by the API.
     *
     * @example
     * ```ts
     * await ai.batches.cancel({name: '...'}); // The server-generated resource name.
     * ```
     */
    async cancel(params) {
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.cancelBatchJobParametersToVertex(this.apiClient, params);
            path = common.formatMap('batchPredictionJobs/{name}:cancel', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            await this.apiClient.request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            });
        }
        else {
            const body = converters.cancelBatchJobParametersToMldev(this.apiClient, params);
            path = common.formatMap('batches/{name}:cancel', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            await this.apiClient.request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'POST',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            });
        }
    }
    async listInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.listBatchJobsParametersToVertex(params);
            path = common.formatMap('batchPredictionJobs', body['_url']);
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
                const resp = converters.listBatchJobsResponseFromVertex(apiResponse);
                const typedResp = new types.ListBatchJobsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = converters.listBatchJobsParametersToMldev(params);
            path = common.formatMap('batches', body['_url']);
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
                const resp = converters.listBatchJobsResponseFromMldev(apiResponse);
                const typedResp = new types.ListBatchJobsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    /**
     * Deletes a batch job.
     *
     * @param params - The parameters for the delete request.
     * @return The empty response returned by the API.
     *
     * @example
     * ```ts
     * await ai.batches.delete({name: '...'}); // The server-generated resource name.
     * ```
     */
    async delete(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.deleteBatchJobParametersToVertex(this.apiClient, params);
            path = common.formatMap('batchPredictionJobs/{name}', body['_url']);
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
                const resp = converters.deleteResourceJobFromVertex(apiResponse);
                return resp;
            });
        }
        else {
            const body = converters.deleteBatchJobParametersToMldev(this.apiClient, params);
            path = common.formatMap('batches/{name}', body['_url']);
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
                const resp = converters.deleteResourceJobFromMldev(apiResponse);
                return resp;
            });
        }
    }
}
