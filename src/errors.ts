import { ApiErrorResponse } from "./types";

/**
 * Base interface for the API error response. 
 */
export class ApiError extends Error {
  code: ApiErrorResponse['error']['code'];
  status: ApiErrorResponse['error']['status'];
  details: ApiErrorResponse['error']['details'];
  name: string = 'ApiError';

  constructor({code, details, message, status}: ApiErrorResponse['error'], stackTrace?: string) {
    super(message, {cause: stackTrace});
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Client errors raised by the GenAI API.
 */
export class ClientError extends ApiError {
  constructor(response: ApiErrorResponse['error'], stackTrace?: string) {
    if (stackTrace) {
      super(response, stackTrace);
    } else {
      super(response, new Error().stack);
    }
    this.name = 'ClientError';
  }
}

/**
 * Server errors raised by the GenAI API.
 */
export class ServerError extends ApiError {
  constructor(response: ApiErrorResponse['error'], stackTrace?: string) {
    if (stackTrace) {
      super(response, stackTrace);
    } else {
      super(response, new Error().stack);
    }
    this.name = 'ServerError';
  }
}