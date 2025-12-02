/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from './_common.js';
import { BaseModule } from './_common.js';
import * as converters from './converters/_tunings_converters.js';
import { PagedItem, Pager } from './pagers.js';
import * as types from './types.js';
export class Tunings extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
        /**
         * Gets a TuningJob.
         *
         * @param name - The resource name of the tuning job.
         * @return - A TuningJob object.
         *
         * @experimental - The SDK's tuning implementation is experimental, and may
         * change in future versions.
         */
        this.get = async (params) => {
            return await this.getInternal(params);
        };
        /**
         * Lists tuning jobs.
         *
         * @param config - The configuration for the list request.
         * @return - A list of tuning jobs.
         *
         * @experimental - The SDK's tuning implementation is experimental, and may
         * change in future versions.
         */
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_TUNING_JOBS, (x) => this.listInternal(x), await this.listInternal(params), params);
        };
        /**
         * Creates a supervised fine-tuning job.
         *
         * @param params - The parameters for the tuning job.
         * @return - A TuningJob operation.
         *
         * @experimental - The SDK's tuning implementation is experimental, and may
         * change in future versions.
         */
        this.tune = async (params) => {
            if (this.apiClient.isVertexAI()) {
                if (params.baseModel.startsWith('projects/')) {
                    const preTunedModel = {
                        tunedModelName: params.baseModel,
                    };
                    if (params.config?.preTunedModelCheckpointId) {
                        preTunedModel.checkpointId = params.config.preTunedModelCheckpointId;
                    }
                    const paramsPrivate = {
                        ...params,
                        preTunedModel: preTunedModel,
                    };
                    paramsPrivate.baseModel = undefined;
                    return await this.tuneInternal(paramsPrivate);
                }
                else {
                    const paramsPrivate = {
                        ...params,
                    };
                    return await this.tuneInternal(paramsPrivate);
                }
            }
            else {
                const paramsPrivate = {
                    ...params,
                };
                const operation = await this.tuneMldevInternal(paramsPrivate);
                let tunedModelName = '';
                if (operation['metadata'] !== undefined &&
                    operation['metadata']['tunedModel'] !== undefined) {
                    tunedModelName = operation['metadata']['tunedModel'];
                }
                else if (operation['name'] !== undefined &&
                    operation['name'].includes('/operations/')) {
                    tunedModelName = operation['name'].split('/operations/')[0];
                }
                const tuningJob = {
                    name: tunedModelName,
                    state: types.JobState.JOB_STATE_QUEUED,
                };
                return tuningJob;
            }
        };
    }
    async getInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.getTuningJobParametersToVertex(params, params);
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
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.tuningJobFromVertex(apiResponse);
                return resp;
            });
        }
        else {
            const body = converters.getTuningJobParametersToMldev(params, params);
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
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.tuningJobFromMldev(apiResponse);
                return resp;
            });
        }
    }
    async listInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.listTuningJobsParametersToVertex(params, params);
            path = common.formatMap('tuningJobs', body['_url']);
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
                const resp = converters.listTuningJobsResponseFromVertex(apiResponse);
                const typedResp = new types.ListTuningJobsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
        else {
            const body = converters.listTuningJobsParametersToMldev(params, params);
            path = common.formatMap('tunedModels', body['_url']);
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
                const resp = converters.listTuningJobsResponseFromMldev(apiResponse);
                const typedResp = new types.ListTuningJobsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    /**
     * Cancels a tuning job.
     *
     * @param params - The parameters for the cancel request.
     * @return The empty response returned by the API.
     *
     * @example
     * ```ts
     * await ai.tunings.cancel({name: '...'}); // The server-generated resource name.
     * ```
     */
    async cancel(params) {
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.cancelTuningJobParametersToVertex(params, params);
            path = common.formatMap('{name}:cancel', body['_url']);
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
            const body = converters.cancelTuningJobParametersToMldev(params, params);
            path = common.formatMap('{name}:cancel', body['_url']);
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
    async tuneInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.createTuningJobParametersPrivateToVertex(params, params);
            path = common.formatMap('tuningJobs', body['_url']);
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
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.tuningJobFromVertex(apiResponse);
                return resp;
            });
        }
        else {
            throw new Error('This method is only supported by the Vertex AI.');
        }
    }
    async tuneMldevInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.createTuningJobParametersPrivateToMldev(params, params);
            path = common.formatMap('tunedModels', body['_url']);
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
                return httpResponse.json().then((jsonResponse) => {
                    const response = jsonResponse;
                    response.sdkHttpResponse = {
                        headers: httpResponse.headers,
                    };
                    return response;
                });
            });
            return response.then((apiResponse) => {
                const resp = converters.tuningOperationFromMldev(apiResponse);
                return resp;
            });
        }
    }
}
