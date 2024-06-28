
import { TimelineChartModifier } from './timeline_chart_modifier';
import { TimelineLabelProvider } from './timeline_label_provider';
import { TimelineOverviewModifier } from './timeline_overview_modifier';
import { IChartViewTimelineNavigation } from './types';

import * as eeg_readings from '../../models/eeg_readings';
import * as date_time from '../../utilities/date_time';
import * as duration from '../../utilities/duration';
import * as timeline_controller from '../../timeline_controller';

import annotationImage from '/img/annotation.png';

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
  TextAnnotation,
  VerticalLineAnnotation,
  XAxisDragModifier,
  XyDataSeries,
  YAxisDragModifier,
  ZoomPanModifier,
  ZoomExtentsModifier,
  VisibleRangeChangedArgs,
  AnnotationBase,
  XyScatterRenderableSeries,
  LeftAlignedOuterVerticallyStackedAxisLayoutStrategy,
  SciChartJsNavyTheme
} from 'scichart';

import { NumericAxis } from 'scichart/Charting/Visuals/Axis/NumericAxis';
import { SciChartOverview } from 'scichart/Charting/Visuals/SciChartOverview';
import { TWebAssemblyChart } from 'scichart/Charting/Visuals/SciChartSurface';

import { TSciChart } from 'scichart/types/TSciChart';

import { createImageAsync } from 'scichart/utils/imageUtil';

