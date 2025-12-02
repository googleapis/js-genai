/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from './_common.js';
import { BaseModule } from './_common.js';
import * as converters from './converters/_documents_converters.js';
import { PagedItem, Pager } from './pagers.js';
import * as types from './types.js';
export class Documents extends BaseModule {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
        /**
         * Lists documents.
         *
         * @param params - The parameters for the list request.
         * @return - A pager of documents.
         *
         * @example
         * ```ts
         * const documents = await ai.documents.list({config: {'pageSize': 2}});
         * for await (const document of documents) {
         *   console.log(document);
         * }
         * ```
         */
        this.list = async (params) => {
            return new Pager(PagedItem.PAGED_ITEM_DOCUMENTS, (x) => this.listInternal({
                parent: params.parent,
                config: x.config,
            }), await this.listInternal(params), params);
        };
    }
    /**
     * Gets a Document.
     *
     * @param params - The parameters for getting a document.
     * @return Document.
     */
    async get(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.getDocumentParametersToMldev(params);
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
     * Deletes a Document.
     *
     * @param params - The parameters for deleting a document.
     */
    async delete(params) {
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.deleteDocumentParametersToMldev(params);
            path = common.formatMap('{name}', body['_url']);
            queryParams = body['_query'];
            delete body['_url'];
            delete body['_query'];
            await this.apiClient.request({
                path: path,
                queryParams: queryParams,
                body: JSON.stringify(body),
                httpMethod: 'DELETE',
                httpOptions: params.config?.httpOptions,
                abortSignal: params.config?.abortSignal,
            });
        }
    }
    /**
     * Lists all Documents in a FileSearchStore.
     *
     * @param params - The parameters for listing documents.
     * @return ListDocumentsResponse.
     */
    async listInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.listDocumentsParametersToMldev(params);
            path = common.formatMap('{parent}/documents', body['_url']);
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
                const resp = converters.listDocumentsResponseFromMldev(apiResponse);
                const typedResp = new types.ListDocumentsResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
}
