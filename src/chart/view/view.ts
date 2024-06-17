
import { TimelineChartModifier } from "./timeline_chart_modifier";
import { TimelineLabelProvider } from "./timeline_label_provider";
import {
  IChartViewTimelineNavigation,
  RestoreTimelineNavigationBehavior
} from "./types";

import { TimelineOverviewModifier } from "./timeline_overview_modifier";

import * as eeg_readings from '../../models/eeg_readings';
import * as date_time from '../../utilities/date_time';
import * as duration from '../../utilities/duration';
import * as timeline_controller from '../../timeline_controller';

import annotationImage from '../../../public/img/annotation.png';

import {
  AxisMarkerAnnotation,
  EAutoRange,
  EAxisAlignment,
  ECoordinateMode,
  EExecuteOn,
  ELabelPlacement,
  EXyDirection,
  FastLineRenderableSeries,
  LineAnnotation,
  MouseWheelZoomModifier,
  NumberRange,
  RubberBandXyZoomModifier,
  SciChartJsNavyTheme,
  TextAnnotation,
  VerticalLineAnnotation,
  XAxisDragModifier,
  XyDataSeries,
  YAxisDragModifier,
  ZoomPanModifier,
  ZoomExtentsModifier,
  VisibleRangeChangedArgs,
  AnnotationBase
} from 'scichart';

import { NumericAxis } from 'scichart/Charting/Visuals/Axis/NumericAxis';
import { SciChartOverview } from 'scichart/Charting/Visuals/SciChartOverview';
import { SciChartSurface, TWebAssemblyChart } from 'scichart/Charting/Visuals/SciChartSurface';

import { TSciChart } from 'scichart/types/TSciChart';

import { createImageAsync } from 'scichart/utils/imageUtil';

/**
 * The chart view are the the readings displayed to users for a given interval range of time.
 *
 * @remarks
 *   This chart view relies on SciChart.js which provides the U/X charting capabilities required
 *   to present users with the readings which includes interactivity capabilities such as scrolling
 *   zooming, and panning.
 *
 *   Additionally, this chart view coordinates with a timeline controller so that the time
 *   controller can ensure that this chart view and video view are in sync with the point-in-time
 *   that is presented to users. Such that the readings for the chart's current point-in-time
 *   corresponds to that in the video view.
 */
