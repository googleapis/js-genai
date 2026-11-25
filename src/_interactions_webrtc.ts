/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {APIConnectionError, APIWebRTCError} from './_interactions_errors.js';
import {
  buildInteractionHeaders,
  DEFAULT_TIMEOUT_MS,
  extractUpgradeHttpStatus,
  InteractionBaseConnection,
  type InteractionConnectParams,
  type InteractionConnectRequestOptions,
  type InteractionFetch,
  type InteractionParentClient,
  isRecord,
  LocalUsageError,
  parseConnectOptions,
  setHeader,
  setupServerCode,
  warnLiveInteractionsExperimental,
} from './_interactions_websocket.js';
import type {WebSocket, WebSocketCallbacks} from './_websocket.js';

export {APIWebRTCError};

const DEFAULT_WEBRTC_DATA_CHANNEL_LABEL = 'events';
const DEFAULT_WEBRTC_SCTP_MAX_MESSAGE_SIZE = 65_536;

function isChannelOpen(channel?: RTCDataChannel): channel is RTCDataChannel {
  return (
    !!channel &&
    (channel.readyState === 'open' || channel.readyState === undefined)
  );
}

async function waitForDataChannelFlush(
  channel?: RTCDataChannel,
): Promise<void> {
  if (!isChannelOpen(channel)) return;
  const deadline = Date.now() + 500;
  while (
    Number(channel.bufferedAmount) > 0 &&
    isChannelOpen(channel) &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  if (isChannelOpen(channel)) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// ---------------------------------------------------------------------------
// WebRTC Transport Types
// ---------------------------------------------------------------------------

// Resolve browser/DOM WebRTC types via `globalThis` so consumers compiling
// without `"dom"` in TypeScript's `lib` (e.g. Node-only `"lib": ["ES2022"]`)
// do not fail with TS2304 while browser/DOM consumers still get native types.
type DomInstance<K extends string, Fallback> = K extends keyof typeof globalThis
  ? (typeof globalThis)[K] extends abstract new (...args: never[]) => infer T
    ? T
    : Fallback
  : Fallback;

type DomCtorParam0<
  K extends string,
  Fallback,
> = K extends keyof typeof globalThis
  ? (typeof globalThis)[K] extends abstract new (
      arg0?: infer A,
      ...args: never[]
    ) => unknown
    ? NonNullable<A>
    : Fallback
  : Fallback;

interface WebRTCMediaStreamTrackFallback {
  readonly kind: string;
  enabled: boolean;
  stop?(): void;
}

interface WebRTCMediaStreamFallback {
  getTracks(): WebRTCMediaStreamTrackFallback[];
  getAudioTracks?(): WebRTCMediaStreamTrackFallback[];
  getVideoTracks?(): WebRTCMediaStreamTrackFallback[];
  addTrack?(track: WebRTCMediaStreamTrackFallback): void;
}

interface WebRTCMediaElementFallback {
  srcObject: unknown;
  play?(): unknown;
}

interface WebRTCDataChannelFallback {
  readonly label?: string;
  readonly readyState?: string;
  readonly bufferedAmount?: number;
  binaryType?: string;
  onopen?: ((event?: unknown) => void) | null;
  onmessage?: ((event: {data: unknown}) => void) | null;
  onerror?: ((event: unknown) => void) | null;
  onclose?: ((event?: unknown) => void) | null;
  send(data: string): void;
  close(): void;
}

interface WebRTCConfigurationFallback {
  iceServers?: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
  [key: string]: unknown;
}

interface WebRTCPeerConnectionFallback {
  readonly connectionState?: string;
  readonly iceConnectionState?: string;
  readonly localDescription?: {sdp?: string; type?: string} | null;
  readonly sctp?: {readonly maxMessageSize?: number} | null;
  ontrack?: ((event: unknown) => void) | null;
  onconnectionstatechange?: ((event?: unknown) => void) | null;
  oniceconnectionstatechange?: ((event?: unknown) => void) | null;
  ondatachannel?: ((event: unknown) => void) | null;
  addEventListener(type: string, listener: (...args: unknown[]) => void): void;
  removeEventListener(
    type: string,
    listener: (...args: unknown[]) => void,
  ): void;
  addTrack(track: unknown, ...streams: unknown[]): unknown;
  addTransceiver(trackOrKind: unknown, init?: unknown): unknown;
  close(): void;
  createDataChannel(label: string, init?: unknown): WebRTCDataChannelFallback;
  createOffer(options?: unknown): Promise<{sdp?: string; type?: string}>;
  setLocalDescription(description?: unknown): Promise<void>;
  setRemoteDescription(description: unknown): Promise<void>;
}

type WebRTCMediaStream = DomInstance<'MediaStream', WebRTCMediaStreamFallback>;
type WebRTCVideoElement = DomInstance<
  'HTMLVideoElement',
  WebRTCMediaElementFallback
>;
type WebRTCAudioElement = DomInstance<
  'HTMLAudioElement',
  WebRTCMediaElementFallback
>;
type WebRTCPeerConnection = DomInstance<
  'RTCPeerConnection',
  WebRTCPeerConnectionFallback
>;
type WebRTCDataChannel = DomInstance<
  'RTCDataChannel',
  WebRTCDataChannelFallback
>;
type WebRTCConfiguration = DomCtorParam0<
  'RTCPeerConnection',
  WebRTCConfigurationFallback
>;

/**
 * Options for WebRTC transport.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export interface InteractionWebRTCTransportOptions {
  /**
   * Optional local `MediaStream` (e.g. from `navigator.mediaDevices.getUserMedia`)
   * whose audio/video tracks should be added to the `RTCPeerConnection` before
   * creating the SDP offer.
   */
  mediaStream?: WebRTCMediaStream | null;
  /**
   * Optional `<video>` element to automatically attach incoming remote video
   * (and audio, when `audioElement` is omitted) tracks to.
   */
  videoElement?: WebRTCVideoElement | null;
  /**
   * Optional `<audio>` element to automatically attach incoming remote audio
   * tracks to.
   */
  audioElement?: WebRTCAudioElement | null;
  /**
   * Callback invoked when the underlying `RTCPeerConnection` is created,
   * before `createOffer()` is called.
   */
  onPeerConnection?: (peerConnection: WebRTCPeerConnection) => void;
  /**
   * Custom `RTCPeerConnection` configuration (e.g. `iceServers`).
   */
  rtcConfiguration?: WebRTCConfiguration;
  /**
   * Custom `RTCPeerConnection` factory for testing.
   */
  peerConnectionFactory?: (
    configuration?: WebRTCConfiguration,
  ) =>
    | Pick<
        WebRTCPeerConnection,
        | 'addEventListener'
        | 'addTrack'
        | 'addTransceiver'
        | 'close'
        | 'connectionState'
        | 'createDataChannel'
        | 'createOffer'
        | 'iceConnectionState'
        | 'localDescription'
        | 'removeEventListener'
        | 'sctp'
        | 'setLocalDescription'
        | 'setRemoteDescription'
      >
    | WebRTCPeerConnectionFallback;
}

/**
 * An interaction connection over WebRTC.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export class InteractionWebRTCConnection<
  TClientEvent = Record<string, unknown>,
  TServerEvent = Record<string, unknown>,
> extends InteractionBaseConnection<TClientEvent, TServerEvent> {
  /** @internal */
  constructor(
    id: string,
    /** Active WebRTC transport for this connection. */
    readonly transport: InteractionWebRTCTransport,
  ) {
    super(id);
  }

  protected override newConnectionError(options: {
    message: string;
    closeCode?: number | undefined;
    httpStatus?: number | undefined;
    serverCode?: string | undefined;
  }): APIConnectionError {
    return new APIWebRTCError(options);
  }
}

