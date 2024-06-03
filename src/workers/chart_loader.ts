import * as chart_loader from '../charting/chart_loader';

import * as storage from '../storage';

let chartLoader: chart_loader.ChartLoader | undefined;

self.onmessage = (event: MessageEvent<chart_loader.EventMessage>) => {
  const msg = event.data as chart_loader.EventMessage;

  switch (msg.kind) {
    case chart_loader.KindEventMessage.Initialize:
      {
        chartLoader?.dispose();

        const onDataPayloadReady = (response: chart_loader.DataPayloadReady) => {
          self.postMessage({
            kind: chart_loader.KindResponseMessage.DataPayloadReady,
            filePath: response.filePath,
            dataPayload: response.dataPayload
          });
        };

        chartLoader = new chart_loader.ChartLoader(storage.connectWithCredentials(msg.storageRegion, msg.storageCredentials),
                                                   msg.bucket,
                                                   msg.folder,
                                                   onDataPayloadReady,
                                                   new Set(msg.filesLoaded),
                                                   msg.loadSequence);
      }
      break;

    case chart_loader.KindEventMessage.Start:
      chartLoader?.start(msg.interval);
      break;

    case chart_loader.KindEventMessage.Stop:
      chartLoader?.stop();
      break;

    case chart_loader.KindEventMessage.Terminate:
      chartLoader?.dispose();
      chartLoader = undefined;
      break;
  }
}

export {};
