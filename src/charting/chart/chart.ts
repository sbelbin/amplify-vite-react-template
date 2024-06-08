import { EDF } from "./edf";

import * as date_time from '../../utilities/date_time';
import * as duration from '../../utilities/duration';
import * as timeline_controller from '../../timeline_controller';

import
{
  AnnotationTooltipModifier
} from "./annotation_tooltip_modifier";

import annotationImage from '../res/images/annotation.png';

import {
  AxisMarkerAnnotation,
  CustomAnnotation,
  EAutoRange,
  EAxisAlignment,
  ECoordinateMode,
  EExecuteOn,
  EHorizontalAnchorPoint,
  ELabelPlacement,
  EVerticalAnchorPoint,
  EXyDirection,
  FastLineRenderableSeries,
  NumericLabelProvider,
  LineAnnotation,
  MouseWheelZoomModifier,
  NumberRange,
  OverviewRangeSelectionModifier,
  RubberBandXyZoomModifier,
  RolloverModifier,
  RolloverTooltipSvgAnnotation,
  SciChartJsNavyTheme,
  TextAnnotation,
  VerticalLineAnnotation,
  XAxisDragModifier,
  XyDataSeries,
  YAxisDragModifier,
  ZoomPanModifier,
  ZoomExtentsModifier,
  VisibleRangeChangedArgs
} from 'scichart';

import { ChartModifierBase2D } from 'scichart/Charting/ChartModifiers/ChartModifierBase2D';
import { LeftAlignedOuterVerticallyStackedAxisLayoutStrategy } from 'scichart/Charting/LayoutManager/LeftAlignedOuterVerticallyStackedAxisLayoutStrategy';
import { NumericAxis } from 'scichart/Charting/Visuals/Axis/NumericAxis';
import { SciChartOverview } from 'scichart/Charting/Visuals/SciChartOverview';
import { SciChartSurface } from 'scichart/Charting/Visuals/SciChartSurface';

import { createImageAsync } from 'scichart/utils/imageUtil';

interface Sample {
  time: number;
  value: number;
}

interface Record {
  samples: Array<Sample>;
}

type Records = Array<Record>;

export class Chart
{
  timelineAxis;
  timelineIndicator;
  timelineChartModifier;
  overviewTimelineChartModifier;
  onFinishChartTimelineNavigation;
  timelineChangesSubscriptions = new Set([]);
  sensors = [];

  constructor(recording, buffer) {
    const dateTimeRange =
          {
            min: recording.startTimestamp,
            max: recording.finishTimestamp ?? new Date()
          };

    this.timelineAxis = makeTimelineAxis(chart.wasmContext, dateTimeRange);

    this.timelineAxis.visibleRangeChanged.subscribe((args: VisibleRangeChangedArgs) => {
      this.onTimelineVisibleRangeChanged(args);
    });

    chart.sciChartSurface.xAxes.add(this.timelineAxis);

    this.timelineIndicator = new VerticalLineAnnotation
                                 (
                                   {
                                     axisLabelFill: "#f3fa2a",
                                     axisFontSize: 30,
                                     labelPlacement: ELabelPlacement.Top,
                                     showLabel: true,
                                     stroke: "#f3fa2a",
                                     strokeThickness: 5,
                                     xAxisId: this.timelineAxis.id,
                                     x1: recording.isLiveFeed ? dateTimeRange.max : dateTimeRange.min
                                   }
                                 );

    chart.sciChartSurface.annotations.add(this.timelineIndicator);

    this.timelineChartModifier = new TimelineChartModifier(this);

    chart.sciChartSurface.chartModifiers.add
    (
      // new AnnotationTooltipModifier(),
      this.timelineChartModifier,
      new YAxisDragModifier(),
      new XAxisDragModifier(),
      new RubberBandXyZoomModifier( { xyDirection: EXyDirection.XDirection, executeOn: EExecuteOn.MouseRightButton } ),
      new MouseWheelZoomModifier( { xyDirection: EXyDirection.XDirection } ),
      new ZoomExtentsModifier(),
      new ZoomPanModifier()
    );

    const edf = new EDF(buffer);

    //
    // \todo Steven Belbin
    //   Limit to the first 8 channels.
    //   However, this should selected based on the view.
    //
    const signals = edf.signals
                       .slice(0, Math.min(8, edf.signals.length + 1));

    signals.forEach((signal, index) =>
    {
      const sensor = makeSensor(index, chart.wasmContext, this.timelineAxis.id, signal);
      chart.sciChartSurface.yAxes.add(sensor.axis);
      chart.sciChartSurface.renderableSeries.add(sensor.line);
      chart.sciChartSurface.annotations.add(...sensor.annotations);

      this.sensors.push(sensor);
    });

    this.loadAnnotations(edf.annotations);

    this.overviewTimelineChartModifier = new OverviewTimelineChartModifier(this);

    SciChartOverview.create
    (
      chart.sciChartSurface,
      "overview",
      {
        customRangeSelectionModifier: this.overviewTimelineChartModifier,
        mainAxisId: this.timelineAxis.id,
        secondaryAxisId: this.sensors[0].id,
        theme: new SciChartJsNavyTheme()
      }
    );
  }