// ---------------------------------------------------------------------------
// WebRTC Transport (`:webrtc` HTTP SDP exchange + `"events"` RTCDataChannel)
// ---------------------------------------------------------------------------

function buildWebRTCSignalingURL(
  parentClient: InteractionParentClient,
  interactionId: string,
  apiVersion?: string,
): string {
  if (parentClient.isVertexAI()) {
    throw new LocalUsageError(
      'Live Interactions WebRTC support is currently Gemini API only.',
    );
  }
  const baseUrl = parentClient.getBaseUrl();
  if (!baseUrl) {
    throw new LocalUsageError('Base URL must be set.');
  }
  const url = new URL(baseUrl);
  const version = (apiVersion ?? parentClient.getApiVersion()).replace(
    /^\/+|\/+$/g,
    '',
  );
  const basePath = url.pathname.replace(/\/+$/g, '');
  url.pathname =
    `${basePath}/${version}/interactions/${encodeURIComponent(interactionId)}:webrtc`.replace(
      /\/{2,}/g,
      '/',
    );
  url.hash = '';
  return url.toString();
}

async function buildWebRTCSignalingHeaders(
  parentClient: InteractionParentClient,
  url: string,
  extraHeaders?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers = await buildInteractionHeaders(
    parentClient,
    url,
    extraHeaders,
  );
  setHeader(headers, 'content-type', 'application/json');
  // No `api-revision` header here: the API's CORS preflight rejects it, so a
  // browser would block the signaling request.
  return headers;
}

function resolveDefaultPeerConnectionFactory():
  | ((configuration?: RTCConfiguration) => RTCPeerConnection)
  | undefined {
  const g = globalThis as unknown as {
    RTCPeerConnection?: new (
      configuration?: RTCConfiguration,
    ) => RTCPeerConnection;
  };
  if (typeof g.RTCPeerConnection === 'function') {
    const Ctor = g.RTCPeerConnection;
    return (configuration?: RTCConfiguration) => new Ctor(configuration);
  }
  return undefined;
}

