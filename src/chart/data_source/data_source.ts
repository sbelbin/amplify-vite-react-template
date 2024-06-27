import {
  LoadSequence,
  OnDefinitionsReady,
  OnDisposed,
  OnSegmentReady
} from './types';

import { readPayload } from '../../eeg_readings/parsers/edf';

import * as storage from '../../storage';

/**
 *  This class is responsible to fetch the EEG readings from a patient's recording session that
 *  this stored in the cloud infrastructure and once fetched emits a message so that the chart
 *  view can display those EEG readings.
 *
 *  @remarks
 *    When the recording session is a live-feed, then this chart data source monitors the recording
 *    session's folder in cloud storage to detect when new file segments were uploaded. When it
 *    discovers a list of newly uploaded file segments it proceeds to download the EEG readings
 *    from each segment file so that the chart view can display those newly added EEG readings.
 *
 *    Additionally, in the scenario of a live-feed, then this chart loaded fetches the most recent
 *    EEG readings before those that were recorded earlier. Hence, it fetches from the current
 *    point-in-time until the beginning of the recording session.
 *
 *    When the recording session is that of a completed session, then this chart data source fetches the
 *    EEG readings starting from the beginning of the recording session and proceeds to fetch the
 *    subsequent ones until reaching the end of the recording session.
 *
 *    Once that a given segment of EEG readings were fetched that segment won't be fetched again
 *    and incorporated to the chart view.
 *
 *  @todo
 *    Look into changing the name of this class and folder, since in principal this class could be
 *    more general as a fetching files from the storage server and possibly caching them into the
 *    browser's cache storage.
 *
 *    Another variation is making this into a segmented EEG readings feeder/loader instead, since
 *    the fact that each segment consists of a file is an implementation detail that could change
 *    such that the EEG readings are stored in a single file or as record(s) in a table.
 *
 *    Adapt this class such that it accepts to messages emitted by the chart view requesting that
 *    this chart data source to fetch the segments of EEG readings for a specific range interval. Since,
 *    the chart views controls the viewable range limits, such as 1 to 2 hours, then its viewable
 *    range is shifted forward or backwards, then the chart view discards EEG recordings that
 *    aren't within the revised viewable range & issues request(s) to this chart data source to fetch
 *    the segments of EEG readings only for that missing interval of the revised viewable range.
 *
 *    With the above adaptation of chart viewer making requests & in the live-feed scenario, this
 *    chart data source class could notify the chart view when EEG readings were uploaded by the app
 *    and pass a message to the chart view that the recording session has expanded. It would be
 *    for the chart view to determine if those newly added EEG readings are within the revised
 *    viewable range and if so then proceed to request this chart data source to fetch those EEG
 *    readings segments. Hence, we apply a notify-pull model in which the control is managed by
 *    the chart view to ensure that only the meaningful EEG readings are loaded in memory or
 *    fetched from the cloud infrastructure.
 */
export class ChartDataSource {
  private readonly storageClient: storage.Client;
  private readonly folder: storage.Path;
  private readonly onDefinitionsReady: OnDefinitionsReady;
  private readonly onSegmentReady: OnSegmentReady;
  private readonly onDisposed: OnDisposed;
  private readonly listFilesOrderBy: storage.ListFilesOrderBy;
  private filesLoaded: Set<string> = new Set<string>();
  private monitorFolderInterval?: number;
  private monitorFolderTimer?: NodeJS.Timeout;
  private lastModifiedTime: number = 0;
  private isEnumerating: boolean = false;

  constructor(storageClient: storage.Client,
              folder: storage.Path,
              onDefinitionsReady: OnDefinitionsReady,
              onSegmentReady: OnSegmentReady,
              onDisposed: OnDisposed,
              loadSequence: LoadSequence = LoadSequence.Earliest) {
    this.storageClient = storageClient;
    this.folder = folder;
    this.onDefinitionsReady = onDefinitionsReady;
    this.onSegmentReady = onSegmentReady;
    this.onDisposed = onDisposed;
    this.listFilesOrderBy = (loadSequence == LoadSequence.Earliest)
                          ? storage.orderByLastModifiedAscending
                          : storage.orderByLastModifiedDescending;
  }

  public dispose() {
    this.resetMonitorFolderTimer();
    this.onDisposed();
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
    if (this.isCancelled() || this.isEnumerating) {
      return;
    }

    this.isEnumerating = true;

    try {
      const listFilesFilter = (file: storage.File) =>
                                !this.filesLoaded.has(file?.Key ?? '');

      const folder = storage.toS3BucketPath(this.folder as storage.AWSS3Path)!;

      const listFiles = await storage.listFilesModifiedAfter(this.storageClient,
                                                             folder,
                                                             new Date(this.lastModifiedTime),
                                                             listFilesFilter,
                                                             this.listFilesOrderBy);

      for (const file of listFiles) {
        if (this.isCancelled()) {
          return;
        }

        const filePath = { bucket: folder.bucket, path: file.Key! };

        const dataBuffer = await storage.fetchData(this.storageClient, filePath, file.Size!);
        const payload = readPayload(dataBuffer);

        if (this.filesLoaded.size === 0) {
          this.onDefinitionsReady(payload.definitions);
        }

        this.onSegmentReady(payload.segment);

        this.filesLoaded.add(file.Key!);
        this.lastModifiedTime = Math.max(this.lastModifiedTime,
                                         file.LastModified?.getTime() ?? 0);
      }
    }
    catch(error) {
      console.error(`Failed to monitor for changes on the folder. Reason: ${error}`);
    }
    finally {
      this.isEnumerating = false;
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
