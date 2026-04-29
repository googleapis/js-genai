/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource.js';
import { APIPromise } from '../core/api-promise.js';
import { RequestOptions } from '../internal/request-options.js';
import { path } from '../internal/utils/path.js';

export class BaseWebhooks extends APIResource {
  static override readonly _key: readonly ['webhooks'] = Object.freeze(['webhooks'] as const);

  /**
   * Creates a new Webhook.
   */
  create(params: WebhookCreateParams, options?: RequestOptions): APIPromise<Webhook> {
    const { api_version = this._client.apiVersion, ...body } = params;
    return this._client.post(path`/${api_version}/webhooks`, { body, ...options });
  }

  /**
   * Updates an existing Webhook.
   */
  update(
    id: string,
    params: WebhookUpdateParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Webhook> {
    const { api_version = this._client.apiVersion, update_mask, ...body } = params ?? {};
    return this._client.patch(path`/${api_version}/webhooks/${id}`, {
      query: { update_mask },
      body,
      ...options,
    });
  }

  /**
   * Lists all Webhooks.
   */
  list(
    params: WebhookListParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<WebhookListResponse> {
    const { api_version = this._client.apiVersion, ...query } = params ?? {};
    return this._client.get(path`/${api_version}/webhooks`, { query, ...options });
  }

  /**
   * Deletes a Webhook.
   */
  delete(
    id: string,
    params: WebhookDeleteParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<WebhookDeleteResponse> {
    const { api_version = this._client.apiVersion } = params ?? {};
    return this._client.delete(path`/${api_version}/webhooks/${id}`, options);
  }

  /**
   * Gets a specific Webhook.
   */
  get(
    id: string,
    params: WebhookGetParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Webhook> {
    const { api_version = this._client.apiVersion } = params ?? {};
    return this._client.get(path`/${api_version}/webhooks/${id}`, options);
  }

  /**
   * Sends a ping event to a Webhook.
   */
  ping(
    id: string,
    params: WebhookPingParams | null | undefined = undefined,
    options?: RequestOptions,
  ): APIPromise<WebhookPingResponse> {
    const { api_version = this._client.apiVersion, body } = params ?? {};
    return this._client.post(path`/${api_version}/webhooks/${id}:ping`, { body: body, ...options });
  }

  /**
   * Generates a new signing secret for a Webhook.
   */
  rotateSigningSecret(
    id: string,
    params: WebhookRotateSigningSecretParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<WebhookRotateSigningSecretResponse> {
    const { api_version = this._client.apiVersion, ...body } = params ?? {};
    return this._client.post(path`/${api_version}/webhooks/${id}:rotateSigningSecret`, { body, ...options });
  }
}
export class Webhooks extends BaseWebhooks {}

/**
 * Represents a signing secret used to verify webhook payloads.
 */
export interface SigningSecret {
  /**
   * Output only. The expiration date of the signing secret.
   */
  expire_time?: string;

  /**
   * Output only. The truncated version of the signing secret.
   */
  truncated_secret?: string;
}

/**
 * A Webhook resource.
 */
export interface Webhook {
  /**
   * Required. The events that the webhook is subscribed to. Available events:
   *
   * - batch.succeeded
   * - batch.expired
   * - batch.failed
   * - interaction.requires_action
   * - interaction.completed
   * - interaction.failed
   * - video.generated
   */
  subscribed_events: Array<
    | 'batch.succeeded'
    | 'batch.expired'
    | 'batch.failed'
    | 'interaction.requires_action'
    | 'interaction.completed'
    | 'interaction.failed'
    | 'video.generated'
    | (string & {})
  >;

  /**
   * Required. The URI to which webhook events will be sent.
   */
  uri: string;

  /**
   * Output only. The ID of the webhook.
   */
  id?: string;

  /**
   * Output only. The timestamp when the webhook was created.
   */
  create_time?: string;

  /**
   * Optional. The user-provided name of the webhook.
   */
  name?: string;

  /**
   * Output only. The new signing secret for the webhook. Only populated on create.
   */
  new_signing_secret?: string;

  /**
   * Output only. The signing secrets associated with this webhook.
   */
  signing_secrets?: Array<SigningSecret>;

  /**
   * Output only. The state of the webhook.
   */
  state?: 'enabled' | 'disabled' | 'disabled_due_to_failed_deliveries';

  /**
   * Output only. The timestamp when the webhook was last updated.
   */
  update_time?: string;
}

/**
 * Response message for WebhookService.ListWebhooks.
 */
export interface WebhookListResponse {
  /**
   * A token, which can be sent as `page_token` to retrieve the next page. If this
   * field is omitted, there are no subsequent pages.
   */
  next_page_token?: string;

  /**
   * The webhooks.
   */
  webhooks?: Array<Webhook>;
}

/**
 * A generic empty message that you can re-use to avoid defining duplicated empty
 * messages in your APIs. A typical example is to use it as the request or the
 * response type of an API method. For instance:
 *
 *     service Foo {
 *       rpc Bar(google.protobuf.Empty) returns (google.protobuf.Empty);
 *     }
 */
export interface WebhookDeleteResponse {}

/**
 * Response message for WebhookService.PingWebhook.
 */
export interface WebhookPingResponse {}

/**
 * Response message for WebhookService.RotateSigningSecret.
 */
export interface WebhookRotateSigningSecretResponse {
  /**
   * Output only. The newly generated signing secret.
   */
  secret?: string;
}

export interface WebhookCreateParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: Required. The events that the webhook is subscribed to. Available
   * events:
   *
   * - batch.succeeded
   * - batch.expired
   * - batch.failed
   * - interaction.requires_action
   * - interaction.completed
   * - interaction.failed
   * - video.generated
   */
  subscribed_events: Array<
    | 'batch.succeeded'
    | 'batch.expired'
    | 'batch.failed'
    | 'interaction.requires_action'
    | 'interaction.completed'
    | 'interaction.failed'
    | 'video.generated'
    | (string & {})
  >;

  /**
   * Body param: Required. The URI to which webhook events will be sent.
   */
  uri: string;

  /**
   * Body param: Optional. The user-provided name of the webhook.
   */
  name?: string;
}

export interface WebhookUpdateParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Query param: Optional. The list of fields to update.
   */
  update_mask?: string;

  /**
   * Body param: Optional. The user-provided name of the webhook.
   */
  name?: string;

  /**
   * Body param: Optional. The state of the webhook.
   */
  state?: 'enabled' | 'disabled' | 'disabled_due_to_failed_deliveries';

  /**
   * Body param: Optional. The events that the webhook is subscribed to. Available
   * events:
   *
   * - batch.succeeded
   * - batch.expired
   * - batch.failed
   * - interaction.requires_action
   * - interaction.completed
   * - interaction.failed
   * - video.generated
   */
  subscribed_events?: Array<
    | 'batch.succeeded'
    | 'batch.expired'
    | 'batch.failed'
    | 'interaction.requires_action'
    | 'interaction.completed'
    | 'interaction.failed'
    | 'video.generated'
    | (string & {})
  >;

  /**
   * Body param: Optional. The URI to which webhook events will be sent.
   */
  uri?: string;
}

export interface WebhookListParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Query param: Optional. The maximum number of webhooks to return. The service may
   * return fewer than this value. If unspecified, at most 50 webhooks will be
   * returned. The maximum value is 1000.
   */
  page_size?: number;

  /**
   * Query param: Optional. A page token, received from a previous `ListWebhooks`
   * call. Provide this to retrieve the subsequent page.
   */
  page_token?: string;
}

export interface WebhookDeleteParams {
  /**
   * Which version of the API to use.
   */
  api_version?: string;
}

export interface WebhookGetParams {
  /**
   * Which version of the API to use.
   */
  api_version?: string;
}

export interface WebhookPingParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: Request message for WebhookService.PingWebhook.
   */
  body?: WebhookPingParams.Body;
}

export namespace WebhookPingParams {
  /**
   * Request message for WebhookService.PingWebhook.
   */
  export interface Body {}
}

export interface WebhookRotateSigningSecretParams {
  /**
   * Path param: Which version of the API to use.
   */
  api_version?: string;

  /**
   * Body param: Optional. The revocation behavior for previous signing secrets.
   */
  revocation_behavior?: 'revoke_previous_secrets_after_h24' | 'revoke_previous_secrets_immediately';
}

export declare namespace Webhooks {
  export {
    type SigningSecret as SigningSecret,
    type Webhook as Webhook,
    type WebhookListResponse as WebhookListResponse,
    type WebhookDeleteResponse as WebhookDeleteResponse,
    type WebhookPingResponse as WebhookPingResponse,
    type WebhookRotateSigningSecretResponse as WebhookRotateSigningSecretResponse,
    type WebhookCreateParams as WebhookCreateParams,
    type WebhookUpdateParams as WebhookUpdateParams,
    type WebhookListParams as WebhookListParams,
    type WebhookDeleteParams as WebhookDeleteParams,
    type WebhookGetParams as WebhookGetParams,
    type WebhookPingParams as WebhookPingParams,
    type WebhookRotateSigningSecretParams as WebhookRotateSigningSecretParams,
  };
}