/**
 * Experimental WebRTC transport for Live Interactions.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * Negotiates a WebRTC session via `POST /{api_version}/interactions/{id}:webrtc`
 * with `{ offer_sdp }` and exchanges JSON `ClientEvent` /
 * `ServerEvent` frames over the `"events"` `RTCDataChannel` while
 * streaming audio and video over native `RTCPeerConnection` media tracks.
 *
 * @experimental
 */
export class InteractionWebRTCTransport {
  private _peerConnection?: RTCPeerConnection;
  private _dataChannel?: RTCDataChannel;

  /** Active `RTCPeerConnection` for the current session, if connected. */
  get peerConnection(): WebRTCPeerConnection | undefined {
    return this._peerConnection as WebRTCPeerConnection | undefined;
  }

  /** Active `"events"` `RTCDataChannel` for the current session, if open. */
  get dataChannel(): WebRTCDataChannel | undefined {
    return this._dataChannel as WebRTCDataChannel | undefined;
  }

  private _mediaStream: MediaStream | null;
  private _videoElement: HTMLVideoElement | null;
  private _audioElement: HTMLAudioElement | null;
  private _remoteMediaStream?: MediaStream;
  private _remoteAudioStream?: MediaStream;
  private _remoteVideoStream?: MediaStream;
  private _remoteTracks: MediaStreamTrack[] = [];
  private _audioEnabled = true;
  private _videoEnabled = true;
  private _audioMuteExplicitlySet = false;
  private _videoMuteExplicitlySet = false;
  private onPeerConnectionCallback?: (
    peerConnection: RTCPeerConnection,
  ) => void;
  private readonly rtcConfiguration?: RTCConfiguration;
  private readonly peerConnectionFactory?: InteractionWebRTCTransportOptions['peerConnectionFactory'];
  private audioSenders: RTCRtpSender[] = [];
  private videoSenders: RTCRtpSender[] = [];
  private connectGeneration = 0;
  private activeAttemptCleanup?: (
    closeCode?: number,
    notifyClose?: boolean,
  ) => void;

  /** Creates a new `InteractionWebRTCTransport` instance. */
  constructor(options: InteractionWebRTCTransportOptions = {}) {
    warnLiveInteractionsExperimental();
    this._mediaStream =
      (options.mediaStream as MediaStream | null | undefined) ?? null;
    this._videoElement =
      (options.videoElement as HTMLVideoElement | null | undefined) ?? null;
    this._audioElement =
      (options.audioElement as HTMLAudioElement | null | undefined) ?? null;
    this._audioEnabled = this.computeInitialEnabled('audio');
    this._videoEnabled = this.computeInitialEnabled('video');
    this.onPeerConnectionCallback = options.onPeerConnection as
      | ((peerConnection: RTCPeerConnection) => void)
      | undefined;
    this.rtcConfiguration = options.rtcConfiguration as
      | RTCConfiguration
      | undefined;
    this.peerConnectionFactory = options.peerConnectionFactory;
  }

  private computeInitialEnabled(kind: 'audio' | 'video'): boolean {
    if (!this._mediaStream) return false;
    const tracks =
      kind === 'audio' && typeof this._mediaStream.getAudioTracks === 'function'
        ? this._mediaStream.getAudioTracks()
        : kind === 'video' &&
            typeof this._mediaStream.getVideoTracks === 'function'
          ? this._mediaStream.getVideoTracks()
          : this._mediaStream.getTracks().filter((t) => t.kind === kind);
    return tracks.length > 0 && tracks.some((t) => t.enabled !== false);
  }

  /** Local `MediaStream` attached to this transport, or `null` if none. */
  get localMediaStream(): WebRTCMediaStream | null {
    return this._mediaStream as WebRTCMediaStream | null;
  }

  /** Combined remote `MediaStream` received from the server, if any tracks have arrived. */
  get remoteMediaStream(): WebRTCMediaStream | undefined {
    return this._remoteMediaStream as WebRTCMediaStream | undefined;
  }

  /** Returns whether local audio tracks are currently enabled. */
  isAudioEnabled(): boolean {
    return this._audioEnabled;
  }

  /** Returns whether local video tracks are currently enabled. */
  isVideoEnabled(): boolean {
    return this._videoEnabled;
  }

  /**
   * Attaches a `<video>` element to receive incoming remote video tracks
   * (and audio tracks when no separate `audioElement` is configured).
   */
  setVideoElement(element: WebRTCVideoElement | null): void {
    const next = element as HTMLVideoElement | null;
    if (this._videoElement && this._videoElement !== next) {
      this._videoElement.srcObject = null;
    }
    this._videoElement = next;
    this.syncMediaElements();
  }

  /** Returns the attached `<video>` element, or `null` if none is attached. */
  getVideoElement(): WebRTCVideoElement | null {
    return this._videoElement as WebRTCVideoElement | null;
  }