const textLabelOffset = -2.0;

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
  readonly sourceId: timeline_controller.SourceId;

  public readonly chart: TWebAssemblyChart;
  private readonly timelineAxis: NumericAxis;
  private readonly timelineIndicator: VerticalLineAnnotation;

  private readonly timelineController: timeline_controller.ITimelineController;
  private onRestorePlayback?: timeline_controller.RestorePlayback;
  private definitions?: eeg_readings.SignalDefinitions;
  private readonly annotationDataSeries: XyDataSeries;
  private dataSeries: XyDataSeries[] = [];

  private chartOverview?: SciChartOverview;

  private isVisibleRangeChanging: boolean = false;

  constructor(chart: TWebAssemblyChart,
              timelineController: timeline_controller.ITimelineController) {
    this.chart = chart;
    this.timelineController = timelineController;

    this.chart.sciChartSurface.layoutManager.leftOuterAxesLayoutStrategy =
      new LeftAlignedOuterVerticallyStackedAxisLayoutStrategy();

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

    this.annotationDataSeries = new XyDataSeries(
                                      this.chart.wasmContext,
                                      {
                                        dataIsSortedInX: true,
                                        isSorted: true,
                                        containsNaN: false
                                      });

    this.addAnnotationsLane();

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

    this.sourceId = this.timelineController.addChart(this);
  }

  /**
   * Load the annotation notes within the chart view such that they are placed at the
   * corresponding point-in-time as to reflect the other sampling values.
   *
   * @param annotations - A collection of annotation notes.
   *
   * @remarks
   *   Each annotation has it's x-axis value assigned to the point-in-time of the annotation,
   *   whereas the y-axis value is the note's index offset. For the moment, this addresses
   *   situations when many annotations are for the same point-in-time within a given
   *   annotations block.
   *
   *   Below are some of the ideas below on how improve the experience for users.
   *
   * @todo - Tooltip on hover.
   *   Add tooltip capability such that when users hover above the symbol/icon for an annotation
   *   then the text portion and additional meta-information appears in a popup dialog-box.
   *
   * @todo - Horizontal candlestick presentation
   *   Since an annotation have a duration, a start & finish times we need to present that to users
   *   within the chart.
   *
   *   This is important since users need to see the duration of a given annotation to better
   *   comprehend the context(s) of what they see in the sampling values.
   *
   * @todo - Levels based on kind of annotation.
   *   Consider annotation levels based on the kind of annotation such as administrating of
   *   medication, observations by neurologist, notes taken by healthcare practitioners on the
   *   patient's state that were noted while the recording session was being recorded.
   *
   * @todo - Overlaps annotations long durations are ranked higher.
   *   Detect overlaps with other existing annotations, when there is an overlap then annotations
   *   having a longer duration are ranked higher. Otherwise as tie-breaks, those with an earlier
   *   start time are ranked higher, then by the order in which they were inserted into the lane.
   *
   * @todo - Present all annotation symbols
   *   Look into the possibility for the chart view's overview to represent the entire recording
   *   session rather than restricted to the chart view's visible range limits.
   *
   *   Users would have then capability to visualize all of the annotations symbols of that
   *   recording session.
   *
   *   Additionally, users could select an annotation symbol as to navigate to that point-in-time,
   *   at which point the chart view's and video are then synchronized to that moment and playback
   *   resumes from that moment.
   *
   * @todo - Vertical presentation of annotations.
   *   Present annotations vertically in a tab or side-bar. In which for each annotation, users
   *   view the annotation's note(s) and meta-information.
   *
   *   Where users can view through the vertical timeline to view each annotation without stopping
   *   playback or changing the current point-in-time of the chart view or the video.
   *
   *   Additionally, users could select an annotation symbol as to navigate to that point-in-time,
   *   at which point the chart view's and video are then synchronized to that moment and playback
   *   resumes from that moment.
   *
   *   See Flowbite's grouped timeline https://flowbite.com/docs/components/timeline/ for an idea
   *   on how to present this to users.
   */
  public loadAnnotations(annotations: eeg_readings.Annotations): void {
    annotations.forEach((annotation) => {
      annotation.notes.forEach((_note, index) => {
        this.annotationDataSeries.append(annotation.timeRange.min, index);

        const markerAnnotation = new AxisMarkerAnnotation({
                                        image: annotationImageElement,
                                        imageHeight: 30,
                                        imageWidth: 30,
                                        isEditable: false,
                                        // horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
                                        // verticalAnchorPoint: EVerticalAnchorPoint.Top,
                                        xAxisId: this.timelineAxis.id,
                                        x1: annotation.timeRange.min
                                    });

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
        this.chart.sciChartSurface.annotations.add(markerAnnotation);
      });
    });
  }

  /**
   * Load lanes into the chart view based on the signal definitions used during the recording
   * session.
   *
   * @param definitions - The signal definitions.
   */
  public async loadDefinitions(definitions: eeg_readings.SignalDefinitions): Promise<void> {
    if (this.definitions) return;

    this.definitions = definitions;
    this.definitions.forEach((definition) => this.loadDefinition(definition));
    await this.createOverview();
  }

  /**
   * Load a segment of the recording session containing sampling values & annotations into
   * the chart's view.
   *
   * @param segment - A segment of the recording session.
   */
  public loadSegment(segment: eeg_readings.Segment) {
    this.expandTimeline(segment.timeRange);

    this.loadAnnotations(segment.annotations);

    segment.samples.forEach((sample, index) => {
      const dataSeries = this.dataSeries.at(index);

      if (dataSeries) {
        if (!dataSeries.hasValues || dataSeries.xRange.max < segment.timeRange.min) {
          dataSeries.appendRange(sample.timePoints, sample.values);
        }
        else if (dataSeries.xRange.min > segment.timeRange.max) {
          dataSeries.insertRange(0, sample.timePoints, sample.values);
        }
      }
    });
  }

  public startTimelineNavigation():  timeline_controller.RestorePlayback {
    return this.timelineController.startTimelineNavigation(this.sourceId);
  }

  public stopTimelineNavigation(restorePlayback?: timeline_controller.RestorePlayback): void {
    this.onRestorePlayback ??= restorePlayback;
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

    this.timelineController.onChangeCurrentTime({
      sourceId: this.sourceId,
      timePoint: this.currentTime,
      timeOffset: this.currentTimeOffset
    });

    this.restorePlayback();

    this.timelineAxis.visibleRange = new NumberRange(Math.min(x1, x2 - visibleRangeDistance), x2);
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
    const timeRange = this.timelineAxis.visibleRangeLimit;

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
    if (this.isVisibleRangeChanging) return;

    const visibleRange = (args)
                       ? args.visibleRange
                       : this.timelineAxis.visibleRange;

    this.isVisibleRangeChanging = true;
    this.currentTime = (visibleRange.min + visibleRange.max)/2;
    this.isVisibleRangeChanging = false;
  }

  /**
   * Adds a lane for annotations to the chart.
   *
   * @remarks
   *   The annotations are placed at the top of the chart so that within the chart's visible range
   *   the symbols/icons of annotations will appear.
   *
   *   Additionally, this lane is also used by the chart's overview such that all annotations can
   *   be viewed, with a restriction of those within chart view's visible range limits.
   */
  private addAnnotationsLane(): void {
    const axis =
        new NumericAxis(
              this.chart.wasmContext,
              {
                id: 'annotation',
                axisTitle: undefined,
                axisAlignment: EAxisAlignment.Left,
                autoRange: EAutoRange.Never,
                autoTicks: false,
                maxAutoTicks: 5,
                majorDelta: 1,
                minorDelta: 1,
                drawLabels: false,
                drawMajorBands: false,
                drawMajorGridLines: false,
                drawMajorTickLines: false,
                drawMinorGridLines: false,
                drawMinorTickLines: false
              }
            );

    const line = new XyScatterRenderableSeries(
                       this.chart.wasmContext,
                       {
                         dataSeries: this.annotationDataSeries,
                         xAxisId: this.timelineAxis.id,
                         yAxisId: axis.id,
                         stroke: "#50C7E0",
                         strokeThickness: 3
                       }
                     );

    const labelAnnotation =
      new TextAnnotation({
            text: 'Annotations',
            xAxisId: this.timelineAxis.id,
            yAxisId: axis.id,
            xCoordinateMode: ECoordinateMode.Relative,
            yCoordinateMode: ECoordinateMode.DataValue
          });

    bindAnnotation(axis, labelAnnotation, textLabelOffset);

    this.chart.sciChartSurface.yAxes.add(axis);
    this.chart.sciChartSurface.renderableSeries.add(line);
    this.chart.sciChartSurface.annotations.add(labelAnnotation);
  }

  /**
   * Adds a vertical child-chart for the given signal definition into the chart.
   *
   * @param definition - Signal definition to incorporate into the chart.
   *
   * @remarks
   *   Creates the infrastructure so that when sampling values are fetched that they'll accumulate
   *   into the corresponding data-series.
   *
   * @todo
   *   For the moment, the first 8 signal definitions are visible in the chart. However, we'll add
   *   the capability so that users can select which ones are to be visible (possibly with a limit).
   */
  private loadDefinition(definition: eeg_readings.SignalDefinition): void {
    const physicalDistance = definition.physicalRange.max - definition.physicalRange.min;
    const physicalMidpoint = definition.physicalRange.min + (physicalDistance / 2);
    const visibleSegment   = physicalDistance / 16;

    const axis =
        new NumericAxis(
              this.chart.wasmContext,
              {
                id: definition.id,
                axisTitle: undefined,
                axisAlignment: EAxisAlignment.Left,
                autoRange: EAutoRange.Always,
                maxAutoTicks: 5,
                visibleRange: new NumberRange(physicalMidpoint - visibleSegment, physicalMidpoint + visibleSegment)
              }
            );

    const dataSeries = new XyDataSeries(
                              this.chart.wasmContext,
                              {
                                dataIsSortedInX: false,
                                isSorted: false,
                                containsNaN: false
                              });

    const line = new FastLineRenderableSeries(
                      this.chart.wasmContext,
                      {
                        dataSeries: dataSeries,
                        xAxisId: this.timelineAxis.id,
                        yAxisId: axis.id,
                        stroke: "#50C7E0",
                        strokeThickness: 3
                      }
                    );

    if (this.chart.sciChartSurface.yAxes.size() < 9) {
      const labelAnnotation =
        new TextAnnotation({
              text: definition.label,
              xAxisId: this.timelineAxis.id,
              yAxisId: axis.id,
              xCoordinateMode: ECoordinateMode.Relative,
              yCoordinateMode: ECoordinateMode.DataValue
            });

      bindAnnotation(axis, labelAnnotation, textLabelOffset);

      const annotations: AnnotationBase[] = [];

      annotations.push(labelAnnotation);

      if (this.chart.sciChartSurface.yAxes.size() > 0) {
        annotations.push(makeGraphSeparator(this.timelineAxis.id, axis));
      }

      this.chart.sciChartSurface.yAxes.add(axis);
      this.chart.sciChartSurface.renderableSeries.add(line);
      this.chart.sciChartSurface.annotations.add(...annotations);
    }

    this.dataSeries.push(dataSeries);
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
   * @remarks
   *   This can be only invoked once and it's reset after being invoked.
   *
   *   When working with SciChart's chart modifiers the update to the chart view's visible range
   *   by using events. Thus, it's necessary to defer restoring of the timeline-controller's
   *   suspended state a few milliseconds as to account for all events that change the chart
   *   view's visible range as part of sciChart's chart modifiers operations on the chart view.
   */
  private restorePlayback(): void {
    if (this.onRestorePlayback === undefined) return;

    const restorePlayback = this.onRestorePlayback;
    this.onRestorePlayback = undefined;

    setTimeout(restorePlayback, 100);
  }

  /**
   * Create the chart's overview.
   *
   * @remarks
   *   This allows users to efficiently navigate to a different point-in-time within the recording
   *   session.
   *
   *   Additionally, provides users with the capability to extent/contract the chart view's visible
   *   range.
   *
   * @todo
   *   Creation of the chart's overview is deferred until this point because creating it beforehand
   *   with only the annotation axis, since the chart's overview only extends when annotation
   *   points are defined within the annotation axis. Since, these are infrequent the chart's
   *   overview won't expand.
   *
   *   A workaround for the chart's overview to extend it to bind it to a sampling values axis.
   *   Whereas, our preference is to the annotation axis but to extend based on the timeline axis.
   *
   *   Follow-up with the folks at SciChart on the possibility of the chart overview associated to
   *   the annotations axis but in which the timeline axis extends. Otherwise, a combination of
   *   the annotation + sampling values axes.
   */
  private async createOverview(): Promise<void> {
    if (this.chartOverview) return;

    this.chartOverview = await SciChartOverview.create(
      this.chart.sciChartSurface,
      'overview',
      {
        customRangeSelectionModifier: new TimelineOverviewModifier(this),
        mainAxisId: this.timelineAxis.id,
        secondaryAxisId: this.chart.sciChartSurface.yAxes.get(2).id,
        theme: new SciChartJsNavyTheme()
      }
    );
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
    annotation.y1 = (args?.visibleRange.max ?? 0) + offset;
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
                 id: 'timeline',
                 autoRange: EAutoRange.Never,
                 axisAlignment: EAxisAlignment.Top,
                 axisTitle: undefined,
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
