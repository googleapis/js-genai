/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from './_api_client.js';
import {File} from './types.js';

/**
 * Represents the size and mimeType of a file. The information is used to
 * request the upload URL from the https://generativelanguage.googleapis.com/upload/v1beta/files endpoint.
 * This interface defines the structure for constructing and executing HTTP
 * requests.
 */
export interface FileStat {
  /**
   * The size of the file in bytes.
   */
  size: number;

  /**
   * The MIME type of the file.
   */
  type: string | undefined;
}

export interface Uploader {
  /**
   * Uploads a file to the given upload url.
   *
   * @param file The file to upload. file is in string type or a Blob.
   * @param uploadUrl The upload URL as a string is where the file will be
   *     uploaded to. The uploadUrl must be a url that was returned by the
   * https://generativelanguage.googleapis.com/upload/v1beta/files endpoint
   * @param apiClient The ApiClient to use for uploading.
   * @return A Promise that resolves to types.File.
   */
  upload(
    file: string | Blob,
    uploadUrl: string,
    apiClient: ApiClient,
  ): Promise<File>;

  /**
   * Returns the file's mimeType and the size of a given file. If the file is a
   * string path, the file type is determined by the file extension. If the
   * file's type cannot be determined, the type will be set to undefined.
   *
   * @param file The file to get the stat for. Can be a string path or a Blob.
   * @return A Promise that resolves to the file stat of the given file.
   */
  stat(file: string | Blob): Promise<FileStat>;
}