  /**
   * Attaches an `<audio>` element to receive incoming remote audio tracks.
   */
  setAudioElement(element: WebRTCAudioElement | null): void {
    const next = element as HTMLAudioElement | null;
    if (this._audioElement && this._audioElement !== next) {
      this._audioElement.srcObject = null;
    }
    this._audioElement = next;
    this.syncMediaElements();
  }

  /** Returns the attached `<audio>` element, or `null` if none is attached. */
  getAudioElement(): WebRTCAudioElement | null {
    return this._audioElement as WebRTCAudioElement | null;
  }

  private createStreamFromTracks(tracks: MediaStreamTrack[]): MediaStream {
    const g = globalThis as unknown as {
      MediaStream?: new (tracks?: MediaStreamTrack[]) => MediaStream;
    };
    if (typeof g.MediaStream === 'function') {
      return new g.MediaStream(tracks);
    }
    const copy = [...tracks];
    return {
      getTracks: () => [...copy],
      getAudioTracks: () => copy.filter((t) => t.kind === 'audio'),
      getVideoTracks: () => copy.filter((t) => t.kind === 'video'),
      addTrack: (track: MediaStreamTrack) => {
        if (!copy.includes(track)) copy.push(track);
      },
    } as unknown as MediaStream;
  }

  private ensureStreamWithTracks(
    existing: MediaStream | undefined,
    tracks: MediaStreamTrack[],
  ): MediaStream {
    if (existing && typeof existing.addTrack === 'function') {
      const currentTracks = existing.getTracks();
      for (const track of tracks) {
        if (!currentTracks.includes(track)) {
          existing.addTrack(track);
        }
      }
      return existing;
    }
    return this.createStreamFromTracks(tracks);
  }

  private playMediaElement(element: HTMLVideoElement | HTMLAudioElement): void {
    try {
      const playResult = element.play?.();
      if (
        playResult !== undefined &&
        playResult !== null &&
        typeof (playResult as Promise<void>).catch === 'function'
      ) {
        void (playResult as Promise<void>).catch(() => {
          // Ignore asynchronous autoplay rejection.
        });
      }
    } catch {
      // Ignore synchronous autoplay rejection.
    }
  }

  private syncMediaElements(): void {
    if (this._remoteTracks.length === 0) {
      if (
        this._videoElement &&
        this._remoteMediaStream &&
        !this._audioElement
      ) {
        if (this._videoElement.srcObject !== this._remoteMediaStream) {
          this._videoElement.srcObject = this._remoteMediaStream;
          this.playMediaElement(this._videoElement);
        }
      }
      return;
    }
    if (this._audioElement) {
      const audioTracks = this._remoteTracks.filter((t) => t.kind === 'audio');
      if (audioTracks.length > 0) {
        this._remoteAudioStream = this.ensureStreamWithTracks(
          this._remoteAudioStream,
          audioTracks,
        );
        if (this._audioElement.srcObject !== this._remoteAudioStream) {
          this._audioElement.srcObject = this._remoteAudioStream;
          this.playMediaElement(this._audioElement);
        }
      }
      if (this._videoElement) {
        const videoTracks = this._remoteTracks.filter(
          (t) => t.kind === 'video',
        );
        if (videoTracks.length > 0) {
          this._remoteVideoStream = this.ensureStreamWithTracks(
            this._remoteVideoStream,
            videoTracks,
          );
          if (this._videoElement.srcObject !== this._remoteVideoStream) {
            this._videoElement.srcObject = this._remoteVideoStream;
            this.playMediaElement(this._videoElement);
          }
        } else if (
          this._videoElement.srcObject !== null &&
          this._videoElement.srcObject !== undefined
        ) {
          this._videoElement.srcObject = null;
        }
      }
    } else if (this._videoElement && this._remoteMediaStream) {
      if (this._videoElement.srcObject !== this._remoteMediaStream) {
        this._videoElement.srcObject = this._remoteMediaStream;
        this.playMediaElement(this._videoElement);
      }
    }
  }

  /**
   * Enables or disables all local audio tracks without renegotiating WebRTC.
   */
  setAudioEnabled(enabled: boolean): boolean {
    this._audioMuteExplicitlySet = true;
    this._audioEnabled = Boolean(enabled);
    if (this._mediaStream) {
      const tracks =
        typeof this._mediaStream.getAudioTracks === 'function'
          ? this._mediaStream.getAudioTracks()
          : this._mediaStream.getTracks().filter((t) => t.kind === 'audio');
      for (const track of tracks) {
        track.enabled = this._audioEnabled;
      }
    }
    for (const sender of this.audioSenders) {
      if (sender.track) {
        sender.track.enabled = this._audioEnabled;
      }
    }
    return this._audioEnabled;
  }

