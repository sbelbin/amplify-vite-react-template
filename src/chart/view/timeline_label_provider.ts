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

  private makeLabels(timePoint: number): string {
    const visibleRangePeriod = Math.ceil(this.parentAxis.visibleRange.diff) as duration.Duration;

    const precision = (visibleRangePeriod < duration.TimeUnits.Second) ? date_time.DateTimePrecision.Subsecond
                    : (visibleRangePeriod < duration.TimeUnits.Minute) ? date_time.DateTimePrecision.Second
                    : (visibleRangePeriod < duration.TimeUnits.Hour)   ? date_time.DateTimePrecision.Minute
                    : (visibleRangePeriod < duration.TimeUnits.Day)    ? date_time.DateTimePrecision.Hour
                    : date_time.DateTimePrecision.Second;

    const labels = makeTimePointLabels(timePoint, precision);

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

function makeTimePointLabels(timePoint: date_time.TimePoint,
                             precision: date_time.DateTimePrecision) : Labels
{
  const locale = "sv-SE";

  const labels = {
                   axis: '',
                   cursor: ''
                 };

  const dateTime = new Date(timePoint);

  switch (precision) {
    case date_time.DateTimePrecision.Year:
      labels.cursor  = dateTime.toLocaleDateString( locale, { year: 'numeric' } );
      break;

    case date_time.DateTimePrecision.Month:
      labels.axis    = dateTime.toLocaleDateString( locale, { year: 'numeric' } );
      labels.cursor  = dateTime.toLocaleDateString( locale, { month: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Day:
      labels.axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit' } );
      labels.cursor  = dateTime.toLocaleDateString( locale, { day: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Hour:
      labels.axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } );
      labels.cursor  = dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Minute:
      labels.axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } ) + ' ' +
                       dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );

      labels.cursor  = dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );
      break;

    case date_time.DateTimePrecision.Second:
      labels.axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } ) + ' ' +
                       dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );

      labels.cursor  = `.${dateTime.getMilliseconds().toString().padStart(3, '0')}`;
      break;

    case date_time.DateTimePrecision.Subsecond:
    default:
      labels.axis    = dateTime.toLocaleDateString( locale, { year: 'numeric', month: '2-digit', day: '2-digit' } ) + ' ' +
                       dateTime.toLocaleTimeString( locale, { hourCycle: 'h24', hour: '2-digit', minute: '2-digit', second: '2-digit' } );

      labels.cursor  = `.${dateTime.getMilliseconds().toString().padStart(3, '0')}`;
      break;
  }

  return labels;
}