  //
  // \brief
  //   Load the annotations so that the users see the point-in-time of the annotation.
  //
  // \todo
  //   1 - Add a tooltip so that hovering on the icon displays the text.
  //   2 - Indicate when there are many notes at a given point-in-time.
  //   3 - On a double-click either to:
  //         a) Navigate to point-in-time with an option to pause playback.
  //         b) Open the text.
  //   4 - Investigate placing a tiny representation (i.e. tiny icon or dot) of
  //       these annotations within the overview.
  //   5 - Add a view (with a tab) on the side that has all the annotations.
  //         a) Displayed as a vertical timeline.
  //             See Flowbite's grouped timeline https://flowbite.com/docs/components/timeline/
  //         b) This tab can be shown/hidden.
  //         c) Selecting (double-click) brings the chart & video to that point in time.
  //   6 - Discuss with team on how to represent a span.
  //         a) In horizontal timeline annotations with a span
  //            - Are placed above all punctual annotations.
  //            - A annotation spans which begins earlier are above annotation spans that begin
  //              later.
  //            - When annotation spans that begin at the same time then the ones that ends later
  //              is placed above the others.
  //         b) In horizontal timeline.
  //
  loadAnnotations(annotations)
  {
    annotations.forEach((annotation) =>
    {
      annotation.notes.forEach((note) =>
      {
        const chartAnnotation = new AxisMarkerAnnotation
                                    (
                                      {
                                        image: annotationImageElement,
                                        imageHeight: 30,
                                        imageWidth: 30,
                                        isEditable: false,
                                        horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
                                        verticalAnchorPoint: EVerticalAnchorPoint.Top,
                                        xAxisId: this.timelineAxis.id,
                                        x1: annotation.startTime
                                      }
                                    );

        // const chartAnnotation = new CustomAnnotation(
        //                        {
        //                          isEditable: false,
        //                          horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
        //                          verticalAnchorPoint: EVerticalAnchorPoint.Top,
        //                          xAxisId: this.timelineAxis.id,
        //                          x1: annotation.startTime
        //                        });

        // const svgDetails =
        //         `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        //           <image href="res/images/annotation.png" height="200" width="200" />
        //         </svg>`;

        // chartAnnotation.setSvg(svgDetails);
        chart.sciChartSurface.annotations.add(chartAnnotation);
      });
    });
  }

  bindTimelineController(timelineController: timeline_controller.ITimelineController) {
    this.timelineChartModifier.timelineController = timelineController;
    this.overviewTimelineChartModifier.timelineController = timelineController;
  }

  get currentTimePoint() {
    return this.timelineIndicator.x1;
  }

  //
  // Set the chart's current point-in-time.
  //
  // \note
  //   When the timepoint isn't within the chart's visible range limit then the timestamp is
  //   revised to be within the nearest valid point-in-time.
  //
  //   Additionally, the chart's visible range is revised accordingly so that the current
  //   point-in-time is visible in the chart.
  //
  //   While the user is navigating the chart's timeline, or that of the overview, when the
  //   code detects that they are done with navigating the timeline it sets the chart's
  //   onFinishChartTimelineNavigation callback shall be invoked after setting the chart's
  //   current point-in-time and has notified the timeline's subscriptions. Thus, restoring
  //   timeline controller's playback to what it was beforehand.
  //
  set currentTimePoint(timePoint: number) {
    const startTimePoint = this.startTimePoint;
    const finishTimePoint = this.finishTimePoint;

    const revisedTimepoint = Math.max(Math.min(timePoint, finishTimePoint),
                                      startTimePoint);

    this.timelineIndicator.x1 = revisedTimepoint;

    const visibleRangeDistance = this.timelineAxis.visibleRange.max - this.timelineAxis.visibleRange.min;

    const x1 = Math.max(startTimePoint, revisedTimepoint - visibleRangeDistance/2);
    const x2 = Math.min(x1 + visibleRangeDistance, finishTimePoint);

    this.timelineAxis.visibleRange = new NumberRange(Math.min(x1, x2 - visibleRangeDistance), x2);

    const event =
          {
            currentTimePoint: this.currentTimePoint,
            currentTimeOffset: this.currentTimeOffset
          };

    this.timelineChangesSubscriptions.forEach((subscription) => subscription(event));

    this.onFinishChartTimelineNavigation?.();
    this.onFinishChartTimelineNavigation = undefined;
  }

