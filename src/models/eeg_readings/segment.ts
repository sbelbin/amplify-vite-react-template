import { Annotations } from './annotation';
import { SignalId } from './types';

import * as date_time from '../../utilities/date_time';

export interface SignalSamples {
  signalId: SignalId;
  timePoints: Array<date_time.TimePoint>;
  values: Array<number>;
}

export interface Segment {
  timeRange: date_time.TimePointRange;
  signalSamples: Array<SignalSamples>;
  annotations: Annotations;
}