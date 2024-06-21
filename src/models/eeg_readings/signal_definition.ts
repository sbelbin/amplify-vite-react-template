import { SignalId } from './types';

import * as generics from '../../utilities/generics';

export enum SampleValueBits {
  bits8   = 8,
  bits16  = 16,
  bits24  = 24,
  bits32  = 32,
  bit64   = 64
}

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
  isAnnotations: boolean;
  sampleValueBits: SampleValueBits;
}

export type SignalDefinitions = SignalDefinition[];

export function makeSignalDefinitions(count: number) {
  const definitions: SignalDefinitions = Array<SignalDefinition>(count);

  for (let index = 0; index < count; ++index) {
    definitions[index] = {
      id: '',
      label: '',
      transducer: '',
      dimensions: '',
      physicalRange: { min: 0, max: 0 },
      digitalRange: { min: 0, max: 0 },
      preFilters: '',
      samplesCountPerRecord: 0,
      isAnnotations: false,
      scale: 0,
      samplingRate: 0,
      sampleValueBits: SampleValueBits.bits16
    };
  }

  return definitions;
}