  public get currentTimeOffset() {
    return this.currentTimePoint - this.startTimePoint;
  }

  //
  // Get the chart's starting point-in-time.
  //
  // \todo
  //   Adapt to use the recording start point-in-time rather than the chart's visible range limit.
  //
  public get startTimePoint() {
    return this.timelineAxis.visibleRangeLimit.min;
  }

  //
  // Get the chart's finishing point-in-time.
  //
  // \todo
  //   Adapt to use the recording start point-in-time rather than the chart's visible range limit.
  //
  public get finishTimePoint() {
    return this.timelineAxis.visibleRangeLimit.max;
  }

  //
  // Set the chart's current point-in-time to a time offset relative to the chart's starting or
  // finishing points-in-time.
  //
  // \note
  //   When the time offset is positive value, then set the chart's current point-in-time relative
  //   to the chart's starting point-in-time.
  //
  //   Otherwise, set the chart's current point-in-time relative to the chart's finishing
  ///  point-in-time.
  //
  set currentTimeOffset(timeOffset) {
    const timePoint = (timeOffset >= 0)
                    ? timeOffset + this.startTimePoint
                    : this.finishTimePoint + timeOffset;

    this.currentTimePoint = timePoint;
  }

  //
  // Indicate if the data of the given point-in-time is loaded within the chart.
  //
  // \todo
  //   This approach isn't practical when users skip to a later point-in-time or when they
  //   configure playback rate faster than the rate in which the data is being loaded into
  //   the chart by the worker tasks.
  //
  //   Need to determine when data of the given point-in-time is still pending.
  //
  isTimePointLoaded(timePoint) {
    return (timePoint >= this.startTimePoint &&
            timePoint <  this.finishTimePoint);
  }

  //
  // Indicate if the chart's current point-in-time is ready for playback.
  //
  // \note
  //   When the data for the chart's current point-in-time has been loaded into the chart, then
  //   the chart is ready for playback. Otherwise, playback shall not proceed until the data of
  //   the chart's current point-in-time is loaded.
  //
  get isReadyForPlayback() {
    return this.isTimePointLoaded(this.currentTimePoint);
  }

  //
  // Get the chart's remaining time by offset relative to the end of the chart's timeline.
  //
  // \note
  //   This is practical to indicate to suspend the playback of the video in a live feed
  //   scenario.
  //
  get remainingTimeOffset() {
    return this.finishTimePoint - this.currentTimePoint;
  }

  //
  // \brief
  //   Shift the chart's current point-in-time by the given time offset.
  //
  shiftCurrentTimePoint(timeOffset) {
    this.currentTimePoint = this.currentTimePoint + timeOffset;
  }

  //
  // \brief
  //   Callback that is invoked when the chart's timeline visible range has changed.
  //
  // \note
  //   In most situations this updates chart's current time to the mid-point within within the
  //   chart's visible range such that the timeline's vertical indicator appears at the middle of
  //   the chart's visible range.
  //
  //   However, when the user navigates towards the chart timeline's boundary that needs a solution
  //   as described below.
  //
  //   When there are subscriptions listening for changes to the chart's current time, such as when a
  //   user is using the chart to navigating the timeline, then those subscriptions' callbacks are
  //   invoked with the corresponding current time offset.
  //
  // \todo
  //   1. As the user navigates the chart's timeline towards a boundary, see how to make it appear
  //      as if timeline's vertical indicator shifts towards the boundary while the timeline's
  //      visible range remains the same.
  //
  //      Hint: The possible solution might be within the chart modifiers to intercept the user
  //            interactions as they are horizontally scrolling the timeline.
  //
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTimelineVisibleRangeChanged(_args: VisibleRangeChangedArgs) {
    this.currentTimePoint = (this.timelineAxis.visibleRange.min + this.timelineAxis.visibleRange.max)/2;
  }

  //
  // \brief
  //   Subscribe to get notifications about changes to the chart's current time.
  //
  subscribeToTimelineChanges(subscription) {
    this.timelineChangesSubscriptions.add(subscription);
  }

  //
  // \brief
  //   Unsubscribe from getting notifications about changes to the chart's current time.
  //
  unsubscribeToTimelineChanges(subscription) {
    this.timelineChangesSubscriptions.delete(subscription);
  }

