import { ByteSize } from '../../utilities/data';
import { TimePointRange } from '../../utilities/date_time';
import { Duration } from '../../utilities/duration';

/**
 * Represents the header portion which is defined at the top of the data.
 *
 * @remarks
 *   This isn't a concise field-by-field representation of the EDF format. Instead, it's a generic
 *   header  of the fields that are relevant to this application.
 *
 *   Such as, the EDF format doesn't explicitly define a finishing point-in-time. However, we can
 *   compute it. and having that point-in-time is practical in many contexts within our application.
 */
export interface Header {
  version: string;
  patientId: string | undefined;
  description: string | undefined;
  timeRange: TimePointRange;
  headerSize: ByteSize;
  samplePeriod: Duration;
  recordsCount: number;
}
