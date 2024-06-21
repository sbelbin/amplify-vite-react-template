import { Header } from './header';
import { Segment } from './segment';
import { SignalDefinitions } from './signal_definition';

/**
 * Represents EEG readings and meta-data that was read from the storage in the cloud-infrastructure.
 */
export interface Payload {
  header: Header;
  definitions: SignalDefinitions;
  segment: Segment;
}
