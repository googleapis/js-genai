/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Pagers for the GenAI List APIs.

/** @internal */
export enum PagedItem {
  PAGED_ITEM_BATCH_JOBS = 'batchJobs',
  PAGED_ITEM_MODELS = 'models',
  PAGED_ITEM_TUNING_JOBS = 'tuningJobs',
  PAGED_ITEM_FILES = 'files',
  PAGED_ITEM_CACHED_CONTENTS = 'cachedContents',
}

/**
 * Base pager class for iterating through paginated results.
 */
class BasePager<T> {
  private _name!: PagedItem;
  private _page: T[] = [];
  private _config: any;
  private _pageSize!: number;
  protected _request!: (config: any) => any;
  protected _idx!: number;

  _init(
    name: PagedItem,
    request: (config: any) => any,
    response: any,
    config: any,
  ) {
    this._name = name;
    this._request = request;

    this._page = response[this._name] || [];
    this._idx = 0;

    let requestConfig: any = {};
    if (!config) {
      requestConfig = {};
    } else if (typeof config === 'object') {
      requestConfig = {...config};
    } else {
      requestConfig = config;
    }
    requestConfig['pageToken'] = response['nextPageToken'];
    this._config = requestConfig;

    this._pageSize = requestConfig['pageSize'] ?? this._page.length;
  }

  constructor(
    name: PagedItem,
    request: (config: any) => any,
    response: any,
    config: any,
  ) {
    this._init(name, request, response, config);
  }

  /**
   * Returns the current page, which is a list of items.
   *
   * The returned list of items is a subset of the entire list.
   */
  page(): T[] {
    return this._page;
  }

  /**
   * Returns the type of paged item (for example, ``batch_jobs``).
   */
  name(): PagedItem {
    return this._name;
  }

  /**
   * Returns the length of the page fetched each time by this pager.
   *
   * The number of items in the page is less than or equal to the page length.
   */
  pageSize(): number {
    return this._pageSize;
  }

  /**
   * Returns the configuration when making the API request for the next page.
   *
   * A configuration is a set of optional parameters and arguments that can be
   * used to customize the API request. For example, the ``pageToken`` parameter
   * contains the token to request the next page.
   */
  config(): any {
    return this._config;
  }

  /**
   * Returns the total number of items in the current page.
   */
  len(): number {
    return this._page.length;
  }

  /**
   * Returns the item at the given index.
   */
  getItem(index: number): T {
    return this._page[index];
  }

  /**
   * Initializes the next page from the response.
   *
   * This is an internal method that should be called by subclasses after
   * fetching the next page.
   */
  protected _initNextPage(response: any): void {
    this._init(this._name, this._request, response, this._config);
  }
}

/**
 * Pager class for iterating through paginated results.
 */
export class Pager<T> extends BasePager<T> implements AsyncIterable<T> {
  constructor(
    name: PagedItem,
    request: (config: any) => any,
    response: any,
    config: any,
  ) {
    super(name, request, response, config);
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: async () => {
        if (this._idx >= this.len()) {
          try {
            this._nextPage();
          } catch (e) {
            return {value: undefined, done: true};
          }
        }
        let item = this.getItem(this._idx);
        this._idx += 1;
        return {value: item, done: false};
      },
      return: async () => {
        return {value: undefined, done: true};
      },
    };
  }

  /**
   * Fetches the next page of items. This makes a new API request.
   */
  private _nextPage(): T[] {
    if (!this.config()['pageToken']) {
      throw new Error('No more pages to fetch.');
    }
    let response = this._request(this.config());
    this._initNextPage(response);
    return this.page();
  }
}
