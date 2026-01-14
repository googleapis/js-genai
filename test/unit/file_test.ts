/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '../../src/node/index.js';
import {createZeroFilledTempFile} from '../_generate_test_file.js';

describe('File', () => {
  let client: GoogleGenAI;
  beforeEach(() => {
    client = new GoogleGenAI({vertexai: false, apiKey: 'fake-api-key'});
  });

  describe('delete', () => {
    it('It should delete the file by given config', async () => {
      const deleteUrl =
        'https://generativelanguage.googleapis.com/v1beta/files/6h7lat0gfq5n';
      const deleteOkoptions = {
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: {
          'Content-Type': 'application/json',
        },
        url: 'some-url',
      };

      spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(new Response('{}', deleteOkoptions)),
      );
      await client.files.delete({
        name: 'files/6h7lat0gfq5n',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        jasmine.stringMatching(deleteUrl),
        jasmine.any(Object),
      );
    });
  });
  describe('upload', () => {
    const DEFAULT_CHUNK_SIZE = 1024 * 1024 * 8; // bytes
    const TEST_FILE_SIZE = 1024 * 1024 * 30; // bytes
    const DEFAULT_TEST_MIMETYPE = 'text/plain';
    const TEST_CREATE_URL =
      'https://generativelanguage.googleapis.com/upload/v1beta/files';
    const TEST_UPLOAD_URL =
      'https://generativelanguage.googleapis.com/upload/v1beta/files?upload_id=test-upload-id&upload_protocol=resumable';

    const createUrlOkoptions = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-upload-url': TEST_UPLOAD_URL,
      },
      url: 'some-url',
    };
    const uploadOkOptions = {
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
      uploadOkOptions,
    );
    const fileSize = TEST_FILE_SIZE;
    describe('Node_client', () => {
      it('It should upload the file from a string path.', async () => {
        const filePath = await createZeroFilledTempFile(TEST_FILE_SIZE);
        const numRequests = Math.ceil(TEST_FILE_SIZE / DEFAULT_CHUNK_SIZE);

        // one initial request to get the upload url, and then the rest
        // of the requests to upload the file.
        const mockResponses = [
          Promise.resolve(new Response('', createUrlOkoptions)),
        ];

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

        await client.files.upload({file: filePath});
        expect(fetchSpy).toHaveBeenCalledTimes(numRequests + 1);

        const allArgs = fetchSpy.calls.allArgs();

        // make sure we get the correct create url. mimeType and fileSize in the
        // first request.
        expect(allArgs[0][0]).toBe(TEST_CREATE_URL);
        expect(allArgs[0][1]?.['body']).toContain(DEFAULT_TEST_MIMETYPE);
        expect(allArgs[0][1]?.['body']).toContain(TEST_FILE_SIZE);

        let byteProcessed = 0;
        for (let i = 1; i < numRequests + 1; i++) {
          // make sure we get the correct upload url in the first
          // request.
          expect(allArgs[i][0]).toBe(TEST_UPLOAD_URL);
          expect(allArgs[i][1]?.['body']).toBeInstanceOf(Blob);
          const body = allArgs[i][1]?.['body'] as Blob;
          expect(
            body?.size ==
              Math.min(DEFAULT_CHUNK_SIZE, fileSize - byteProcessed),
          ).toBeTrue();
          byteProcessed += body?.size;
        }
        // make sure we have processed all the bytes.
        expect(byteProcessed).toBe(fileSize);
      });
      it('It should retry upload the file from a string path if the response does not have x-goog-upload-status header.', async () => {
        const filePath = await createZeroFilledTempFile(TEST_FILE_SIZE);
        const numRequests = Math.ceil(TEST_FILE_SIZE / DEFAULT_CHUNK_SIZE);
        const uploadMissingStatusOptions = {
          status: 200,
          statusText: 'OK',
          ok: true,
          headers: {
            'Content-Type': 'application/json',
          },
          url: 'some-url',
        };

        // one initial request to get the upload url, and then the rest
        // of the requests to upload the file.
        const mockResponses = [
          Promise.resolve(new Response('', createUrlOkoptions)),
          Promise.resolve(new Response('', uploadMissingStatusOptions)),
        ];

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

        await client.files.upload({file: filePath});
        // 1 initial request to get the upload url, 1 response missing x-goog-upload-status header and then the rest
        // of the requests to upload the file.
        expect(fetchSpy).toHaveBeenCalledTimes(numRequests + 1 + 1);

        const allArgs = fetchSpy.calls.allArgs();

        // make sure we get the correct create url. mimeType and fileSize in
        // the first request.
        expect(allArgs[0][0]).toBe(TEST_CREATE_URL);
        expect(allArgs[0][1]?.['body']).toContain(DEFAULT_TEST_MIMETYPE);
        expect(allArgs[0][1]?.['body']).toContain(TEST_FILE_SIZE);

        let byteProcessed = 0;
        for (let i = 2; i < numRequests + 1 + 1; i++) {
          // make sure we get the correct upload url in the first
          // request.
          expect(allArgs[i][0]).toBe(TEST_UPLOAD_URL);
          expect(allArgs[i][1]?.['body']).toBeInstanceOf(Blob);
          const body = allArgs[i][1]?.['body'] as Blob;
          expect(
            body?.size ==
              Math.min(DEFAULT_CHUNK_SIZE, fileSize - byteProcessed),
          ).toBeTrue();
          byteProcessed += body?.size;
        }
        // make sure we have processed all the bytes.
        expect(byteProcessed).toBe(fileSize);
      });
      it('It should upload the file from a blob.', async () => {
        const testBlob = new Blob([new Uint8Array(fileSize)], {
          type: DEFAULT_TEST_MIMETYPE,
        });
        const numRequests = Math.ceil(TEST_FILE_SIZE / DEFAULT_CHUNK_SIZE);

        // one initial request to get the upload url, and then the rest
        // of the requests to upload the file.
        const mockResponses = [
          Promise.resolve(new Response('', createUrlOkoptions)),
        ];

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

        await client.files.upload({file: testBlob});

        expect(fetchSpy).toHaveBeenCalledTimes(numRequests + 1);
        const allArgs = fetchSpy.calls.allArgs();

        // make sure we get the correct create url. mimeType and fileSize in the
        // first request.
        expect(allArgs[0][0]).toBe(TEST_CREATE_URL);
        expect(allArgs[0][1]?.['body']).toContain(DEFAULT_TEST_MIMETYPE);
        expect(allArgs[0][1]?.['body']).toContain(TEST_FILE_SIZE);
        let byteProcessed = 0;
        for (let i = 1; i < numRequests + 1; i++) {
          // make sure we get the correct upload url in the first
          // request.
          expect(allArgs[i][0]).toBe(TEST_UPLOAD_URL);
          expect(allArgs[i][1]?.['body']).toBeInstanceOf(Blob);
          const body = allArgs[i][1]?.['body'] as Blob;
          expect(
            body?.size ==
              Math.min(DEFAULT_CHUNK_SIZE, fileSize - byteProcessed),
          ).toBeTrue();
          byteProcessed += body?.size;
        }
        expect(byteProcessed).toBe(fileSize);
      });
      it('It should retry upload the file from a blob if the response does not have x-goog-upload-status header.', async () => {
        const testBlob = new Blob([new Uint8Array(fileSize)], {
          type: DEFAULT_TEST_MIMETYPE,
        });
        const numRequests = Math.ceil(TEST_FILE_SIZE / DEFAULT_CHUNK_SIZE);
        const uploadMissingStatusOptions = {
          status: 200,
          statusText: 'OK',
          ok: true,
          headers: {
            'Content-Type': 'application/json',
          },
          url: 'some-url',
        };

        // 1 initial request to get the upload url, 2 response missing x-goog-upload-status header and then the rest
        // of the requests to upload the file.
        const mockResponses = [
          Promise.resolve(new Response('', createUrlOkoptions)),
          Promise.resolve(new Response('', uploadMissingStatusOptions)),
        ];

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

        await client.files.upload({file: testBlob});

        // 1 initial request to get the upload url, 1 response missing x-goog-upload-status header and then the rest
        expect(fetchSpy).toHaveBeenCalledTimes(numRequests + 1 + 1);
        const allArgs = fetchSpy.calls.allArgs();

        // make sure we get the correct create url. mimeType and fileSize in the
        // first request.
        expect(allArgs[0][0]).toBe(TEST_CREATE_URL);
        expect(allArgs[0][1]?.['body']).toContain(DEFAULT_TEST_MIMETYPE);
        expect(allArgs[0][1]?.['body']).toContain(TEST_FILE_SIZE);
        let byteProcessed = 0;
        for (let i = 2; i < numRequests + 1 + 1; i++) {
          // make sure we get the correct upload url in the first
          // request.
          expect(allArgs[i][0]).toBe(TEST_UPLOAD_URL);
          expect(allArgs[i][1]?.['body']).toBeInstanceOf(Blob);
          const body = allArgs[i][1]?.['body'] as Blob;
          expect(
            body?.size ==
              Math.min(DEFAULT_CHUNK_SIZE, fileSize - byteProcessed),
          ).toBeTrue();
          byteProcessed += body?.size;
        }
        expect(byteProcessed).toBe(fileSize);
      });

    });
  });
  describe('registerFiles', () => {
    it('should call the API client with the correct parameters', async () => {
      const mockResponse = {
        files: [
          {
            name: 'files/123',
            displayName: 'object1',
            mimeType: 'image/jpeg',
            sizeBytes: '12345',
            createTime: '2025-01-06T10:00:00Z',
            updateTime: '2025-01-06T10:00:00Z',
            expirationTime: '2025-01-07T10:00:00Z',
            sha256Hash: 'abc123',
            uri: 'gs://bucket/object1',
            state: 'ACTIVE' as any,
          },
        ],
      };

      const fetchSpy = spyOn(global, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
          }),
        ),
      );

      const params = {
        auth: {
          getRequestHeaders: jasmine.createSpy().and.returnValue(Promise.resolve({})),
        } as any,
        uris: ['gs://bucket/object1'],
      };

      const response = await client.files.registerFiles(params as any);
      expect(response.files).toEqual(mockResponse.files);

      expect(fetchSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/files:register$/),
        jasmine.objectContaining({
          method: 'POST',
          body: JSON.stringify({uris: ['gs://bucket/object1']}),
        }),
      );
    });

    it('should throw an error if called on a Vertex AI client', async () => {
      const vertexClient = new GoogleGenAI({
        vertexai: true,
        apiKey: 'fake-api-key',
      });
      const params = {
        auth: {
          getRequestHeaders: jasmine.createSpy().and.returnValue(Promise.resolve({})),
        } as any,
        uris: ['gs://bucket/object1'],
      };

      await expectAsync(
        vertexClient.files.registerFiles(params as any),
      ).toBeRejectedWithError(
        'This method is only supported by the Gemini Developer API.',
      );
    });
  });
});
