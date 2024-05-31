import {
  LoadSequence,
  OnDataPayloadReady
} from './types';

import * as storage from '../../storage';

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
 *  @todo
 *    Look into changing the name of this class and folder, since in principal this class could be
 *    more general as a fetching files from the storage server and possibly caching them into the
 *    browser's cache storage.
 *
 *    Adapt this class such that it accepts to messages emitted by the chart object requesting that
 *    this class to fetch the file that represents a segment of EEG readings for a specific range
 *    interval. Here the chart manages EEG readings within a chart's viewable range limits, such as
 *    1 to 2 hours and EEG recordings that aren't within that viewable range are discarded. When
 *    the chart's viewable range changes it issues requests to this class to fetch the files that
 *    correspond to the EEG readings the revised range.
 *
 *    Also, in the scenario of a live-feed recording session, this class would monitor the
 *    recording session's folder as to notify that new files are available, which implies that the
 *    is more recent EEG readings available. Upon getting that notification the chart can proceed
 *    to issue requests to this class as to fetch the data of any files that are within the chart's
 *    viewable range. When users are viewing an range from earlier point-in-time then nothing needs
 *    to be fetched, since those segments are part of the viewable range.
 */
export class ChartLoader {
  private storageClient: storage.Client;
  private bucket: string;
  private folder: string;
  private onDataPayloadReady: OnDataPayloadReady;
  private filesLoaded: Set<string>;
  private listFilesOrderBy: storage.ListFilesOrderBy;
  private monitorFolderInterval?: number;
  private monitorFolderTimer?: NodeJS.Timeout;
  private lastModifiedTime: number = 0;

  constructor(storageClient: storage.Client,
              bucket: string,
              folder: string,
              onDataPayloadReady: OnDataPayloadReady,
              filesLoaded: Set<string> = new Set<string>([]),
              loadSequence: LoadSequence = LoadSequence.Earliest) {
    this.storageClient = storageClient;
    this.bucket = bucket;
    this.folder = folder;
    this.onDataPayloadReady = onDataPayloadReady;
    this.filesLoaded = filesLoaded;
    this.listFilesOrderBy = (loadSequence == LoadSequence.Earliest)
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

        storage.fetchData(this.storageClient, this.bucket, file.Key!, file.Size!)
        .then((dataPayload) => this.onDataPayloadReady(dataPayload));
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