  /**
   * Expands the chart's visible timeline range limits.
   *
   * @param dateTimeRange - Range to which to expand the timeline axis.
   *
   * @returns true When the timeline axis was expanded. Otherwise false.
   *
   * @remarks
   *   This is used in conjunction to loading data into the chart so that the data that is loaded
   *   is within the chart's visible range.
   */
  expandTimelineAxis(dateTimeRange: date_time.DateTimeRange) {
    const dateTimeMin = dateTimeRange.min.getTime();
    const dateTimeMax = dateTimeRange.max.getTime();

    if (dateTimeMin >= this.timelineAxis.visibleRangeLimit.min &&
        dateTimeMax <= this.timelineAxis.visibleRangeLimit.max) {
      return false;
    }

    this.timelineAxis.visibleRangeLimit =
      new NumberRange(
        Math.min(dateTimeMin, this.timelineAxis.visibleRangeLimit.min),
        Math.max(dateTimeMax, this.timelineAxis.visibleRangeLimit.max)
      );

    return true;
  }

  //
  // \brief
  //   Load data into the chart.
  //
  // \note
  //   There is guard to ensure that the EDF representation hasn't already been loaded.
  //   When it has then it's reported in the log and the request to load the EDF is ignored.
  //
  // \todo
  //   Maintain a list of time-ranges that are present in the chart's current representation.
  //   This allows for the for loading the EDF representation in an out-of-sequence manner which
  //   becomes practical in the following scenarios:
  //     (a) Some ranges failed to upload by the app, whereas later ranges were uploaded.
  //
  //     (b) Add the capability to offload ranges from the chart's current representation for
  //         memory resources and performance reasons as to keep a window of time.
  //
  //     (c) Advanced feature in which users only loading points in time which are useful/
  //         meaningful. Such as load only ranges in which a seizure occurred with 15 minutes
  //         before and after those events.
  //
  //           - The chart's U/I we'd need represent those time ranges which aren't accounted
  //             for such as having multiple visible ranges limits and jumping from one to
  //             another using tabs (or even collapsing that range of time).
  //
  loadFromEDF(edf)
  {
    console.log(`Loading the data into the chart. chart_start_time: ${timestampToISOString(this.timelineAxis.visibleRangeLimit.min)}, chart_finish_time: ${timestampToISOString(this.timelineAxis.visibleRangeLimit.max)}, edf_start_time: ${edf.recordingStartTime.toISOString()}, edf_finish_time: ${edf.recordingFinishTime.toISOString()}.`);

    const dateTimeRange =
          {
            min: edf.recordingStartTime,
            max: edf.recordingFinishTime
          };

    this.expandTimelineAxis(dateTimeRange);
    // if (!this.expandTimelineAxis(dateTimeRange))
    // {
    //   console.log('That time-range is already loaded within the chart.');
    //   return;
    // }

    edf.signals.forEach((signal) =>
    {
      const sensor = this.sensors.find((sensor) => sensor.label === signal.label);
      if (sensor)
      {
        loadSignalRecordsIntoDataSeries(signal.records, sensor.dataSeries);
      }
    });

    this.loadAnnotations(edf.annotations);

    //
    // If the timeline controller suspended playback due to reaching a limit
    // then verify if it can be resumed.
    //
  }
}


//
//
//

function bindAnnotation(axis,
                        annotation,
                        offset: number): void {
  annotation.y1 = axis.visibleRange.max + offset;
  annotation.y2 = annotation.y1;

  axis.visibleRangeChanged.subscribe((args) => {
    annotation.y1 = args.visibleRange.max + offset;
    annotation.y2 = annotation.y1;
  });
}

function makeTimelineRange(range: date_time.DateTimeRange): NumberRange {
  return new NumberRange(range.min.getTime(), range.max.getTime());
}

function makeTimelineRangeWithDuration(dateTime: Date,
                                       rangeDuration: duration.Duration = duration.secondsToDuration(30)): NumberRange {
  return (rangeDuration >= 0)
       ? makeTimelineRange({ min: dateTime, max: new Date(dateTime.getTime() + rangeDuration) })
       : makeTimelineRange({ min: new Date(dateTime.getTime() + rangeDuration), max: dateTime });
}

function makeTimelineRangeWindow(duration_x: duration.Duration = duration.minutesToDuration(1)) {
  return new NumberRange(duration.secondsToDuration(1), duration_x);
}

