/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../../src/node/node_client.js';
import {createZeroFilledTempFile} from '../../_generate_test_file.js';

const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 8; // bytes
const TEST_FILE_SIZE = 1024 * 1024 * 30; // bytes
const DEFAULT_TEST_MIMETYPE = 'text/plain';
const TEST_UPLOAD_URL =
  'https://generativelanguage.googleapis.com/upload/v1beta/files?upload_id=test-upload-id&upload_protocol=resumable';
const fetchOkOptions = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {
    'Content-Type': 'application/json',
    'x-goog-upload-status': 'active',
  },
  url: 'some-url',
};
const lastCorrectFetchOkOptions = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {
    'Content-Type': 'application/json',
    'x-goog-upload-status': 'final',
  },
  url: 'some-url',
};
const mockResponse = new Response(
  JSON.stringify({
    data: 'data1',
  }),
  fetchOkOptions,
);

describe('Node uploader', () => {
  describe('Input is a string path', () => {
    let filePath: string;
    const fileSize = TEST_FILE_SIZE;
    beforeAll(async () => {
      filePath = await createZeroFilledTempFile(TEST_FILE_SIZE);
    });

    it('should get the file stat of a file', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const fileStats =
        await client['apiClient'].clientOptions.uploader?.stat(filePath);
      expect(fileStats?.size).toBe(fileSize);
      expect(fileStats?.type).toBe(DEFAULT_TEST_MIMETYPE);
    });
    it('should upload the file as stream with exact DEFAULT_CHUNK_SIZE except the last chunk', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const numRequests = Math.ceil(TEST_FILE_SIZE / DEFAULT_CHUNK_SIZE);

      const mockResponses = [];
      for (let i = 0; i < numRequests - 1; i++) {
        mockResponses.push(Promise.resolve(mockResponse));
      }
      mockResponses.push(
        Promise.resolve(
          new Response(
            JSON.stringify({
              data: 'data12',
            }),
            lastCorrectFetchOkOptions,
          ),
        ),
      );
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );

      const uploader = client['apiClient'].clientOptions.uploader;
      if (uploader === undefined) {
        throw new Error('Uploader is not set.');
      }

      await uploader.upload(filePath, TEST_UPLOAD_URL, client['apiClient']);
      expect(fetchSpy).toHaveBeenCalledTimes(numRequests);
      const allArgs = fetchSpy.calls.allArgs();
      let byteProcessed = 0;

      for (let i = 0; i < numRequests; i++) {
        expect(allArgs[i][1]?.['body']).toBeInstanceOf(Blob);
        const body = allArgs[i][1]?.['body'] as Blob;
        expect(
          body?.size == Math.min(DEFAULT_CHUNK_SIZE, fileSize - byteProcessed),
        ).toBeTrue();
        byteProcessed += body?.size;
      }
      expect(byteProcessed).toBe(fileSize);
      console.log(`byteProcessed: ${byteProcessed}, fileSize: ${fileSize}`);
    });
  });

  describe('Input is a blob', () => {
    let testBlob: Blob;
    const fileSize = TEST_FILE_SIZE;
    beforeEach(() => {
      testBlob = new Blob([new Uint8Array(fileSize)], {
        type: DEFAULT_TEST_MIMETYPE,
      });
    });
    it('should get the file stat of a file', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const fileStats =
        await client['apiClient'].clientOptions.uploader?.stat(testBlob);
      expect(fileStats?.size).toBe(fileSize);
      expect(fileStats?.type).toBe(DEFAULT_TEST_MIMETYPE);
    });
    it('should get a readable stream of a file with exact DEFAULT_CHUNK_SIZE except the last chunk', async () => {
      const client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
      const numRequests = Math.ceil(TEST_FILE_SIZE / DEFAULT_CHUNK_SIZE);

      const mockResponses = [];
      for (let i = 0; i < numRequests - 1; i++) {
        mockResponses.push(Promise.resolve(mockResponse));
      }
      mockResponses.push(
        Promise.resolve(
          new Response(
            JSON.stringify({
              data: 'data22',
            }),
            lastCorrectFetchOkOptions,
          ),
        ),
      );
      const fetchSpy = spyOn(global, 'fetch').and.returnValues(
        ...mockResponses,
      );

      const uploader = client['apiClient'].clientOptions.uploader;
      if (uploader === undefined) {
        throw new Error('Uploader is not set.');
      }
      await uploader.upload(testBlob, TEST_UPLOAD_URL, client['apiClient']);
      expect(fetchSpy).toHaveBeenCalledTimes(numRequests);
      const allArgs = fetchSpy.calls.allArgs();
      let byteProcessed = 0;
      for (let i = 0; i < numRequests; i++) {
        expect(allArgs[i][1]?.['body']).toBeInstanceOf(Blob);
        const body = allArgs[i][1]?.['body'] as Blob;
        expect(
          body?.size == Math.min(DEFAULT_CHUNK_SIZE, fileSize - byteProcessed),
        ).toBeTrue();
        byteProcessed += body?.size;
      }
      expect(byteProcessed).toBe(fileSize);
      console.log(`byteProcessed: ${byteProcessed}, fileSize: ${fileSize}`);
    });
  });
});
