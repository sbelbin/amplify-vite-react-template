import { ChartView } from '../view';

import {
  KindRequestMessage,
  KindResponseMessage,
  LoadSequence,
  RecordingSessionFolder,
  ResponseMessage,
} from '../data_source';

import {
  Segment,
  SignalDefinitions
} from '../../models/eeg_readings';

import { ITimelineController } from '../../timeline_controller';

import * as duration from '../../utilities/duration';

import { AwsCredentialIdentity } from '@aws-sdk/types';

import { TWebAssemblyChart } from 'scichart';

/**
 * The chart controller binds a chart view & chart data source to load the EGG readings &
 * annotations from the recording session.
 *
 * @remarks
 *   To make the U/X experience to the users more enjoyable and fluid the EEG readings &
 *   annotations are fetched asynchronously by a web-worker as not to interrupt the U/X thread.
 *
 *   When the dispose() method of this chart controller is invoked, then it relinquishes the
 *   chart view and the chart data source. Since the chart data source is behind a web-worker the
 *   disposal is done in two phases. The first is issued a request message to dispose it and upon
 *   getting the response message, the underlying web-worker is terminated.
 *
 * @todo
 *   Monitoring of the folder is only essentially needed during a live-feed recording session, or
 *   possibly when a recording session is currently being uploaded. Therefore, might passing a
 *   parameter to the chart data-source to monitor the folder only in those situations. Also, to
 *   adapt the chart data-source behavior such that for recently added segments are prioritized
 *   over those that existed from the previous cycle.
 *
 * @todo
 *   Add functionality to allow the view to make requests to load particular segments of the
 *   recording session where this chart controller posts message requests to its chart data source
 *   web-worker. When the chart data source has loaded a segment it would response by using the
 *   SegmentReady response message which is the mechanism already in place.
 */
export class ChartController {
  public readonly view: ChartView;
  private dataSource: Worker | undefined;
  private readonly disposePromise: Promise<void>;
  private disposeResolver?: () => void;


  constructor(chart: TWebAssemblyChart,
              timelineController: ITimelineController,
              sessionCredentials: AwsCredentialIdentity | undefined,
              folderDetails: RecordingSessionFolder,
              loadSequence: LoadSequence) {
    this.view = new ChartView(chart, timelineController);
    this.dataSource = new Worker(new URL('../../workers/chart_loader.ts', import.meta.url), {type: 'module'});

    this.disposePromise = new Promise<void>((resolve) =>
                                this.disposeResolver = resolve);

    // @todo - Identify a means to report an error back to the users ???
    // this.loader.onerror = (event: ErrorEvent) => {
    // }

    this.dataSource.onmessage = (event: MessageEvent<ResponseMessage>) => {
      const msg = event.data as ResponseMessage;

      switch (msg.kind) {
        case KindResponseMessage.DefinitionsReady:
          this.view.loadDefinitions(msg as SignalDefinitions);
          break;

        case KindResponseMessage.SegmentReady:
          this.view.loadSegment(msg as Segment);
          break;

        case KindResponseMessage.Disposed:
          this.dataSource?.terminate();
          this.dataSource = undefined;

          this.disposeResolver?.();
          this.disposeResolver = undefined;
          break;
      }
    };

    this.dataSource.postMessage({
      kind: KindRequestMessage.Initialize,
      sessionCredentials: sessionCredentials,
      folderDetails: folderDetails,
      loadSequence: loadSequence
    });

    this.dataSource.postMessage({
      kind: KindRequestMessage.Start,
      interval: duration.secondsToDuration(1)
    });
  }

  /**
   * Dispose the chart controller and the instances that it owns.
   *
   * @returns Promise that is resolved once everything is disposed.
   *
   * @remarks
   *   Since the underlying data-source is a web-worker it's necessary to post a request message
   *   to the data-source within the web-worker to cancel any work that it's doing and to dispose
   *   itself. Once disposed, it replies to let this controller aware that it's safe to terminate
   *   the web-worker.
   */
  public async dispose() : Promise<void> {
    if (this.dataSource) {
      this.dataSource?.postMessage({
        kind: KindRequestMessage.Dispose
      });
    }

    return this.disposePromise;
  }
}
