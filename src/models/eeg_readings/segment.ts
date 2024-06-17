import { Annotations } from './annotation';
import { Samples } from './samples';

import { TimePointRange } from '../../utilities/date_time';

/**
 * Contains the samplings of many signals along with the annotations that are associated to a given
 * interval points-in-time.
 *
 * @remarks
 *   During a recording session by the VEEGix8 app, it periodically uploads EEG readings as
 *   segments to the cloud-infrastructure while recording. These segments are practical when there
 *   are users in the cloud application monitoring particular live-feed recording session, since it
 *   enables the cloud-application to present the readings to those users only a few moments from
 *   point-in-time in which they were recorded by the VEEGix8 app.
 *
 *   Additionally, grouping EEG readings and annotations as segments allows for efficiency since it
 *   enables the cloud-application to present to users parts of the EEG readings such at the
 *   start or finish of the recording session and to incrementally upload the subsequent segments
 *   as a background task. Thus, allowing users to interact with the chart view without being
 *   required to await for the entire EEG readings to be read from cloud-infrastructure's storage.
 */
export interface Segment {
  timeRange: TimePointRange;
  samples: Array<Samples>;
  annotations: Annotations;
}