import * as date_time from '../../../utilities/date_time';
import * as duration from '../../../utilities/duration';
import * as generics from '../../../utilities/generics';

import {
  ByteOffset,
  ByteSize,
  Endianness
} from '../../../utilities/data';

import {
  Annotation,
  Annotations,
  Header,
  Payload,
  SampleValueBits,
  Segment,
  SignalDefinitions,
  makeSignalDefinitions
} from '../../../models/eeg_readings';

/**
 * Reads the recording session's payload which is given as a raw buffer.
 *
 * @param buffer - Raw buffer with the contents of the recording session.
 *
 * @returns Returns a recording session payload as a structured representation.
 *
 * @todo Provide an interface with callback functions
 *   To better promote the concept of progressive loading as to be more responsive the idea of
 *   sending a message at the completion of a phase. Such as when the definitions are read then
 *   those details are sent immediate in a message thus allowing the chart to be rendered.
 *
 *   Additionally, at the end of reading a cycle (record) the sampling values for each of the
 *   signals can be sent rather than awaiting the reading all sampling values within the segment
 *   file.
 *
 *   A benefit for users is that they are presented with data sooner instead of awaiting that the
 *   entire file is processed. This enables us to aggregate the small interval file segments into
 *   a single file in which users and allow for good performance even when the single file is
 *   several gigabytes.
 *
 * @todo To support files of several GB, replace buffer by an reader interface class.
 *   This parser is a forward directional parser, such that it only move forwards when reading the
 *   data from the buffer. However, there is a prerequisite that all of the file's contents are
 *   read into this buffer.
 *
 *   This becomes problem when the recording session spans several hours and thus if it's a single
 *   file will be several gigabytes in size. Fetching the entire file into memory isn't possible.
 *
 *   Therefore a mechanism is required such that an interface is provided such that the data is
 *   pulled from storage when required by the parser. Since this parser is a forward directional
 *   parser, the recommendation would be to have a read-ahead buffer of several mega-bytes.
 *
 *   The change is to replace the buffer by an interface that provides the data to the parser.
 */
export function readPayload(buffer: ArrayBuffer) : Payload {
  const parser = new Parser(buffer);

  const header = readHeader(parser);

  const definitions = readDefinitions(parser, header.samplePeriod);

  const segmentInterval = readSegment(parser,
                                      header.timeRange.min,
                                      header.timeRange,
                                      header.samplePeriod,
                                      definitions);

  return {
           header: header,
           definitions: definitions.filter((definition) => !definition.isAnnotations),
           segment: segmentInterval
         }
}

