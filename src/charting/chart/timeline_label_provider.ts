import * as date_time from '../../utilities/date_time';

import * as duration from '../../utilities/duration';

import { NumericLabelProvider } from 'scichart';

export class TimelineLabelProvider extends NumericLabelProvider {
  constructor() {
    super();
    this.useCache = true;
    this.formatLabelProperty = this.makeLabels;
    this.formatCursorLabelProperty = this.makeLabels;
  }

  private makeLabels(timestamp: number): string {
    const axisRange = this.parentAxis.visibleRange;

    const difference = Math.ceil(axisRange.diff) as duration.Duration;

    const precision = (difference < duration.TimeUnits.Second) ? date_time.DateTimePrecision.Subsecond
                    : (difference < duration.TimeUnits.Minute) ? date_time.DateTimePrecision.Second
                    : (difference < duration.TimeUnits.Hour)   ? date_time.DateTimePrecision.Minute
                    : (difference < duration.TimeUnits.Day)    ? date_time.DateTimePrecision.Hour
                    : date_time.DateTimePrecision.Second;

    const labels = makeDateTimeLabels(timestamp, precision);

    this.parentAxis.axisTitle = labels.axis;
    return labels.cursor;
  }
}

//
// Internal
//
interface Labels {
  axis: string,
  cursor: string
}

function makeDateTimeLabels(timestamp: number,
                            precision: date_time.DateTimePrecision) : Labels
{
  const locale = "sv-SE";

  let axis = '';
  let cursor = '';

  const dateTime = new Date(timestamp);

  switch (precision) {
    case date_time.DateTimePrecision.Year:
      cursor  = dateTime.toLocaleDateString( locale, { year: 'numeric' } );
      break;

    case date_time.DateTimePrecision.Month:
      axis    = dateTime.toLocaleDateString( locale, { year: 'numeric' } );
      cursor  = dateTime.toLocaleDateString( locale, { month: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Day:
      axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit' } );
      cursor  = dateTime.toLocaleDateString( locale, { day: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Hour:
      axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } );
      cursor  = dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Minute:
      axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } ) + ' ' +
                dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );

      cursor  = dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Second:
      axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } ) + ' ' +
                dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );

      cursor  = `.$ dateTime.getMilliseconds().toString().padStart(3, '0')}`;
      break;

    case date_time.DateTimePrecision.Subsecond:
    default:
      axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } ) + ' ' +
               dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );

      cursor  = `.$ dateTime.getMilliseconds().toString().padStart(3, '0')}`;
      break;
  }

  return { axis: axis, cursor: cursor };
}
