/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../_api_client';
import {Downloader} from '../_downloader';
import {DownloadFileParameters} from '../types';

export class BrowserDownloader implements Downloader {
  async download(
    _params: DownloadFileParameters,
    _apiClient: ApiClient,
  ): Promise<void> {
    throw new Error(
      'Download to file is not supported in the browser, please use a browser compliant download like an <a> tag.',
    );
  }
}