class Parser {
  private readonly buffer: ArrayBuffer;
  private byteOffset: ByteOffset;
  private byteLength: ByteSize;
  private byteRemaining: ByteSize;
  private dataView: DataView;
  private readonly decoder: TextDecoder = new TextDecoder();
  private endianness:  Endianness;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.byteOffset = 0;
    this.byteLength = this.buffer.byteLength;
    this.byteRemaining = this.byteLength;
    this.dataView = new DataView(this.buffer);
    this.decoder = new TextDecoder();
    this.endianness = Endianness.Little;
  }

  public readBytes(length: ByteSize): ArrayBuffer {
    this.checkSufficientBytes(length);

    const value = this.buffer.slice(this.byteOffset, this.byteOffset + length);
    this.advance(length);

    return value;
  }

  public readText(length: ByteSize): string {
    const text = this.decoder.decode(this.readBytes(length));
    return text.trim();
  }

  public readTextAsInteger(length: ByteSize): number {
    return parseInt(this.readText(length));
  }

  public readTextAsInt16(length: ByteSize = 8): number {
    return this.readTextAsInteger(length);
  }

  public readTextAsInt8(length: ByteSize = 4): number {
    return this.readTextAsInteger(length);
  }

  public readTextAsFloat32(length: ByteSize = 8): number {
    return parseFloat(this.readText(length));
  }

  public readInt8(): number {
    const length = 1;
    this.checkSufficientBytes(length);
    const value = this.dataView.getInt8(this.byteOffset);
    this.advance(length);
    return value;
  }

  public readInt16(): number {
    const length = 2;
    this.checkSufficientBytes(length);
    const value = this.dataView.getInt16(this.byteOffset, this.endianness === Endianness.Little);
    this.advance(length);
    return value;
  }

  public readInt24(): number {
    let value = this.readInt16();
    value << 8;
    value += this.readInt8();
    return value;
  }

  public readTextAsDate(): string {
    const text = this.readText(8);
    const day   = text.slice(0, 2);
    const month = text.slice(3, 5);
    const year  = `20${text.slice(6)}`;
    return `${year}-${month}-${day}`;
  }

  public readTextAsTime(): string | undefined {
    const text = this.readText(8);
    const hour   = text.slice(0 ,2);
    const minute = text.slice(3, 5);
    const second = text.slice(6);
    return `${hour}:${minute}:${second}`;
  }

  public readTextAsTimePoint(): date_time.TimePoint {
    const date = this.readTextAsDate();
    const time = this.readTextAsTime();
    return (new Date(`${date}T${time}`)).getTime();
  }

  public readAnnotations(startTime: date_time.TimePoint,
                         length: ByteSize): Annotations {
    enum MarkerEnd {
      Annotation = 0,
      Block = 20,
      BlockOnset = 21
    }

    enum Modes {
      Onset,
      Duration,
      Notes,
      Done
    }

    const annotations: Annotations = [];

    const dataBuffer = this.readBytes(length);

    if (!dataBuffer) {
      return annotations;
    }

    const data = new Uint8Array(dataBuffer);

    let mode:Modes = Modes.Onset;
    let beginOffset = 0;
    let dataOffset = 0;
    let annotation: Annotation | undefined;
    const decoder = this.decoder;

    //
    // Callback that is invoked when the end of a block is encountered.
    //
    function onEndBlock(setter: (text: string, annotation: Annotation) => void) {
      const text = decoder.decode(data.slice(beginOffset, dataOffset))?.trim();

      if (text) {
        setter(text, annotation!);
      }

      beginOffset = dataOffset + 1;
    }

    for (; dataOffset < data.byteLength; dataOffset++) {
      const currentByte = data[dataOffset];

      if (currentByte === MarkerEnd.Annotation) {
        // Exit loop when processing two consecutive end annotations (null character)
        if (mode === Modes.Done) {
          break;
        }

        mode = Modes.Done;
      } else if (mode === Modes.Done) {
        mode = Modes.Onset;
      }

      switch (mode) {
        case Modes.Onset:
          {
            if (currentByte === MarkerEnd.Block || currentByte === MarkerEnd.BlockOnset) {
              annotation = {
                             timeRange: { min: startTime, max: startTime },
                             notes: []
                           };

              onEndBlock((text, annotation) => {
                const timeOffset = duration.secondsToDuration(parseFloat(text));
                annotation.timeRange.min += timeOffset;
                annotation.timeRange.max += timeOffset;
              });

              mode = currentByte === MarkerEnd.BlockOnset
                   ? Modes.Duration
                   : Modes.Notes;
            }
          }
          break;

        case Modes.Duration:
          {
            if (currentByte === MarkerEnd.Block) {
              onEndBlock((text, annotation) => {
                const timeDuration = duration.secondsToDuration(parseFloat(text));
                annotation.timeRange.max += timeDuration;
              });

              mode = Modes.Notes;
            }
          }
          break;

        case Modes.Notes:
          {
            if (currentByte === MarkerEnd.Block) {
              onEndBlock((text, annotation) => {
                if (text) {
                  annotation.notes.push(text);
                }
              });
            }
          }
          break;

        case Modes.Done:
          {
            if (annotation?.notes.length) {
              annotations.push(annotation);
            }
            annotation = undefined;
            beginOffset = dataOffset + 1;
          }
          break;
      }
    }

    return annotations;
  }

  private advance(length: ByteSize): void {
    const byteCount = Math.min(length, this.byteRemaining);
    this.byteRemaining -= byteCount;
    this.byteOffset += byteCount;
  }

  private areSufficientBytes(length: ByteSize): boolean {
    return length <= this.byteRemaining;
  }

  private checkSufficientBytes(length: ByteSize): void {
    if (!this.areSufficientBytes(length)) {
      throw Error('There is an insufficient number of bytes remaining for the parser to use.');
    }
  }
}

function sampleValueReader(sampleValueBits: SampleValueBits): (paser: Parser) => number {
  switch (sampleValueBits) {
    case SampleValueBits.bits8:
      return (parser: Parser) => parser.readInt8();

    case SampleValueBits.bits16:
      return (parser: Parser) => parser.readInt16();

    case SampleValueBits.bits24:
      return (parser: Parser) => parser.readInt24();

    default:
      return (parser: Parser) => parser.readInt16();
  }
}

function readHeader(parser: Parser) : Header {
  const version = parser.readText(8);
  const patientId = parser.readText(80);
  const description = parser.readText(80);
  const startTime = parser.readTextAsTimePoint();
  const headerSize = parser.readTextAsInt16();
  parser.readText(44); // Skip over the reserved.
  const recordsCount = parser.readTextAsInt16();

  const samplePeriod = duration.secondsToDuration(parser.readTextAsFloat32());
  const recordingDuration = samplePeriod * recordsCount;
  const finishTime = startTime + recordingDuration;

  return {
           version: version,
           patientId: patientId,
           description: description,
           timeRange: { min: startTime, max: finishTime },
           headerSize: headerSize,
           samplePeriod: samplePeriod,
           recordsCount: recordsCount
         }
}

