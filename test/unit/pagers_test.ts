/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {PagedItem, Pager} from '../../src/pagers.js';
import {File, ListFilesParameters, ListFilesResponse} from '../../src/types.js';

class FakeFiles {
  private responseIndex = 0;
  constructor(private readonly responses: ListFilesResponse[]) {}

  list = async (params: ListFilesParameters = {}): Promise<Pager<File>> => {
    return new Pager<File>(
      PagedItem.PAGED_ITEM_FILES,
      (x: ListFilesParameters) => this.listInternal(x),
      await this.listInternal(params),
      params,
    );
  };

  private async listInternal(
    _params: ListFilesParameters,
  ): Promise<ListFilesResponse> {
    return Promise.resolve(this.responses[this.responseIndex++]);
  }
}

function buildListFilesResponse(
  pageIndex: string,
  numOfFiles: number,
  nextPageToken?: string,
): ListFilesResponse {
  const files = [];
  for (let i = 1; i <= numOfFiles; i++) {
    files.push({name: `files/${pageIndex}/${i}`} as File);
  }
  return {nextPageToken, files} as ListFilesResponse;
}

describe('Iterate items', () => {
  const testCases = [
    {
      name: 'empty response',
      params: {},
      responses: [new ListFilesResponse()],
      expectedFiles: [],
      expectedPages: 1,
    },
    {
      name: 'page size smaller than total files size',
      params: {config: {pageSize: 2}},
      responses: [
        buildListFilesResponse('page1', 2, 'token1'),
        buildListFilesResponse('page2', 1),
      ],
      expectedFiles: ['files/page1/1', 'files/page1/2', 'files/page2/1'],
      expectedPages: 2,
    },
    {
      name: 'page size greater than total files size',
      params: {config: {pageSize: 5}},
      responses: [buildListFilesResponse('page1', 2)],
      expectedFiles: ['files/page1/1', 'files/page1/2'],
      expectedPages: 1,
    },
    {
      name: 'page size equals to total files size',
      params: {config: {pageSize: 2}},
      responses: [buildListFilesResponse('page1', 2)],
      expectedFiles: ['files/page1/1', 'files/page1/2'],
      expectedPages: 1,
    },
  ];

  testCases.forEach(async (testCase) => {
    it(testCase.name + ' with iterator', async () => {
      const files = new FakeFiles(testCase.responses);
      const pager = await files.list(testCase.params);

      const fileNames = [];
      for await (const file of pager) {
        fileNames.push(file.name);
      }

      expect(fileNames).toEqual(testCase.expectedFiles);
    });

    it(testCase.name + ' with pager', async () => {
      const files = new FakeFiles(testCase.responses);
      const pager = await files.list(testCase.params);

      const fileNames = [];
      let page = pager.page;
      for (const file of page) {
        fileNames.push(file.name);
      }
      let numOfPages = 1;
      while (pager.hasNextPage()) {
        page = await pager.nextPage();
        numOfPages++;
        for (const file of page) {
          fileNames.push(file.name);
        }
      }

      expect(fileNames).toEqual(testCase.expectedFiles);
      expect(numOfPages).toEqual(testCase.expectedPages);
    });
  });
});

describe('Pager properties', () => {
  it('init values', async () => {
    const firstPageResponse = buildListFilesResponse('page1', 2, 'token1');
    const secondPageResponse = buildListFilesResponse('page2', 2);
    const params = {config: {pageSize: 10}};
    const pager = new Pager<File>(
      PagedItem.PAGED_ITEM_FILES,
      (_unused: ListFilesParameters) => Promise.resolve(secondPageResponse),
      firstPageResponse,
      params,
    );

    expect(pager.page).toEqual(firstPageResponse['files'] as File[]);
    expect(pager.name).toEqual('files');
    expect(pager.pageSize).toEqual(10);
    expect(pager.params).toEqual(params);
    expect(pager.pageLength).toEqual(2);
    expect(pager.getItem(0)).toEqual({name: 'files/page1/1'});
  });

  it('next page', async () => {
    const firstPageResponse = buildListFilesResponse('page1', 2, 'token1');
    const secondPageResponse = buildListFilesResponse('page2', 1);
    const params = {config: {pageSize: 10}};
    const pager = new Pager<File>(
      PagedItem.PAGED_ITEM_FILES,
      (_unused: ListFilesParameters) => Promise.resolve(secondPageResponse),
      firstPageResponse,
      params,
    );
    await pager.nextPage();

    expect(pager.page).toEqual(secondPageResponse['files'] as File[]);
    expect(pager.name).toEqual('files');
    expect(pager.pageSize).toEqual(10);
    expect(pager.params).toEqual(params);
    expect(pager.pageLength).toEqual(1);
    expect(pager.getItem(0)).toEqual({name: 'files/page2/1'});
  });
});
