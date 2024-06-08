import * as chart_loader from '../charting/chart_loader';

import * as storage from '../storage';

let chartLoader: chart_loader.ChartLoader | undefined;

self.onmessage = (event: MessageEvent<chart_loader.RequestMessage>) => {
  const msg = event.data as chart_loader.RequestMessage;

  switch (msg.kind) {
    case chart_loader.KindRequestMessage.Initialize:
      {
        chartLoader?.dispose();

        const onDataPayloadReady = (response: chart_loader.DataPayloadReady) => {
          self.postMessage(
            Object.assign(response, { kind: chart_loader.KindResponseMessage.DataPayloadReady }));
        };

        chartLoader = new chart_loader.ChartLoader(storage.connectWithCredentials(msg.storageRegion, msg.storageCredentials),
                                                   msg.bucket,
                                                   msg.folder,
                                                   onDataPayloadReady,
                                                   new Set(msg.filesLoaded),
                                                   msg.loadSequence);
      }
      break;

    case chart_loader.KindRequestMessage.Start:
      chartLoader?.start(msg.interval);
      break;

    case chart_loader.KindRequestMessage.Stop:
      chartLoader?.stop();
      break;

    case chart_loader.KindRequestMessage.Terminate:
      chartLoader?.dispose();
      chartLoader = undefined;
      break;
  }
}

export {};