  /**
   * Enables or disables all local video tracks without renegotiating WebRTC.
   */
  setVideoEnabled(enabled: boolean): boolean {
    this._videoMuteExplicitlySet = true;
    this._videoEnabled = Boolean(enabled);
    if (this._mediaStream) {
      const tracks =
        typeof this._mediaStream.getVideoTracks === 'function'
          ? this._mediaStream.getVideoTracks()
          : this._mediaStream.getTracks().filter((t) => t.kind === 'video');
      for (const track of tracks) {
        track.enabled = this._videoEnabled;
      }
    }
    for (const sender of this.videoSenders) {
      if (sender.track) {
        sender.track.enabled = this._videoEnabled;
      }
    }
    return this._videoEnabled;
  }

  private validateAndSendOnChannel(
    channel: RTCDataChannel | undefined,
    pc: Pick<RTCPeerConnection, 'sctp'> | undefined,
    message: string,
  ): void {
    if (!channel) {
      throw new LocalUsageError('WebRTC data channel is not connected.');
    }
    if (!isChannelOpen(channel)) {
      throw new LocalUsageError('WebRTC data channel is not open.');
    }
    const maxMessageSize =
      typeof pc?.sctp?.maxMessageSize === 'number' && pc.sctp.maxMessageSize > 0
        ? pc.sctp.maxMessageSize
        : DEFAULT_WEBRTC_SCTP_MAX_MESSAGE_SIZE;
    const byteLength = new TextEncoder().encode(message).byteLength;
    if (byteLength > maxMessageSize) {
      throw new RangeError(
        `WebRTC data channel message (${byteLength} bytes) exceeds SCTP maxMessageSize (${maxMessageSize} bytes).`,
      );
    }
    channel.send(message);
  }