function makeTimelineAxis(wasmContext,
                          dateTimeRange: date_time.DateTimeRange,
                          viewDuration: duration.Duration = duration.secondsToDuration(30)) {
  return new NumericAxis
             (
               wasmContext,
               {
                 id: "timeline",
                 autoRange: EAutoRange.Never,
                 axisAlignment: EAxisAlignment.Top,
                 axisTitle: "",
                 autoTicks: false,
                 dataIsSortedInX: false,
                 isSorted: false,
                 labelProvider: new TimelineLabelProvider(),
                 majorDelta: minutesToDuration(1),
                 majorGridLineStyle: { strokeThickness: 2, color: '#F3FA2A' },
                 minorDelta: secondsToDuration(1),
                 minorGridLineStyle: { strokeThickness: 2, color: '#050505' },
                 visibleRange: makeTimelineRangeWithDuration(dateTimeRange.min, viewDuration),
                 visibleRangeSizeLimit: makeTimelineRangeWindow(viewableDuration),
                 visibleRangeLimit: makeTimelineRange(dateTimeRange),
                 possibleDeltas:
                 [
                   0.001,
                   0.002,
                   0.005,
                   0.01,
                   0.02,
                   0.05,
                   0.1,
                   0.2,
                   0.5,
                   1,
                   2,
                   5,
                   10,
                   15,
                   30,
                   60
                 ]
               }
             );
}

function loadSignalRecordsIntoDataSeries(records: Records,
                                         dataSeries: XyDataSeries): void {
  const stride = records[0].samples.length;
  const count = records.length * stride;
  const xValues = Array<number>(count);
  const yValues = Array<number>(count);

  records.forEach((record, recordIndex) => {
    record.samples.forEach((sample, sampleIndex) => {
      const index = recordIndex * stride + sampleIndex;
      xValues[index] = sample.time;
      yValues[index] = sample.value;
    });
  });

  if (xValues.length === 0) {
    return;
  }

  const dateTimeRange = {
                          min: xValues[0],
                          max: xValues[xValues.length - 1],
                        };

  if (!dataSeries.hasValues || dateTimeRange.min >= dataSeries.xRange.max) {
    dataSeries.appendRange(xValues, yValues);
  }
  else if (dateTimeRange.max <= dataSeries.xRange.min) {
    dataSeries.insertRange(0, xValues, yValues);
  }
}

function makeGraphSeparator(timelineAxisId: string,
                            sensor): LineAnnotation {
  const separator =
          new LineAnnotation({
                x1: 0,
                x2: 1,
                xCoordinateMode: ECoordinateMode.Relative,
                stroke: "#757575",
                strokeThickness: 2,
                xAxisId: timelineAxisId,
                yAxisId: sensor.axis.id
              });

  bindAnnotation(sensor.axis, separator, 0);

  return separator;
}

function makeSensor(index: number,
                    wasmContext,
                    timelineAxisId: string,
                    signal) {
  const sensor = {
          id: signal.label,
          label: signal.label
        };

  const physicalDistance = (signal.physicalMaximum - signal.physicalMinimum);
  const physicalMidpoint = signal.physicalMinimum + (physicalDistance / 2);
  const visibleSegment   = physicalDistance / 16;

  sensor.axis =
      new NumericAxis
          (
            wasmContext,
            {
              id: sensor.id,
              axisTitle: "",
              axisAlignment: EAxisAlignment.Left,
              autoRange: EAutoRange.Always,
              maxAutoTicks: 5,
              visibleRange: new NumberRange(physicalMidpoint - visibleSegment, physicalMidpoint + visibleSegment)
            }
          );

  const labelAnnotation =
    new TextAnnotation({
          text: sensor.label,
          x: 0.0,
          y: 0.0,
          xAxisId: timelineAxisId,
          yAxisId: sensor.axis.id,
          xCoordinateMode: ECoordinateMode.Relative,
          yCoordinateMode: ECoordinateMode.DataValue
        });

  bindAnnotation(sensor.axis, labelAnnotation, -0.5);

  sensor.annotations = [labelAnnotation];

  if (index > 0) {
    sensor.annotations.push(makeGraphSeparator(timelineAxisId, sensor));
  }

  sensor.dataSeries = new XyDataSeries(
                            wasmContext,
                            {
                              dataIsSortedInX: false,
                              isSorted: false,
                              containsNaN: false
                            });

  sensor.line =
      new FastLineRenderableSeries(
            wasmContext,
            {
              dataSeries: sensor.dataSeries,
              xAxisId: timelineAxisId,
              yAxisId: sensor.axis.id,
              stroke: "#50C7E0",
              strokeThickness: 3
            }
          );

  loadSignalRecordsIntoDataSeries(signal.records, sensor.dataSeries);

  return sensor;
}
