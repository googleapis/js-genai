/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export var PagedItem;
(function (PagedItem) {
    PagedItem["PAGED_ITEM_BATCH_JOBS"] = "batchJobs";
    PagedItem["PAGED_ITEM_MODELS"] = "models";
    PagedItem["PAGED_ITEM_TUNING_JOBS"] = "tuningJobs";
    PagedItem["PAGED_ITEM_FILES"] = "files";
    PagedItem["PAGED_ITEM_CACHED_CONTENTS"] = "cachedContents";
    PagedItem["PAGED_ITEM_FILE_SEARCH_STORES"] = "fileSearchStores";
    PagedItem["PAGED_ITEM_DOCUMENTS"] = "documents";
})(PagedItem || (PagedItem = {}));
/**
 * Pager class for iterating through paginated results.
 */
export class Pager {
    constructor(name, request, response, params) {
        this.pageInternal = [];
        this.paramsInternal = {};
        this.requestInternal = request;
        this.init(name, response, params);
    }
    init(name, response, params) {
        this.nameInternal = name;
        this.pageInternal = response[this.nameInternal] || [];
        this.sdkHttpResponseInternal = response?.sdkHttpResponse;
        this.idxInternal = 0;
        let requestParams = { config: {} };
        if (!params || Object.keys(params).length === 0) {
            requestParams = { config: {} };
        }
        else if (typeof params === 'object') {
            requestParams = { ...params };
        }
        else {
            requestParams = params;
        }
        if (requestParams['config']) {
            requestParams['config']['pageToken'] = response['nextPageToken'];
        }
        this.paramsInternal = requestParams;
        this.pageInternalSize =
            requestParams['config']?.['pageSize'] ?? this.pageInternal.length;
    }
    initNextPage(response) {
        this.init(this.nameInternal, response, this.paramsInternal);
    }
    /**
     * Returns the current page, which is a list of items.
     *
     * @remarks
     * The first page is retrieved when the pager is created. The returned list of
     * items could be a subset of the entire list.
     */
    get page() {
        return this.pageInternal;
    }
    /**
     * Returns the type of paged item (for example, ``batch_jobs``).
     */
    get name() {
        return this.nameInternal;
    }
    /**
     * Returns the length of the page fetched each time by this pager.
     *
     * @remarks
     * The number of items in the page is less than or equal to the page length.
     */
    get pageSize() {
        return this.pageInternalSize;
    }
    /**
     * Returns the headers of the API response.
     */
    get sdkHttpResponse() {
        return this.sdkHttpResponseInternal;
    }
    /**
     * Returns the parameters when making the API request for the next page.
     *
     * @remarks
     * Parameters contain a set of optional configs that can be
     * used to customize the API request. For example, the `pageToken` parameter
     * contains the token to request the next page.
     */
    get params() {
        return this.paramsInternal;
    }
    /**
     * Returns the total number of items in the current page.
     */
    get pageLength() {
        return this.pageInternal.length;
    }
    /**
     * Returns the item at the given index.
     */
    getItem(index) {
        return this.pageInternal[index];
    }
    /**
     * Returns an async iterator that support iterating through all items
     * retrieved from the API.
     *
     * @remarks
     * The iterator will automatically fetch the next page if there are more items
     * to fetch from the API.
     *
     * @example
     *
     * ```ts
     * const pager = await ai.files.list({config: {pageSize: 10}});
     * for await (const file of pager) {
     *   console.log(file.name);
     * }
     * ```
     */
    [Symbol.asyncIterator]() {
        return {
            next: async () => {
                if (this.idxInternal >= this.pageLength) {
                    if (this.hasNextPage()) {
                        await this.nextPage();
                    }
                    else {
                        return { value: undefined, done: true };
                    }
                }
                const item = this.getItem(this.idxInternal);
                this.idxInternal += 1;
                return { value: item, done: false };
            },
            return: async () => {
                return { value: undefined, done: true };
            },
        };
    }
    /**
     * Fetches the next page of items. This makes a new API request.
     *
     * @throws {Error} If there are no more pages to fetch.
     *
     * @example
     *
     * ```ts
     * const pager = await ai.files.list({config: {pageSize: 10}});
     * let page = pager.page;
     * while (true) {
     *   for (const file of page) {
     *     console.log(file.name);
     *   }
     *   if (!pager.hasNextPage()) {
     *     break;
     *   }
     *   page = await pager.nextPage();
     * }
     * ```
     */
    async nextPage() {
        if (!this.hasNextPage()) {
            throw new Error('No more pages to fetch.');
        }
        const response = await this.requestInternal(this.params);
        this.initNextPage(response);
        return this.page;
    }
    /**
     * Returns true if there are more pages to fetch from the API.
     */
    hasNextPage() {
        if (this.params['config']?.['pageToken'] !== undefined) {
            return true;
        }
        return false;
    }
}
