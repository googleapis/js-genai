import * as _converters from '../converters/_operations_converters.js';
import { HttpResponse, UploadToFileSearchStoreOperation, } from '../types.js';
import { crossError } from './_cross_error.js';
export const MAX_CHUNK_SIZE = 1024 * 1024 * 8; // bytes
export const MAX_RETRY_COUNT = 3;
export const INITIAL_RETRY_DELAY_MS = 1000;
export const DELAY_MULTIPLIER = 2;
export const X_GOOG_UPLOAD_STATUS_HEADER_FIELD = 'x-goog-upload-status';
export class CrossUploader {
    async upload(file, uploadUrl, apiClient) {
        if (typeof file === 'string') {
            throw crossError();
        }
        else {
            return uploadBlob(file, uploadUrl, apiClient);
        }
    }
    async uploadToFileSearchStore(file, uploadUrl, apiClient) {
        if (typeof file === 'string') {
            throw crossError();
        }
        else {
            return uploadBlobToFileSearchStore(file, uploadUrl, apiClient);
        }
    }
    async stat(file) {
        if (typeof file === 'string') {
            throw crossError();
        }
        else {
            return getBlobStat(file);
        }
    }
}
export async function uploadBlob(file, uploadUrl, apiClient) {
    const response = await uploadBlobInternal(file, uploadUrl, apiClient);
    const responseJson = (await response?.json());
    if (response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD] !== 'final') {
        throw new Error('Failed to upload file: Upload status is not finalized.');
    }
    return responseJson['file'];
}
export async function uploadBlobToFileSearchStore(file, uploadUrl, apiClient) {
    const response = await uploadBlobInternal(file, uploadUrl, apiClient);
    const responseJson = (await response?.json());
    if (response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD] !== 'final') {
        throw new Error('Failed to upload file: Upload status is not finalized.');
    }
    const resp = _converters.uploadToFileSearchStoreOperationFromMldev(responseJson);
    const typedResp = new UploadToFileSearchStoreOperation();
    Object.assign(typedResp, resp);
    return typedResp;
}
async function uploadBlobInternal(file, uploadUrl, apiClient) {
    let fileSize = 0;
    let offset = 0;
    let response = new HttpResponse(new Response());
    let uploadCommand = 'upload';
    fileSize = file.size;
    while (offset < fileSize) {
        const chunkSize = Math.min(MAX_CHUNK_SIZE, fileSize - offset);
        const chunk = file.slice(offset, offset + chunkSize);
        if (offset + chunkSize >= fileSize) {
            uploadCommand += ', finalize';
        }
        let retryCount = 0;
        let currentDelayMs = INITIAL_RETRY_DELAY_MS;
        while (retryCount < MAX_RETRY_COUNT) {
            response = await apiClient.request({
                path: '',
                body: chunk,
                httpMethod: 'POST',
                httpOptions: {
                    apiVersion: '',
                    baseUrl: uploadUrl,
                    headers: {
                        'X-Goog-Upload-Command': uploadCommand,
                        'X-Goog-Upload-Offset': String(offset),
                        'Content-Length': String(chunkSize),
                    },
                },
            });
            if (response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD]) {
                break;
            }
            retryCount++;
            await sleep(currentDelayMs);
            currentDelayMs = currentDelayMs * DELAY_MULTIPLIER;
        }
        offset += chunkSize;
        // The `x-goog-upload-status` header field can be `active`, `final` and
        //`cancelled` in resposne.
        if (response?.headers?.[X_GOOG_UPLOAD_STATUS_HEADER_FIELD] !== 'active') {
            break;
        }
        // TODO(b/401391430) Investigate why the upload status is not finalized
        // even though all content has been uploaded.
        if (fileSize <= offset) {
            throw new Error('All content has been uploaded, but the upload status is not finalized.');
        }
    }
    return response;
}
export async function getBlobStat(file) {
    const fileStat = { size: file.size, type: file.type };
    return fileStat;
}
export function sleep(ms) {
    return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
