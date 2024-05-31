import * as storage from '../storage';

import { AWSCredentials } from '@aws-amplify/core/internals/utils';

export const enum ChartLoaderLoadSequence {
  Earliest = 'earliest',
  Latest = 'latest'
}

export const enum ChartLoaderMessageKinds {
  Initialize = 'initialize',
  Start = 'start',
  Stop = 'stop',
  Terminate = 'terminate'
}

export interface ChartLoaderMessageInitialize {
  kind: ChartLoaderMessageKinds.Initialize;
  storageRegion: string;
  storageCredentials?: AWSCredentials;
  bucket: string;
  folder: string;
  filesLoaded: string[];
  loadSequence: ChartLoaderLoadSequence;
}

export interface ChartLoaderMessageStart {
  kind: ChartLoaderMessageKinds.Start;
  interval: number;
}

export interface ChartLoaderMessageStop {
  kind: ChartLoaderMessageKinds.Stop;
}

export interface ChartLoaderMessageTerminate {
  kind: ChartLoaderMessageKinds.Terminate;
}

export type ChartLoaderMessage = ChartLoaderMessageInitialize | ChartLoaderMessageStart | ChartLoaderMessageStop | ChartLoaderMessageTerminate;

///
/// Internal
///

let chartLoader: ChartLoader | undefined;

onmessage = (message) => {
  switch (message.data.kind) {
    case ChartLoaderMessageKinds.Initialize:
      {
        const msg: ChartLoaderMessageInitialize = message.data;

        chartLoader?.dispose();

        chartLoader = new ChartLoader(storage.connectWithCredentials(msg.storageRegion, msg.storageCredentials),
                                 msg.bucket,
                                 msg.folder,
                                 new Set(msg.filesLoaded),
                                 msg.loadSequence);
      }
      break;

    case ChartLoaderMessageKinds.Start:
      {
        const msg: ChartLoaderMessageStart = message.data;
        chartLoader?.start(msg.interval);
      }
      break;

    case ChartLoaderMessageKinds.Stop:
      chartLoader?.stop();
      break;

    case ChartLoaderMessageKinds.Terminate:
      chartLoader?.dispose();
      chartLoader = undefined;
      break;
  }
}

/**
 *  This class is responsible to fetching the EEG readings of a patient's recording session that
 *  this stored in the cloud infrastructure and once fetched emits a message so that the chart
 *  object can incorporate those EEG readings to be viewed in the chart.
 *
 *  @remarks
 *    When the recording session is that of an active live-feed, then it monitors the recording
 *    session's folder in cloud storage to detect when new files were uploaded in which it proceeds
 *    downloading the file's contents and then incorporated it into the chart.
 *
 *    Additionally, in the scenario of a live-feed, the latest file is downloaded then it follows
 *    a descending chronological order from the most recent to the earliest.
 *
 *    When the recording session isn't a live-feed, then it proceeds downloading the files from the
 *    the beginning of the recording session and then each subsequent files are downloaded in the
 *    chronological order of the recording session.
 *
 *    Once that a file has been downloaded it isn't downloaded again nor incorporated into the
 *    chart.
 *
 *  @remarks - FUTURE
 *    Adapt this class such that it accepts to messages emitted by the chart object requesting for
 *    this class to provide the EEG readings for a specific range interval. Thus, the
 *    chart object has the capability to manage EEG readings that it keeps in memory based on the
 *    chart's viewable range. As the chart's viewable range changes it issues a request for loading
 *    the EEG readings for a particular range (possibly using read-head cache technique).
 *
 *    Also, in the scenario of a live-feed recording session, this class would monitor the
 *    recording session's folder and to notify the chart object about the latest point-in-time that
 *    is available to download. After which, the chart object issues requests to this class to
 *    download those recently added files provided that they are within the chart's viewable range,
 *    since the user might be viewing EGG reading from much earlier points-in-time.
 */
class ChartLoader {
  private storageClient: storage.Client;
  private bucket: string;
  private folder: string;
  private filesLoaded: Set<string>;
  private listFilesOrderBy: storage.ListFilesOrderBy;
  private monitorFolderInterval?: number;
  private monitorFolderTimer?: NodeJS.Timeout;
  private lastModifiedTime: number = 0;

  constructor(storageClient: storage.Client,
              bucket: string,
              folder: string,
              filesLoaded: Set<string> = new Set<string>([]),
              loadSequence: ChartLoaderLoadSequence = ChartLoaderLoadSequence.Earliest) {
    this.storageClient = storageClient;
    this.bucket = bucket;
    this.folder = folder;
    this.filesLoaded = filesLoaded;
    this.listFilesOrderBy = (loadSequence == ChartLoaderLoadSequence.Earliest)
                          ? storage.orderByLastModifiedAscending
                          : storage.orderByLastModifiedDescending;
  }

  public dispose() {
    this.resetMonitorFolderTimer();
  }

  public start(monitorFolderInterval: number) {
    this.resetMonitorFolderTimer();
    this.monitorFolderInterval = monitorFolderInterval;
    this.launchMonitorFolderTimer();
  }

  public stop() {
    this.resetMonitorFolderTimer();
  }

  private isCancelled(): boolean {
    return (this.monitorFolderInterval === undefined);
  }

  private launchMonitorFolderTimer() {
    if (!this.isCancelled()) {
      this.monitorFolderTimer = setTimeout(() => this.monitorFolderForChanges(),
                                           this.monitorFolderInterval);
    }
  }

  private async monitorFolderForChanges(): Promise<void> {
    if (this.isCancelled()) {
      return;
    }

    const listFilesFilter = (file: storage.File) => !this.filesLoaded.has(file?.Key ?? '');

    try {
      const listFiles = await storage.listFilesModifiedAfter(this.storageClient,
                                                             this.bucket,
                                                             this.folder,
                                                             new Date(this.lastModifiedTime),
                                                             listFilesFilter,
                                                             this.listFilesOrderBy);

      for (const file of listFiles) {
        if (this.isCancelled()) {
          return;
        }

        postMessage({
          kind: 'edf_payload',
          payload: await storage.fetchData(this.storageClient, this.bucket, file.Key!, file.Size!)
        });
      }

      this.lastModifiedTime =
              Math.max(this.lastModifiedTime,
                       ...listFiles.map((file) => file.LastModified?.getTime() ?? 0));

      listFiles.forEach((file) => file.Key && this.filesLoaded.add(file.Key));
    }
    catch(error) {
      console.error(`Failed to monitor for changes on the folder. Reason: ${error}`);
    }
    finally {
      this.launchMonitorFolderTimer();
    }
  }

  private resetMonitorFolderTimer() {
    this.monitorFolderInterval = undefined;

    if (this.monitorFolderTimer) {
      clearTimeout(this.monitorFolderTimer);
      this.monitorFolderTimer = undefined;
    }
  }
}
