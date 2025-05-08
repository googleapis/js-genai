/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiClient} from '../_api_client';
import {Downloader} from '../_downloader';
import {DownloadFileParameters} from '../types';

import {crossError} from './_cross_error';

export class CrossDownloader implements Downloader {
  async download(
    _params: DownloadFileParameters,
    _apiClient: ApiClient,
  ): Promise<void> {
    throw crossError();
  }
}