  /** @internal */
  async connect(
    parentClient: InteractionParentClient,
    interactionId: string,
    callbacks: WebSocketCallbacks,
    options: {
      apiVersion?: string | undefined;
      extraHeaders?: Record<string, string> | undefined;
      timeoutMs?: number | undefined;
    } = {},
  ): Promise<WebSocket & {flush?(): Promise<void>}> {
    if (!interactionId) {
      throw new LocalUsageError(
        'A non-empty interaction ID is required to connect.',
      );
    }
    const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeout) || timeout <= 0) {
      throw new RangeError('timeout_ms must be positive and finite.');
    }

    const pcFactory =
      this.peerConnectionFactory ?? resolveDefaultPeerConnectionFactory();
    if (!pcFactory) {
      throw new LocalUsageError(
        'Live Interactions WebRTC support requires a platform RTCPeerConnection or peerConnectionFactory.',
      );
    }

    const fetchFn: InteractionFetch | undefined =
      parentClient.getFetch?.() ??
      (typeof globalThis.fetch === 'function'
        ? (input, init) =>
            init == null
              ? globalThis.fetch(input)
              : globalThis.fetch(input, init)
        : undefined);
    if (!fetchFn) {
      throw new LocalUsageError(
        'Live Interactions WebRTC support requires a platform fetch implementation.',
      );
    }

    // Tear down any previous connection on this transport before starting a new attempt.
    this.close();

    const generation = ++this.connectGeneration;
    const signalingUrl = buildWebRTCSignalingURL(
      parentClient,
      interactionId,
      options.apiVersion,
    );

    const pc = pcFactory(this.rtcConfiguration) as unknown as RTCPeerConnection;
    this._peerConnection = pc;
    this.audioSenders = [];
    this.videoSenders = [];

    const channels = new Set<RTCDataChannel>();
    let abortController: AbortController | undefined;
    let localClosing = false;
    let closeNotified = false;
    let channelOpened = false;
    let channelSettled = false;
    let resolveChannelOpen!: () => void;
    let rejectChannelOpen!: (error: APIConnectionError) => void;
    const channelOpenPromise = new Promise<void>((resolve, reject) => {
      resolveChannelOpen = resolve;
      rejectChannelOpen = reject;
    });
    void channelOpenPromise.catch(() => {});

    const getOpenChannel = (): RTCDataChannel | undefined => {
      const current = this._dataChannel;
      if (current && channels.has(current) && isChannelOpen(current)) {
        return current;
      }
      for (const candidate of channels) {
        if (isChannelOpen(candidate)) {
          return candidate;
        }
      }
      return undefined;
    };

    let detachPeerListeners: (() => void) | undefined;

    const cleanupAttempt = (
      closeCode = 1000,
      notifyClose = true,
      rejectMessage = 'The WebRTC connection attempt was superseded or closed.',
    ) => {
      if (localClosing) return;
      localClosing = true;
      abortController?.abort();
      detachPeerListeners?.();
      detachPeerListeners = undefined;
      if (this.activeAttemptCleanup === cleanupAttempt) {
        this.activeAttemptCleanup = undefined;
      }
      for (const ch of [...channels]) {
        try {
          ch.close();
        } catch {
          // Ignore data channel close errors.
        }
      }
      channels.clear();
      if (this.connectGeneration === generation) {
        this.resetTransportState();
      } else {
        try {
          pc.close();
        } catch {
          // Ignore peer connection close errors.
        }
      }
      if (!channelSettled) {
        channelSettled = true;
        rejectChannelOpen(
          new APIWebRTCError({message: rejectMessage, closeCode}),
        );
      }
      if (notifyClose && !closeNotified) {
        closeNotified = true;
        callbacks.onclose({code: closeCode});
      }
    };
    this.activeAttemptCleanup = cleanupAttempt;

    const attachDataChannel = (channel: RTCDataChannel) => {
      if (channels.has(channel)) return;
      channels.add(channel);
      channel.binaryType = 'arraybuffer';
      if (!this._dataChannel || this._dataChannel.readyState !== 'open') {
        this._dataChannel = channel;
      }

      const handleOpen = () => {
        if (localClosing || this.connectGeneration !== generation) return;
        this._dataChannel = channel;
        if (!channelSettled) {
          channelOpened = true;
          channelSettled = true;
          callbacks.onopen();
          resolveChannelOpen();
        }
      };

      channel.onopen = handleOpen;

      channel.onmessage = (event: {data: unknown}) => {
        if (localClosing || this.connectGeneration !== generation) return;
        callbacks.onmessage(event);
      };

      channel.onerror = (event: unknown) => {
        if (localClosing || this.connectGeneration !== generation) return;
        if (!channelOpened && !channelSettled) {
          channelSettled = true;
          rejectChannelOpen(
            new APIWebRTCError({
              message: 'WebRTC events data channel failed to open.',
              closeCode: 1006,
            }),
          );
        } else {
          callbacks.onerror(event);
        }
      };

      channel.onclose = () => {
        channels.delete(channel);
        if (localClosing || this.connectGeneration !== generation) return;
        const fallbackOpen = getOpenChannel();
        if (fallbackOpen) {
          this._dataChannel = fallbackOpen;
          return;
        }
        cleanupAttempt(
          1006,
          true,
          'WebRTC events data channel closed before opening.',
        );
      };

      if (channel.readyState === 'open') {
        handleOpen();
      }
    };

    try {
      let headers: Record<string, string>;
      try {
        headers = await buildWebRTCSignalingHeaders(
          parentClient,
          signalingUrl,
          options.extraHeaders,
        );
      } catch (error) {
        throw new APIWebRTCError({
          message: 'Live authentication setup failed.',
          httpStatus: extractUpgradeHttpStatus(error),
        });
      }

      if (localClosing || this.connectGeneration !== generation) {
        throw new APIWebRTCError({
          message: 'The WebRTC connection attempt was superseded or closed.',
          closeCode: 1006,
        });
      }
      try {
        this.onPeerConnectionCallback?.(pc);
      } catch {
        // Ignore errors thrown by user inspection callback.
      }

      const handleTrack = (event: RTCTrackEvent): void => {
        if (this.connectGeneration !== generation) return;
        if (event.track && !this._remoteTracks.includes(event.track)) {
          this._remoteTracks.push(event.track);
        } else if (event.streams?.[0]) {
          for (const t of event.streams[0].getTracks()) {
            if (!this._remoteTracks.includes(t)) {
              this._remoteTracks.push(t);
            }
          }
        }
        if (this._remoteTracks.length > 0) {
          this._remoteMediaStream = this.ensureStreamWithTracks(
            this._remoteMediaStream,
            this._remoteTracks,
          );
          this.syncMediaElements();
        } else if (event.streams?.[0]) {
          this._remoteMediaStream = event.streams[0];
          this.syncMediaElements();
        }
      };

      const handleIncomingDataChannel = (event: RTCDataChannelEvent): void => {
        if (this.connectGeneration !== generation) return;
        const incoming = event?.channel;
        if (!incoming) return;
        if (
          incoming.label !== undefined &&
          incoming.label !== '' &&
          incoming.label !== DEFAULT_WEBRTC_DATA_CHANNEL_LABEL
        ) {
          return;
        }
        attachDataChannel(incoming);
      };

      const handlePeerConnectionState = (): void => {
        if (localClosing || this.connectGeneration !== generation) return;
        const rawState =
          pc.connectionState === 'failed' || pc.iceConnectionState === 'failed'
            ? 'failed'
            : pc.connectionState === 'closed' ||
                pc.iceConnectionState === 'closed'
              ? 'closed'
              : undefined;
        if (!rawState) return;
        const notifyError = rawState === 'failed' && channelOpened;
        cleanupAttempt(
          1006,
          !notifyError,
          `WebRTC peer connection ${rawState} during setup.`,
        );
        if (notifyError && !closeNotified) {
          closeNotified = true;
          callbacks.onerror(new Error('WebRTC peer connection failed.'));
          callbacks.onclose({code: 1006});
        }
      };

      pc.addEventListener('track', handleTrack);
      pc.addEventListener('connectionstatechange', handlePeerConnectionState);
      pc.addEventListener(
        'iceconnectionstatechange',
        handlePeerConnectionState,
      );
      pc.addEventListener('datachannel', handleIncomingDataChannel);
      detachPeerListeners = () => {
        pc.removeEventListener('track', handleTrack);
        pc.removeEventListener(
          'connectionstatechange',
          handlePeerConnectionState,
        );
        pc.removeEventListener(
          'iceconnectionstatechange',
          handlePeerConnectionState,
        );
        pc.removeEventListener('datachannel', handleIncomingDataChannel);
      };

      let hasLocalAudio = false;
      let hasLocalVideo = false;
      if (this._mediaStream) {
        const tracks = this._mediaStream.getTracks();
        for (const track of tracks) {
          if (track.kind === 'audio') {
            hasLocalAudio = true;
            if (this._audioMuteExplicitlySet) {
              track.enabled = this._audioEnabled;
            }
          } else if (track.kind === 'video') {
            hasLocalVideo = true;
            if (this._videoMuteExplicitlySet) {
              track.enabled = this._videoEnabled;
            }
          }
          const sender = pc.addTrack(track, this._mediaStream) as
            | RTCRtpSender
            | undefined;
          if (sender && typeof sender === 'object') {
            if (track.kind === 'audio') {
              this.audioSenders.push(sender);
            } else if (track.kind === 'video') {
              this.videoSenders.push(sender);
            }
          }
        }
      }

      if (typeof pc.addTransceiver === 'function') {
        if (!hasLocalAudio) {
          const audioTransceiver = pc.addTransceiver('audio', {
            direction: 'recvonly',
          }) as RTCRtpTransceiver | undefined;
          if (audioTransceiver?.sender) {
            this.audioSenders.push(audioTransceiver.sender);
          }
        }
        if (!hasLocalVideo) {
          const videoTransceiver = pc.addTransceiver('video', {
            direction: 'recvonly',
          }) as RTCRtpTransceiver | undefined;
          if (videoTransceiver?.sender) {
            this.videoSenders.push(videoTransceiver.sender);
          }
        }
      }

      // Create the "events" data channel before creating the SDP offer so the
      // SCTP m-line is included in the offer SDP.
      const dc = pc.createDataChannel(DEFAULT_WEBRTC_DATA_CHANNEL_LABEL);
      attachDataChannel(dc);

      const deadline = Date.now() + timeout;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const offerSdp = pc.localDescription?.sdp ?? offer.sdp;
      if (!offerSdp) {
        throw new APIWebRTCError({
          message: 'RTCPeerConnection failed to produce an SDP offer.',
        });
      }

      if (localClosing || this.connectGeneration !== generation) {
        throw new APIWebRTCError({
          message: 'The WebRTC connection attempt was superseded or closed.',
          closeCode: 1006,
        });
      }

      const remainingForHttp = Math.max(1, deadline - Date.now());
      abortController =
        typeof AbortController === 'function'
          ? new AbortController()
          : undefined;
      const httpTimer = setTimeout(() => {
        abortController?.abort();
      }, remainingForHttp);

      let response: Response;
      try {
        response = await fetchFn(signalingUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({offer_sdp: offerSdp}),
          signal: abortController?.signal,
        });
      } catch {
        throw new APIWebRTCError({
          message: 'WebRTC SDP signaling request failed.',
        });
      } finally {
        clearTimeout(httpTimer);
      }

      if (localClosing || this.connectGeneration !== generation) {
        throw new APIWebRTCError({
          message: 'The WebRTC connection attempt was superseded or closed.',
          closeCode: 1006,
        });
      }

      if (!response.ok) {
        let serverCode: string | undefined;
        let serverMessage: string | undefined;
        try {
          const errPayload = (await response.json()) as unknown;
          if (isRecord(errPayload) && isRecord(errPayload['error'])) {
            serverCode = setupServerCode(errPayload['error']['code']);
            if (typeof errPayload['error']['message'] === 'string') {
              serverMessage = errPayload['error']['message'].trim();
            }
          }
        } catch {
          // Ignore non-JSON error body.
        }
        throw new APIWebRTCError({
          message: serverMessage
            ? `WebRTC SDP signaling failed with HTTP status ${response.status}: ${serverMessage}`
            : `WebRTC SDP signaling failed with HTTP status ${response.status}.`,
          httpStatus: response.status,
          serverCode,
        });
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new APIWebRTCError({
          message: 'WebRTC SDP signaling response must be valid JSON.',
        });
      }

      const answerSdp =
        isRecord(payload) && typeof payload['answer_sdp'] === 'string'
          ? payload['answer_sdp']
          : undefined;
      if (!answerSdp) {
        throw new APIWebRTCError({
          message: 'WebRTC SDP signaling response is missing answer_sdp.',
        });
      }

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      if (localClosing || this.connectGeneration !== generation) {
        throw new APIWebRTCError({
          message: 'The WebRTC connection attempt was superseded or closed.',
          closeCode: 1006,
        });
      }

      if (!channelOpened) {
        const remainingForChannel = Math.max(1, deadline - Date.now());
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            if (!channelSettled) {
              channelSettled = true;
              reject(
                new APIWebRTCError({
                  message:
                    'Timed out waiting for WebRTC events data channel to open.',
                  closeCode: 1006,
                }),
              );
            }
          }, remainingForChannel);
          channelOpenPromise.then(
            () => {
              clearTimeout(timer);
              resolve();
            },
            (err) => {
              clearTimeout(timer);
              reject(err);
            },
          );
        });
      }

      return {
        connect() {},
        send: (message: string) => {
          if (this.connectGeneration !== generation) {
            throw new Error('WebRTC data channel is not connected.');
          }
          const activeChannel = getOpenChannel() ?? this._dataChannel;
          this.validateAndSendOnChannel(activeChannel, pc, message);
        },
        flush: () =>
          waitForDataChannelFlush(getOpenChannel() ?? this._dataChannel),
        close: () => {
          cleanupAttempt(1000, true);
        },
      };
    } catch (error) {
      cleanupAttempt(1006, false);
      if (error instanceof APIConnectionError) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : 'WebRTC live setup failed.',
      );
    }
  }

  private resetTransportState(): void {
    const pc = this._peerConnection;
    this._dataChannel = undefined;
    this._peerConnection = undefined;
    this._remoteMediaStream = undefined;
    this._remoteAudioStream = undefined;
    this._remoteVideoStream = undefined;
    this._remoteTracks = [];
    this.audioSenders = [];
    this.videoSenders = [];
    if (this._videoElement) this._videoElement.srcObject = null;
    if (this._audioElement) this._audioElement.srcObject = null;
    try {
      pc?.close();
    } catch {
      // Ignore peer connection teardown errors.
    }
  }

  /** @internal */
  close(): void {
    if (this.activeAttemptCleanup) {
      const cleanup = this.activeAttemptCleanup;
      this.activeAttemptCleanup = undefined;
      cleanup(1000, true);
    } else {
      this.resetTransportState();
    }
    this.connectGeneration++;
  }
}