export class ChartView implements timeline_controller.ITimelineChartController,
                                  IChartViewTimelineNavigation {
  readonly sourceId: timeline_controller.SourceId = 1;

  private readonly chart: TWebAssemblyChart;
  private readonly timelineAxis: NumericAxis;
  private readonly timelineIndicator: VerticalLineAnnotation;

  private timelineController: timeline_controller.ITimelineController;
  private onRestorePlayback?: timeline_controller.RestorePlayback;
  private restoreBehavior?: RestoreTimelineNavigationBehavior;

  constructor(chart: TWebAssemblyChart,
              timelineController: timeline_controller.ITimelineController) {
    this.chart = chart;
    this.timelineController = timelineController;

    this.timelineAxis = makeTimelineAxis(this.chart.wasmContext,
                                         this.timelineController.timeRange);

    this.timelineAxis.visibleRangeChanged.subscribe((args) =>
      this.onTimelineVisibleRangeChanged(args));

    this.timelineIndicator = new VerticalLineAnnotation({
                                   axisLabelFill: "#f3fa2a",
                                   axisFontSize: 30,
                                   labelPlacement: ELabelPlacement.Top,
                                   showLabel: true,
                                   stroke: "#f3fa2a",
                                   strokeThickness: 5,
                                   xAxisId: this.timelineAxis.id,
                                   x1: this.timelineController.currentTime
                                 });

    this.chart.sciChartSurface.xAxes.add(this.timelineAxis);
    this.chart.sciChartSurface.annotations.add(this.timelineIndicator);

    this.chart.sciChartSurface.chartModifiers.add(
      // new AnnotationTooltipModifier(),
      new TimelineChartModifier(this),
      new YAxisDragModifier(),
      new XAxisDragModifier(),
      new RubberBandXyZoomModifier( { xyDirection: EXyDirection.XDirection, executeOn: EExecuteOn.MouseRightButton } ),
      new MouseWheelZoomModifier( { xyDirection: EXyDirection.XDirection } ),
      new ZoomExtentsModifier(),
      new ZoomPanModifier()
    );

    // const edf = new EDF(buffer);

    //
    // \todo Steven Belbin
    //   Limit to the first 8 channels.
    //   However, this should selected based on the view.
    //
    // const signals = edf.signals
    //                    .slice(0, Math.min(8, edf.signals.length + 1));

    // signals.forEach((signal, index) =>
    // {
    //   const sensor = makeSensor(index, chart.wasmContext, this.timelineAxis.id, signal);
    //   chart.sciChartSurface.yAxes.add(sensor.axis);
    //   chart.sciChartSurface.renderableSeries.add(sensor.line);
    //   chart.sciChartSurface.annotations.add(...sensor.annotations);

    //   this.sensors.push(sensor);
    // });

    // this.loadAnnotations(edf.annotations);

    SciChartOverview.create(
      this.chart.sciChartSurface,
      "overview",
      {
        customRangeSelectionModifier: new TimelineOverviewModifier(this),
        mainAxisId: this.timelineAxis.id,
        // secondaryAxisId: this.sensors[0].id,
        theme: new SciChartJsNavyTheme()
      }
    );

    this.timelineController.addChart(this);
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
  public loadAnnotations(annotations: eeg_readings.Annotations): void {
    annotations.forEach((annotation) => {
      annotation.notes.forEach((note) => {
        const chartAnnotation = new AxisMarkerAnnotation({
                                        image: annotationImageElement,
                                        imageHeight: 30,
                                        imageWidth: 30,
                                        isEditable: false,
                                        // horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
                                        // verticalAnchorPoint: EVerticalAnchorPoint.Top,
                                        xAxisId: this.timelineAxis.id,
                                        x1: annotation.timeRange.min
                                    });

        console.debug(`Added the note of ${note}.`);

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
        this.chart.sciChartSurface.annotations.add(chartAnnotation);
      });
    });
  }

  /**
   *
   * @param definitions - The definitions
   */
  public loadDefinitions(definitions: eeg_readings.SignalDefinitions): void {
    definitions.forEach((definition) => loadDefinition(this.chart, definition));
  }

  public loadSegment(segment: eeg_readings.Segment) {
    segment.samples.forEach((sample) => {
      const dataSeries = findDataSeries(this.chart.sciChartSurface, sample.signalId);

      if (dataSeries) {
        if (!dataSeries.hasValues || dataSeries.xRange.max < segment.timeRange.min) {
          dataSeries.appendRange(sample.timePoints, sample.values);
        }
        else if (dataSeries.xRange.min > segment.timeRange.max) {
          dataSeries.insertRange(0, sample.timePoints, sample.values);
        }
      }
    });

    this.loadAnnotations(segment.annotations);

    this.expandTimeline(segment.timeRange);
  }

  public startTimelineNavigation(): void {
    this.onRestorePlayback = this.timelineController.startTimelineNavigation(this.sourceId);
  }

  public stopTimelineNavigation(restoreBehavior: RestoreTimelineNavigationBehavior): void {
    this.restoreBehavior = restoreBehavior;
    this.restorePlayback(RestoreTimelineNavigationBehavior.Immediate);
  }

  /**
   * ITimelineChartController interface.
  */

  /**
   * Get the chart view's current time.
   */
  get currentTime(): date_time.TimePoint {
    return this.timelineIndicator.x1;
  }

  /**
   * Set the chart view's current time.
   *
   * @remarks
   *   When the given point-in-time isn't within the chart view's visible range limit then the
   *   given point-in-time is revised to be within the timeline's range.
   *
   *   Additionally, the chart view's visible range is revised such that the current time remains
   *   within the chart view's visible range. In particular within the mid-point of that range.
   *
   *   When a user interacts with the chart view's in order to start navigating its timeline, then
   *   the chart view notifies the timeline controller that it's effectively becoming the timeline
   *   controller's source feed. Therefore as the user shifts chart's view current time, then this
   *   chart view issues a notification the timeline controller of that current time at which point
   *   the timeline controller is responsible to synchronize the others views such the video to that
   *   point-in-time.
   *
   *   Once that the user is no longer interacts with the chart view, such as by releasing the
   *   mouse-button, then the timeline controller's state is restored to what it was prior to at
   *   the prior to the moment when the user began interacting with the chart view.
   */
  set currentTime(timePoint: date_time.TimePoint) {
    const startTime = this.startTime;
    const finishTime = this.finishTime;

    const revisedTimepoint = Math.max(Math.min(timePoint, finishTime),
                                      startTime);

    this.timelineIndicator.x1 = revisedTimepoint;

    const visibleRangeDistance = this.timelineAxis.visibleRange.max - this.timelineAxis.visibleRange.min;

    const x1 = Math.max(startTime, revisedTimepoint - visibleRangeDistance/2);
    const x2 = Math.min(x1 + visibleRangeDistance, finishTime);

    this.timelineAxis.visibleRange = new NumberRange(Math.min(x1, x2 - visibleRangeDistance), x2);

    this.timelineController.onChangeCurrentTime({
      sourceId: this.sourceId,
      timePoint: this.currentTime,
      timeOffset: this.currentTimeOffset
    });

    this.restorePlayback(RestoreTimelineNavigationBehavior.Deferred);
  }

  /**
   * Get the chart's view current time-offset relative to it's start time.
  */
  public get currentTimeOffset() : duration.Duration {
    return this.currentTime - this.startTime;
  }

  /**
   * Set the chart's view current time-offset relative to it's starting/finishing points-in-time.
   *
   * @remarks
   *   When the given time-offset is a positive value, then the chart view's current time
   *   is it's relative to it's start time plus the given time-offset.
   *
   *   Otherwise, when the given time-offset is a negative value, then the chart view's current
   *   point-in-time is it's relative to it's finishing point-in-time minus the given time-offset.
  */
  set currentTimeOffset(timeOffset: duration.Duration) {
    const timePoint = (timeOffset >= 0)
                    ? timeOffset + this.startTime
                    : this.finishTime + timeOffset;

    this.currentTime = timePoint;
  }

  /**
   * Get the chart view's remaining time-offset relative to it's finishing point-in-time.
   *
   * @remarks
   *   Practical to suspend playback when there isn't any remaining time.
  */
  public get remainingTimeOffset(): duration.Duration {
    return this.finishTime - this.currentTime;
  }

  /**
   * Get the chart's view start time.
   *
   * @todo
   *   This is based on the chart view's visible range. However, that needs to change
   *   to be the start time of the recording session.
  */
  public get startTime(): date_time.TimePoint {
    return this.timelineAxis.visibleRangeLimit.min;
  }

  /**
   * Get the chart's view finishing point-in-time.
   *
   * @remarks
   *   In the case of a live-feed recording session, then this is the point-in-time which is
   *   available to fetch the EEG readings. Typically, it's close to the current time.
   *
   * @todo
   *   This is based on the chart view's visible range. However, that needs to change
   *   to be the finishing point-in-time of the recording session or the latest point-in-time
  */
  public get finishTime(): date_time.TimePoint {
    return this.timelineAxis.visibleRangeLimit.max;
  }

  /**
   * Indicate if the chart view's current time is ready for playback.
   *
   * @remarks
   *   When the data for the chart view's current time is loaded into its data-series,
   *   then the chart view is ready for playback. Otherwise, playback is suspended until the data
   *   of each of its data-series are loaded at which point the chart view is ready for playback.
  */
  public get isReadyForPlayback(): boolean {
    return this.isTimePointLoaded(this.currentTime);
  }

  /**
   * Shifts the chart view's current time by a given amount.
   *
   * @param shiftAmount : The amount of time to shift by.
   *
   * @returns The chart view's revised current time and time-offset.
   *
   * @remarks
   *   The shift amount can be negative to be an earlier moment.
  */
  public shiftCurrentTime(shiftAmount: duration.Duration): timeline_controller.ChangeCurrentTime {
    this.currentTime = this.currentTime + shiftAmount;

    return {
             timeOffset: this.currentTimeOffset,
             timePoint: this.currentTime
           }
  }

  /**
   * Indicate if the data of the given point-in-time is loaded within the chart.
   *
   * @remarks
   *   This is determined by inspecting the timeline's point-in-time range to verify if the given
   *   point-in-time is within that range. The premise is that there aren't any gaps within the
   *   timeline.
   *
   * @todo
   *   Might have to consider a mechanism which allows gaps to exist, since if users were to jump
   *   to varying points-in-time which aren't contiguous at a frequent pace then this might
   *   introduce gaps once we add a mechanism to unload a leading or trailing segments.
  */
  private isTimePointLoaded(timePoint: date_time.TimePoint): boolean {
    const timeRange = this.timelineAxis.getMaximumRange();

    return (timePoint >= timeRange.min &&
            timePoint <= timeRange.max);
  }

  /**
   * Callback that is invoked when the timeline's visible range has changed.
   *
   * @param args : The revised chart's visible range or undefined.
   *
   * @remarks
   *   Whenever there is a change to the timeline's visible range we'll re-compute the chart view's
   *   current time is position at the mid-point of the visible range.
   *
   * @todo
   *   The above of placing the chart view's current time positioned at the mid-point
   *   works for the majority cases except  when users interact with the chart view to navigate the
   *   timeline but have reached the start time or finishing/latest point-in-time.
   *
   *   In those situations the mid-point position cannot be used, rather a different computation is
   *   required as to shift the chart view's current time. Probably by detecting the mouse
   *   movements for horizontal displacements then computing a time-offset based on that.
  */
  private onTimelineVisibleRangeChanged(args?: VisibleRangeChangedArgs): void {
    const visibleRange = (args)
                       ? args.visibleRange
                       : this.timelineAxis.visibleRange;

    this.currentTime = (visibleRange.min + visibleRange.max)/2;
  }

  /**
   * Expands the chart's visible timeline range limits.
   *
   * @param timeRange - Time range to which to expand the timeline.
   */
  private expandTimeline(timeRange: date_time.TimePointRange): void {
    if (timeRange.min >= this.timelineAxis.visibleRangeLimit.min &&
        timeRange.max <= this.timelineAxis.visibleRangeLimit.max) {
      return;
    }

    this.timelineAxis.visibleRangeLimit =
      new NumberRange(
        Math.min(timeRange.min, this.timelineAxis.visibleRangeLimit.min),
        Math.max(timeRange.max, this.timelineAxis.visibleRangeLimit.max)
      );
  }

  /**
   * Restore the timeline controller's playback to its prior state, only when the
   * the restore behavior matches the given restore behavior.
   *
   * @param matchBehavior - The restore behavior to match against.
   *
   * @remarks
   *   When the behaviors match, then the playback callback is invoked and the
   *   member variables are reset.
   */
  private restorePlayback(matchBehavior: RestoreTimelineNavigationBehavior): void {
    if (this.restoreBehavior === matchBehavior) {
      this.onRestorePlayback?.();
      this.onRestorePlayback = undefined;
      this.restoreBehavior = undefined;
    }
  }
}

let annotationImageElement: HTMLImageElement | undefined;

export async function loadAnnotationImage() {
  annotationImageElement = await createImageAsync(annotationImage);
}

//
// Internal functions.
//

function bindAnnotation(axis: NumericAxis,
                        annotation: AnnotationBase,
                        offset: number): void {
  annotation.y1 = axis.visibleRange.max + offset;
  annotation.y2 = annotation.y1;

  axis.visibleRangeChanged.subscribe((args) => {
    if (!args) return;

    annotation.y1 = args.visibleRange.max + offset;
    annotation.y2 = annotation.y1;
  });
}

function makeTimelineRangeWithDuration(timePoint: date_time.TimePoint,
                                       rangeDuration: duration.Duration = duration.secondsToDuration(30)): NumberRange {
  return (rangeDuration >= 0)
       ? new NumberRange(timePoint, timePoint + rangeDuration)
       : new NumberRange(timePoint + rangeDuration, timePoint);
}

function makeTimelineRangeWindow(rangeDuration: duration.Duration = duration.minutesToDuration(1)): NumberRange {
  return new NumberRange(duration.secondsToDuration(1), rangeDuration);
}

function makeTimelineAxis(wasmContext: TSciChart,
                          timeRange: date_time.TimePointRange,
                          viewDuration: duration.Duration = duration.secondsToDuration(30)) : NumericAxis {
  return new NumericAxis(
               wasmContext,
               {
                 id: "timeline",
                 autoRange: EAutoRange.Never,
                 axisAlignment: EAxisAlignment.Top,
                 axisTitle: '',
                 autoTicks: false,
                 labelProvider: new TimelineLabelProvider(),
                 majorDelta: duration.minutesToDuration(1),
                 majorGridLineStyle: { strokeThickness: 2, color: '#F3FA2A' },
                 minorDelta: duration.secondsToDuration(1),
                 minorGridLineStyle: { strokeThickness: 2, color: '#050505' },
                 visibleRange: makeTimelineRangeWithDuration(timeRange.min, viewDuration),
                 visibleRangeSizeLimit: makeTimelineRangeWindow(viewDuration),
                 visibleRangeLimit: new NumberRange(timeRange.min, timeRange.max)
               }
             );
}

function makeGraphSeparator(timelineAxisId: string,
                            axis: NumericAxis): LineAnnotation {
  const separator =
          new LineAnnotation({
                x1: 0,
                x2: 1,
                xCoordinateMode: ECoordinateMode.Relative,
                stroke: "#757575",
                strokeThickness: 2,
                xAxisId: timelineAxisId,
                yAxisId: axis.id
              });

  bindAnnotation(axis, separator, 0);

  return separator;
}

function loadDefinition(chart: TWebAssemblyChart,
                       definition: eeg_readings.SignalDefinition): void {
  const physicalDistance = definition.physicalRange.max - definition.physicalRange.min;
  const physicalMidpoint = definition.physicalRange.min + (physicalDistance / 2);
  const visibleSegment   = physicalDistance / 16;

  const axis =
      new NumericAxis(
            chart.wasmContext,
            {
              id: definition.id,
              axisTitle: '',
              axisAlignment: EAxisAlignment.Left,
              autoRange: EAutoRange.Always,
              maxAutoTicks: 5,
              visibleRange: new NumberRange(physicalMidpoint - visibleSegment, physicalMidpoint + visibleSegment)
            }
          );

  const timelineAxisId = chart.sciChartSurface.xAxes.get(0).id;

  const labelAnnotation =
    new TextAnnotation({
          text: definition.label,
          // x: 0.0,
          // y: 0.0,
          xAxisId: timelineAxisId,
          yAxisId: axis.id,
          xCoordinateMode: ECoordinateMode.Relative,
          yCoordinateMode: ECoordinateMode.DataValue
        });

  bindAnnotation(axis, labelAnnotation, -0.5);

  const annotations = new Array<AnnotationBase>();

  annotations.push(labelAnnotation);

  if (chart.sciChartSurface.yAxes.size() > 0) {
    annotations.push(makeGraphSeparator(timelineAxisId, axis));
  }

  const dataSeries = new XyDataSeries(
                            chart.wasmContext,
                            {
                              dataIsSortedInX: false,
                              isSorted: false,
                              containsNaN: false
                            });

  const line = new FastLineRenderableSeries(
                     chart.wasmContext,
                     {
                       dataSeries: dataSeries,
                       xAxisId: timelineAxisId,
                       yAxisId: axis.id,
                       stroke: "#50C7E0",
                       strokeThickness: 3
                     }
                   );

  chart.sciChartSurface.renderableSeries.add(line);

  chart.sciChartSurface.annotations.add(...annotations);
}

function findDataSeries(chartSurface: SciChartSurface,
                        signalId: eeg_readings.SignalId): XyDataSeries | undefined {
  const series = chartSurface.renderableSeries.getById(signalId);

  return (series.dataSeries instanceof XyDataSeries)
       ? series.dataSeries as XyDataSeries
       : undefined;
}
