import { SignalId } from './types';

import { TimePoint } from '../../utilities/date_time';

export interface Samples {
  signalId: SignalId;
  timePoints: Array<TimePoint>;
  values: Array<number>;
}
