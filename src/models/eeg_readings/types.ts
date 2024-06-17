import * as generics from '../../utilities/generics';

export type SignalId = string;

/**
 * A physical value.
 */
export type PhysicalValue = number;

/**
 * A digital value.
 */
export type DigitValue = number;

export type PhysicalRange = generics.Range<PhysicalValue>;
export type DigitalRange = generics.Range<DigitValue>;

/**
 * A scale is the physical range different / digital range difference.
 */
export type Scale = number;
