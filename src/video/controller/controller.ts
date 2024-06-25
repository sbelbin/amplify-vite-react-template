import { ITimelineController } from '../../timeline_controller';
import {
  HLSVideoFeed,
  VideoFeed
} from '../video_feed';

import { HlsConfig } from 'hls.js';

/**
 * The video-controller bridges the timeline-controller and the video-feed such that the
 * video-controller manages the video-feed that is being presented to users in the
 * recording session view.
 *
 * @todo Implement the timeline-controller source's client.
 *   This video-controller to implement the ITimelineSourceFeed such that the timeline-controller
 *   doesn't directly interface with a HTMLVideoElement which adds complexity to the
 *   timeline-controller to pause/resume a given source.
 *
 * @todo Coordinate which video-feed to load.
 *   A recording session that spans several hours might have many video-feeds.
 *
 *   When it's the case, then the recording session would have a list of videos and it would be
 *   this video-controller role to load the corresponding video based on the current point-in-time
 *   that is being presented to users.
 *
 * @todo Unavailable video-feed.
 *   When there be periods in which a video-feed is unavailable, such as when the patient needs
 *   privacy (without a video) but the EEG readings are still being recorded.
 *
 *   In these situations, the video-controller is responsible to ensure that the video-view is
 *   blank along with an indication for users that no video was recorded at those moments.
 *
 * @todo Live-feed to use AWS IVS player.
 *   The current approach of using a general HLS player has a latency of a few seconds since
 *   it's necessary for AWS IVS service to convert the video and put it S3 bucket. For an
 *   initial release this latency is about 10 seconds which well under our target of a minute.
 *
 *   If there are reasons for the live-feed to closer to being immediate with the patient then
 *   AWS does provides a customized IVS player that apparently can be used. However, it might
 *   not support the capability to navigate the video-feed to earlier points-in-time within
 *   a live-feed recording session, such as seeing the previous hour.
 *
 *   This video-controller could be adapted to use AWS IVS player instead of the HLS player,
 *   or use AWS IVS player for now and use HLS player earlier points-in-time.
 */
export class VideoFeedController {
  private readonly timelineController: ITimelineController;
  public readonly videoView: HTMLVideoElement;
  private videoFeed?: VideoFeed;

  constructor(timelineController: ITimelineController,
              videoView: HTMLVideoElement,
              source: string,
              config?: HlsConfig) {
    this.timelineController = timelineController;
    this.videoView = videoView;
    this.videoFeed = new HLSVideoFeed(this.videoView, source, config);
    this.timelineController.addVideo(this.videoView);
  }

  dispose(): void {
    if (this.videoFeed) {
      this.timelineController.removeVideo(this.videoView);
      this.videoFeed.dispose();
      delete this.videoFeed;
      this.videoFeed = undefined;
    }
  }
}
