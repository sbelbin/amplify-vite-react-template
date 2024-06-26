import { IFeed } from './ifeed';

import Hls, { HlsConfig } from 'hls.js';

/**
 * Implementation of an HLS video-feed.
 */
export class HLSFeed implements IFeed {
  private readonly videoView: HTMLVideoElement;
  private readonly playbackURL: URL;
  private readonly config?: HlsConfig;
  private hls?: Hls;

  constructor(videoView: HTMLVideoElement,
              playbackURL: URL,
              config?: HlsConfig) {
    if (!Hls.isSupported()) throw new Error("HLS isn't supported.");

    this.videoView = videoView;
    this.playbackURL = playbackURL;
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
    const source = this.playbackURL.toString();
    const config = this.config;
    const resumePlay = false;

    this.dispose();

    const reinitializeMedia = () => this.initializeHLS();

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
