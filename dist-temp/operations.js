/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from './_common.js';
import { BaseModule } from './_common.js';
import * as converters from './converters/_operations_converters.js';
export class Operations extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
    }
    /**
     * Gets the status of a long-running operation.
     *
     * @param parameters The parameters for the get operation request.
     * @return The updated Operation object, with the latest status or result.
     */
    async getVideosOperation(parameters) {
        const operation = parameters.operation;
        const config = parameters.config;
        if (operation.name === undefined || operation.name === '') {
            throw new Error('Operation name is required.');
        }
        if (this.apiClient.isVertexAI()) {
            const resourceName = operation.name.split('/operations/')[0];
            let httpOptions = undefined;
            if (config && 'httpOptions' in config) {
                httpOptions = config.httpOptions;
            }
            const rawOperation = await this.fetchPredictVideosOperationInternal({
                operationName: operation.name,
                resourceName: resourceName,
                config: { httpOptions: httpOptions },
            });
            return operation._fromAPIResponse({
                apiResponse: rawOperation,
                _isVertexAI: true,
            });
        }
        else {
            const rawOperation = await this.getVideosOperationInternal({
                operationName: operation.name,
                config: config,
            });
            return operation._fromAPIResponse({
                apiResponse: rawOperation,
                _isVertexAI: false,
            });
        }
    }
    /**
     * Gets the status of a long-running operation.
     *
     * @param parameters The parameters for the get operation request.
     * @return The updated Operation object, with the latest status or result.
     */
    async get(parameters) {
        const operation = parameters.operation;
        const config = parameters.config;
        if (operation.name === undefined || operation.name === '') {
            throw new Error('Operation name is required.');
        }
        if (this.apiClient.isVertexAI()) {
            const resourceName = operation.name.split('/operations/')[0];
            let httpOptions = undefined;
            if (config && 'httpOptions' in config) {
                httpOptions = config.httpOptions;
            }
            const rawOperation = await this.fetchPredictVideosOperationInternal({
                operationName: operation.name,
                resourceName: resourceName,
                config: { httpOptions: httpOptions },
            });
            return operation._fromAPIResponse({
                apiResponse: rawOperation,
                _isVertexAI: true,
            });
        }
        else {
            const rawOperation = await this.getVideosOperationInternal({
                operationName: operation.name,
                config: config,
            });
            return operation._fromAPIResponse({
                apiResponse: rawOperation,
                _isVertexAI: false,
            });
        }
    }
    async getVideosOperationInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.getOperationParametersToVertex(params);
            path = common.formatMap('{operationName}', body['_url']);
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
            return response;
        }
        else {
            const body = converters.getOperationParametersToMldev(params);
            path = common.formatMap('{operationName}', body['_url']);
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
            return response;
        }
    }
    async fetchPredictVideosOperationInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            const body = converters.fetchPredictOperationParametersToVertex(params);
            path = common.formatMap('{resourceName}:fetchPredictOperation', body['_url']);
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
            return response;
        }
        else {
            throw new Error('This method is only supported by the Vertex AI.');
        }
    }
}
