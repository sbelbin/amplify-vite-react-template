import {
  ChartDataSource,
  KindRequestMessage,
  KindResponseMessage,
  RequestMessage
} from '../chart/data_source';

import * as eeg_readings from '../models/eeg_readings'

import * as storage from '../storage';

let chartDataSource: ChartDataSource | undefined;

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const msg = event.data as RequestMessage;

  switch (msg.kind) {
    case KindRequestMessage.Initialize:
      {
        chartDataSource?.dispose();

        const onDefinitionsReady = (definitions: eeg_readings.SignalDefinitions) =>
          self.postMessage(
            Object.assign(definitions, { kind: KindResponseMessage.DefinitionsReady }));

        const onSegmentReady = (segment: eeg_readings.Segment) =>
          self.postMessage(
            Object.assign(segment, { kind: KindResponseMessage.SegmentReady }));

        const onDisposed = () =>
          self.postMessage({ kind: KindResponseMessage.Disposed });

        const folder = storage.parsePath(msg.folder) as storage.AWSS3Path;

        chartDataSource = new ChartDataSource(storage.connectWithCredentials(folder.region, msg.sessionCredentials),
                                              folder,
                                              onDefinitionsReady,
                                              onSegmentReady,
                                              onDisposed,
                                              msg.loadSequence);
      }
      break;

    case KindRequestMessage.Start:
      chartDataSource?.start(msg.interval);
      break;

    case KindRequestMessage.Stop:
      chartDataSource?.stop();
      break;

    case KindRequestMessage.Dispose:
      chartDataSource?.dispose();
      chartDataSource = undefined;
      break;
  }
}

export {};