/**
 * Reads the signal definitions section from the recording session.
 *
 * @param parser - The parser to use.
 * @param samplePeriod - The sampling period which is declared in the recording session's header.
 * @returns A collection of signal definitions.
 *
 * @remarks
 *   It's imperative to parse each field because the data is organized in a manner in which the
 *   values are grouped by field.
 *
 *   Thus, when there are 30 definitions, the values for the label field is an array string[30].
 *   Thus, labels[0] is the label for the 1st definition, labels[1] is for the 2nd definitions...
 */
function readDefinitions(parser: Parser,
                         samplePeriod: duration.Duration): SignalDefinitions {
  const definitions = makeSignalDefinitions(parser.readTextAsInt8());

  definitions.forEach((definition) => definition.label = parser.readText(16));
  definitions.forEach((definition) => definition.transducer = parser.readText(80));
  definitions.forEach((definition) => definition.dimensions = parser.readText(8));
  definitions.forEach((definition) => definition.physicalRange.min = parser.readTextAsInt16());
  definitions.forEach((definition) => definition.physicalRange.max = parser.readTextAsInt16());
  definitions.forEach((definition) => definition.digitalRange.min = parser.readTextAsInt16());
  definitions.forEach((definition) => definition.digitalRange.max = parser.readTextAsInt16());
  definitions.forEach((definition) => definition.preFilters = parser.readText(80));
  definitions.forEach((definition) => definition.samplesCountPerRecord = parser.readTextAsInt16());
  definitions.forEach(()           => parser.readBytes(32)); // Skip over reserved bytes.

  definitions.forEach((definition, index) => {
    definition.isAnnotations = definition.label.startsWith('EDF Annotations');
    definition.id = (!definition.isAnnotations) ? `${index}` : '';
    definition.scale = generics.diff(definition.physicalRange) / generics.diff(definition.digitalRange);
    definition.samplingRate = samplePeriod / definition.samplesCountPerRecord;
    definition.sampleValueBits = SampleValueBits.bits16; // Default to 16-bits integer.
  });

  return definitions;
}

/**
 * Reads a section of the recording session that is a segment of the annotations and the sampling
 * values to extract from that recording session.
 *
 * @param parser - The parser to use.
 * @param startTime - The recording session's start time. Used to compute offsets.
 * @param timeRange - The range of time to extract annotations and sampling values.
 * @param samplePeriod - The sample period of a single record.
 * @param definitions - The signal definitions which includes those for annotations.
 * @returns A segment of the recording session's annotations and sampling values.
 *
 * @todo Use samples iterator
 *   For each record and for each samples set (i.e. signal) there is a look by identifier to match
 *   a definition to a particular samples set.
 *
 *   This look isn't necessary since and can be replaced by using an iterator on the set of samples.
 *   At the start of each record just set the samples set iterator to the beginning and then after
 *   reading a samples values to advance the iterator to the next samples set.
 *
 *   A minor side-benefit is that we rid the need of signalId field from the Samples interface as
 *   well as the id from the SignalDefinition structure. These were indexed offset based anyways.
 */
function readSegment(parser: Parser,
                     startTime: date_time.TimePoint,
                     timeRange: date_time.TimePointRange,
                     samplePeriod: duration.Duration,
                     definitions: SignalDefinitions): Segment {
  const segment: Segment = {
                   timeRange: timeRange,
                   samples: [],
                   annotations: []
                 };

  definitions.forEach((definition) => {
    if (!definition.isAnnotations) {
      segment.samples.push({
        signalId: definition.id,
        timePoints: [],
        values: []
      })
    }
  });

  for (let recordTime = timeRange.min; recordTime < timeRange.max; recordTime += samplePeriod) {
    definitions.forEach((definition) => {
      if (definition.isAnnotations) {
        const annotations = parser.readAnnotations(startTime,
                                                   definition.samplesCountPerRecord * (definition.sampleValueBits / 8));

        segment.annotations.push(...annotations);
      } else {
        const sample = segment.samples.find((sample) => sample.signalId === definition.id)!;

        const readSampleValueReader = sampleValueReader(definition.sampleValueBits);

        for (let sampleIndex = 0, sampleTime = recordTime;
             sampleIndex < definition.samplesCountPerRecord;
             sampleIndex++, sampleTime += definition.samplingRate) {
          sample.timePoints.push(sampleTime);
          sample.values.push(readSampleValueReader(parser) * definition.scale);
        }
      }
    });
  }

  return segment;
}