async function openWebRTCLiveInteraction<TClientEvent, TServerEvent>(
  parentClient: InteractionParentClient,
  id: string,
  webrtcTransport: InteractionWebRTCTransport,
  options: {
    apiVersion?: string | undefined;
    extraHeaders?: Record<string, string> | undefined;
    timeoutMs: number;
  },
): Promise<InteractionWebRTCConnection<TClientEvent, TServerEvent>> {
  const connection = new InteractionWebRTCConnection<
    TClientEvent,
    TServerEvent
  >(id, webrtcTransport);

  try {
    const attemptSocket = await webrtcTransport.connect(
      parentClient,
      id,
      {
        onopen: () => {},
        onerror: () => connection.handleTransportError(),
        onmessage: (event) => connection.handleMessage(event?.data),
        onclose: (event) => connection.handleClose(event?.code ?? 1000),
      },
      {
        apiVersion: options.apiVersion,
        extraHeaders: options.extraHeaders,
        timeoutMs: options.timeoutMs,
      },
    );
    connection.attach(attemptSocket);
    return connection;
  } catch (error) {
    connection.detach();
    if (
      error instanceof APIConnectionError ||
      error instanceof LocalUsageError
    ) {
      throw error;
    }
    throw new APIWebRTCError({
      message: 'Failed to complete WebRTC live setup.',
    });
  }
}

/**
 * Connects a live interaction over WebRTC.
 *
 * Experimental: Live Interactions SDK support is experimental and may change
 * in future versions.
 *
 * @experimental
 */
export async function connectWebRTCInteraction<
  TClientEvent = Record<string, unknown>,
  TServerEvent = Record<string, unknown>,
>(
  parentClient: InteractionParentClient,
  id: string,
  params: InteractionConnectParams = {},
  options?: InteractionConnectRequestOptions,
): Promise<InteractionWebRTCConnection<TClientEvent, TServerEvent>> {
  warnLiveInteractionsExperimental();
  const {timeout, extraHeaders} = parseConnectOptions(
    parentClient,
    id,
    options,
  );
  const webrtcTransport =
    params.transport instanceof InteractionWebRTCTransport
      ? params.transport
      : new InteractionWebRTCTransport();
  return openWebRTCLiveInteraction<TClientEvent, TServerEvent>(
    parentClient,
    id,
    webrtcTransport,
    {
      apiVersion: params.api_version,
      extraHeaders,
      timeoutMs: timeout,
    },
  );
}
