/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {ApiClient} from '../_api_client.js';
import {FileStat, Uploader} from '../_uploader.js';
import {
  getBlobStat,
  uploadBlob,
  uploadBlobToFileSearchStore,
} from '../cross/_cross_uploader.js';
import {File, HttpOptions, UploadToFileSearchStoreOperation} from '../types.js';

export class BrowserUploader implements Uploader {
  async upload(
    file: string | Blob,
    uploadUrl: string,
    apiClient: ApiClient,
    httpOptions?: HttpOptions,
  ): Promise<File> {
    if (typeof file === 'string') {
      throw new Error('File path is not supported in browser uploader.');
    }

    return await uploadBlob(file, uploadUrl, apiClient, httpOptions);
  }

  async uploadToFileSearchStore(
    file: string | Blob,
    uploadUrl: string,
    apiClient: ApiClient,
    httpOptions?: HttpOptions,
  ): Promise<UploadToFileSearchStoreOperation> {
    if (typeof file === 'string') {
      throw new Error('File path is not supported in browser uploader.');
    }

    return await uploadBlobToFileSearchStore(
      file,
      uploadUrl,
      apiClient,
      httpOptions,
    );
  }

  async stat(file: string | Blob): Promise<FileStat> {
    if (typeof file === 'string') {
      throw new Error('File path is not supported in browser uploader.');
    } else {
      return await getBlobStat(file);
    }
  }
}
