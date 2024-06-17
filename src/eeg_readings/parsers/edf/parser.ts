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
  SignalDefinition,
  SignalDefinitions
} from '../../../models/eeg_readings';

export function readPayload(buffer: ArrayBuffer) : Payload {
  const parser = new Parser(buffer);

  const header = readHeader(parser);
  const definitions = readDefinitions(parser, header.samplePeriod);
  const segmentInterval = readSegment(parser,
                                              header.timeRange.min,
                                              header.recordsCount,
                                              header.samplePeriod,
                                              definitions);

  return {
    header: header,
    definitions: definitions,
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
    const text = this.readText(6);
    const day   = text.slice(0, 2);
    const month = text.slice(3, 5);
    const year  = `20${text.slice(6)}`;
    return `${year}-${month}-${day}`;
  }

  public readTextAsTime(): string | undefined {
    const text = this.readText(6);
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
    if (this.areSufficientBytes(length)) return;
    throw Error();
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
  const headerSize = parser.readTextAsInt16(8);
  parser.readText(44); // Reserved
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

function readDefinitions(parser: Parser,
                         samplePeriod: duration.Duration): SignalDefinitions {
  const signalsCount = parser.readTextAsInt8();

  const definitions = Array<SignalDefinition>(signalsCount);

  /**
   * It's imperative to parse each field since the data is organized such that for each field is
   * an array based on the number definitions. Thus, if there are 30 definitions, then the data
   * is labels[30], transducer[30], dimensions[30], etc...
   */
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

  definitions.forEach((definition) => {
    definition.isAnnotations = definition.label.startsWith('EDF Annotations');
    definition.scale = generics.diff(definition.physicalRange) / generics.diff(definition.digitalRange);
    definition.samplingRate = samplePeriod / definition.samplesCountPerRecord;
    definition.sampleValueBits = SampleValueBits.bits16; // Default to 16-bits integer.
  });

  return definitions;
}

function readSegment(parser: Parser,
                     startTime: date_time.TimePoint,
                     recordsCount: number,
                     samplePeriod: duration.Duration,
                     definitions: SignalDefinitions): Segment {
  const finishTime = startTime + (samplePeriod * recordsCount);
  const segment: Segment = {
                   timeRange: { min: startTime, max: finishTime },
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

  for (let recordIndex = 0, recordTime = startTime;
       recordIndex < recordsCount;
       recordIndex++, recordTime += samplePeriod) {
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

