/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from './_api_client';
import {DownloadFileParameters} from './types';

export interface Downloader {
  /**
   * Downloads a file to the given location.
   *
   * @param params The parameters for downloading the file.
   * @param apiClient The ApiClient to use for uploading.
   * @return A Promises that resolves when the download is complete.
   */
  download(params: DownloadFileParameters, apiClient: ApiClient): Promise<void>;
}
