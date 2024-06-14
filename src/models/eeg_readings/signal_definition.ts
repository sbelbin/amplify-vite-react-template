import { SignalId } from './types';

import * as generics from '../../utilities/generics';

export interface SignalDefinition {
  id: SignalId;
  label: string;
  transducer: string;
  dimensions: string;
  physicalRange: generics.Range<number>;
  digitalRange: generics.Range<number>;
  preFilters: string;
  samplesCountPerRecord: number;
  scale: number;
  samplingRate: number;
}

export type SignalDefinitions = Array<SignalDefinition>;
