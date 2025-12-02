/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as common from './_common.js';
import { BaseModule } from './_common.js';
import * as converters from './converters/_filesearchstores_converters.js';
import { Documents } from './documents.js';
import { PagedItem, Pager } from './pagers.js';
import * as types from './types.js';
export class FileSearchStores extends BaseModule {
    constructor(apiClient, documents = new Documents(apiClient)) {
        super();
        this.apiClient = apiClient;
        this.documents = documents;
        /**
         * Lists file search stores.
         *
         * @param params - The parameters for the list request.
         * @return - A pager of file search stores.
         *
         * @example
         * ```ts
         * const fileSearchStores = await ai.fileSearchStores.list({config: {'pageSize': 2}});
         * for await (const fileSearchStore of fileSearchStores) {
         *   console.log(fileSearchStore);
         * }
         * ```
         */
        this.list = async (params = {}) => {
            return new Pager(PagedItem.PAGED_ITEM_FILE_SEARCH_STORES, (x) => this.listInternal(x), await this.listInternal(params), params);
        };
    }
    /**
     * Uploads a file asynchronously to a given File Search Store.
     * This method is not available in Vertex AI.
     * Supported upload sources:
     * - Node.js: File path (string) or Blob object.
     * - Browser: Blob object (e.g., File).
     *
     * @remarks
     * The `mimeType` can be specified in the `config` parameter. If omitted:
     *  - For file path (string) inputs, the `mimeType` will be inferred from the
     *     file extension.
     *  - For Blob object inputs, the `mimeType` will be set to the Blob's `type`
     *     property.
     *
     * This section can contain multiple paragraphs and code examples.
     *
     * @param params - Optional parameters specified in the
     *        `types.UploadToFileSearchStoreParameters` interface.
     *         @see {@link types.UploadToFileSearchStoreParameters#config} for the optional
     *         config in the parameters.
     * @return A promise that resolves to a long running operation.
     * @throws An error if called on a Vertex AI client.
     * @throws An error if the `mimeType` is not provided and can not be inferred,
     * the `mimeType` can be provided in the `params.config` parameter.
     * @throws An error occurs if a suitable upload location cannot be established.
     *
     * @example
     * The following code uploads a file to a given file search store.
     *
     * ```ts
     * const operation = await ai.fileSearchStores.upload({fileSearchStoreName: 'fileSearchStores/foo-bar', file: 'file.txt', config: {
     *   mimeType: 'text/plain',
     * }});
     * console.log(operation.name);
     * ```
     */
    async uploadToFileSearchStore(params) {
        if (this.apiClient.isVertexAI()) {
            throw new Error('Vertex AI does not support uploading files to a file search store.');
        }
        return this.apiClient.uploadFileToFileSearchStore(params.fileSearchStoreName, params.file, params.config);
    }
    /**
     * Creates a File Search Store.
     *
     * @param params - The parameters for creating a File Search Store.
     * @return FileSearchStore.
     */
    async create(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.createFileSearchStoreParametersToMldev(params);
            path = common.formatMap('fileSearchStores', body['_url']);
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
     * Gets a File Search Store.
     *
     * @param params - The parameters for getting a File Search Store.
     * @return FileSearchStore.
     */
    async get(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.getFileSearchStoreParametersToMldev(params);
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
     * Deletes a File Search Store.
     *
     * @param params - The parameters for deleting a File Search Store.
     */
    async delete(params) {
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.deleteFileSearchStoreParametersToMldev(params);
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
     * Lists all FileSearchStore owned by the user.
     *
     * @param params - The parameters for listing file search stores.
     * @return ListFileSearchStoresResponse.
     */
    async listInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.listFileSearchStoresParametersToMldev(params);
            path = common.formatMap('fileSearchStores', body['_url']);
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
                const resp = converters.listFileSearchStoresResponseFromMldev(apiResponse);
                const typedResp = new types.ListFileSearchStoresResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    async uploadToFileSearchStoreInternal(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.uploadToFileSearchStoreParametersToMldev(params);
            path = common.formatMap('upload/v1beta/{file_search_store_name}:uploadToFileSearchStore', body['_url']);
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
                const resp = converters.uploadToFileSearchStoreResumableResponseFromMldev(apiResponse);
                const typedResp = new types.UploadToFileSearchStoreResumableResponse();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
    /**
     * Imports a File from File Service to a FileSearchStore.
     *
     * This is a long-running operation, see aip.dev/151
     *
     * @param params - The parameters for importing a file to a file search store.
     * @return ImportFileOperation.
     */
    async importFile(params) {
        let response;
        let path = '';
        let queryParams = {};
        if (this.apiClient.isVertexAI()) {
            throw new Error('This method is only supported by the Gemini Developer API.');
        }
        else {
            const body = converters.importFileParametersToMldev(params);
            path = common.formatMap('{file_search_store_name}:importFile', body['_url']);
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
                const resp = converters.importFileOperationFromMldev(apiResponse);
                const typedResp = new types.ImportFileOperation();
                Object.assign(typedResp, resp);
                return typedResp;
            });
        }
    }
}
