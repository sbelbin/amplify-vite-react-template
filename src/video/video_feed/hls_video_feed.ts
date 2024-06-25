import { VideoFeed } from './video_feed';

import Hls, { HlsConfig } from 'hls.js';

export class HLSVideoFeed implements VideoFeed {
  readonly videoView: HTMLVideoElement;
  private readonly source: string;
  private readonly config?: HlsConfig;
  private hls?: Hls;

  constructor(videoView: HTMLVideoElement,
              source: string,
              config?: HlsConfig) {
    if (!Hls.isSupported()) throw new Error("HLS isn't supported.");

    this.videoView = videoView;
    this.source = source;
    this.config = config ?? Hls.DefaultConfig;
    this.config.enableWorker = true;
    this.config.maxBufferSize = 60;
    this.config.backBufferLength = 60;

    this.initializeHLS();
  }

  dispose(): void {
    if (this.hls) {
      this.hls.destroy();
      delete this.hls;
      this.hls = undefined;
    }
  }

  private initializeHLS(): void {
    const videoView = this.videoView;
    const source = this.source;
    const config = this.config;
    const resumePlay = false;

    this.dispose();

    const hls = new Hls(config);

    hls.attachMedia(videoView);

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      hls.loadSource(source);

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
          if (hls.media && resumePlay) {
            hls.media.play().catch(()  =>
              console.error('Unable to play prior to user interaction with the DOM.')
            );
          }
      });
    });

    const reinitializeMedia = () => this.initializeHLS();

    hls.on(Hls.Events.ERROR, function (_event, data) {
      if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
            default:
                reinitializeMedia();
                break;
          }
      }
    });

    this.hls = hls;
  }
}
