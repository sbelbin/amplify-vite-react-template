import * as authentication from '../../authentication';

import { loadAnnotationImage } from '../../chart/view';

import { fetchRecordingById } from '../../models/recordings/fetch_recording_by_id';

import { ChartController } from '../../chart/controller/controller';

import {
  VideoFeedController
} from '../../video';

import {
  LoadSequence,
  RecordingSessionFolder
} from '../../chart/data_source';

import { TimelineController } from '../../timeline_controller';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  Col,
  Container,
  Row,
  Stack,
  Toast,
  ToastContainer
} from 'react-bootstrap';

import {
  chartBuilder,
  EThemeProviderType
} from "scichart";

import { SciChartReact } from 'scichart-react';

interface PageProperties {
  isUserLoggedIn: () => boolean;
}

/**
 * A page presenting a recording session that display a chart & video from a
 * recording session.
 *
 * @param props Session page properties.
 * @returns JSX.Element of the session page.
 *
 * @todo Verify the page's URL with the guys:
 *   @RodionSmilovskyi & @IsaiasGonzalez
 *
 *   Since the session selection page is '/sessions/select', then this page be :
 *     '/sessions/:recording_id'
 *     '/sessions/id/:id'
 *
 * @todo Use application context.
 *   Need to ensure that user is logged-in by using the application context, since the current
 *   approach with the page's properties isn't viable at this time. Especially, when pasting
 *   the URL of /sessions/:recording_id.
 *
 * @todo Indicator of a live-feed recording session.
 *   Provide an indication that users are watching a recording session that is a live-feed.
 *
 * @todo Improve error messaging.
 *   When something goes awry such as unable to fetch a segment of the recording, or unable to
 *   playback the video then the application needs to report back to the user about the issue.
 *
 * @todo Provide controls to start/finish.
 *   Allow users to jump to the start or to the finish of the recording session.
 *
 * @todo Provide a control to jump to a point-in-time.
 *   Allow users to provide a specific point-in-time that lies within the start & finish of the
 *   recording session.
 *
 * @todo Provide controls to jump to an time-offset.
 *   Allow users to provide a specific time-offset that lies within the start & finish of the
 *   recording session.
 *
 * @todo Toggle point-in-time / time-offset.
 *   Allow users to toggle between point-in-time and time-offset.
 *
 * @todo Toggle time-zone.
 *   Allow users to toggle the time-zone only meaningful when in point-in-time display.
 *   Top choices are recording session site, user's locale or UTC.
 *
 * @todo Provide a control jump to live-feed.
 *   When it's a live-feed and the user navigates to an earlier point-in-time, then provide
 *   a means that allows them to jump to the current point-in-time.
 *
 *   This is akin to jumping to the finish of the recording session.
 */
function SessionPage(props: PageProperties) {
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  const navigate = useNavigate();

  const { recordingId } = useParams();

  useEffect(() => {
    console.debug(`The user is logged-in ${props.isUserLoggedIn()}`);

    // (!props.isUserLoggedIn() || recordingId === undefined)
    (recordingId === undefined)
    &&
    navigate('/');
  },
  [navigate, props, recordingId]);

  let timelineController: TimelineController | undefined;
  let chartController: ChartController | undefined;
  let videoFeedController: VideoFeedController | undefined;

  const videoViewRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState('');

  const initChart = async (rootElement: string | HTMLDivElement) => {
    const loadImagesPromise = loadAnnotationImage();

    const sessionCredentialsPromise = authentication.sessionCredentials();

    const recording = await fetchRecordingById(recordingId!);

    const chartPromise = chartBuilder.build2DChart(rootElement,
                                                   {
                                                     surface: {
                                                      theme: { type: EThemeProviderType.Navy },
                                                     }
                                                   });

    if (!recording) {
      setErrorTitle('Recording session unavailable.');
      setErrorMessage('The recording session is unavailable');
      setShowError(true);
      setStatus('The recording session is unavailable');

      const { sciChartSurface } = await chartPromise;
      return { sciChartSurface };
    }

    // if (!recording.data) {
    //   setErrorTitle('Recording session unavailable.');
    //   setErrorMessage('Recording session EEG readings are unavailable.');
    //   setShowError(true);
    //   setStatus('Recording session EEG readings are unavailable.');

    //   setErrorTitle('Authentication gotten.');
    //   setErrorMessage('Construction of the chart and timeline controller can proceed.');
    //   setShowError(true);
    //   setStatus('Construction of the chart and timeline controller can proceed.');

    //   const { sciChartSurface } = await chartPromise;
    //   return { sciChartSurface };
    // }

    const startTime = recording.startTime.getTime();
    const finishTime = recording.finishTime?.getTime();

    const referenceTime = recording.isLiveFeed
                        ? Date.now()
                        : startTime;

    const folderDetails: RecordingSessionFolder = {
      region: 'us-east-1',
      bucket: 'veegix8iosdev140644-dev',
      folder: 'recordings/sbelbin/2024-05-09T201117.125Z/data/'
    };

    const playbackURL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    const loadSequence = (referenceTime === startTime)
                       ? LoadSequence.Earliest
                       : LoadSequence.Latest;

    timelineController = new TimelineController(startTime, finishTime, referenceTime);

    await loadImagesPromise;

    const { wasmContext, sciChartSurface } = await chartPromise;

    chartController = new ChartController({ wasmContext, sciChartSurface },
                                          timelineController,
                                          await sessionCredentialsPromise,
                                          folderDetails,
                                          loadSequence);

    videoFeedController = new VideoFeedController(timelineController,
                                                  videoViewRef.current!,
                                                  playbackURL);

    return { sciChartSurface };
  };

  const deleteChart = async () => {
    if (chartController) {
      await chartController.dispose();
      chartController = undefined;
    }

    if (videoFeedController) {
      videoFeedController.dispose();
      videoFeedController = undefined;
    }

    timelineController = undefined;
  };

  return (
    <Container>
      <Stack>
        <div className="vr" />
        <div className="vr" />
        <Row>
          <Col md={{ span: 0, offset: 9 }}>
            <div>
              <ToastContainer>
                <Toast
                  bg="danger"
                  show={showError}
                  onClose={toggleShowError}
                >
                  <Toast.Header>
                    <strong>
                      {errorTitle}
                    </strong>
                  </Toast.Header>
                  <Toast.Body>
                    {errorMessage}
                  </Toast.Body>
                </Toast>
              </ToastContainer>
            </div>
          </Col>
          <video
            ref={videoViewRef}
            style={{ width: 500, height: 100 }}
            autoPlay={false}
            controls={true}
            hidden={false}
          />
        </Row>
        <div className="vr" />
        <div>
          {status}
        </div>
        <div
          id="overview"
          style={{ width: 1200, height: 50 }}
        />
        <SciChartReact
          style={{ width: 1200, height: 500 }}
          fallback={
            <div className="fallback">
              <div>Data fetching & Chart Initialization in progress</div>
            </div>
          }
          initChart={initChart}
          onDelete={deleteChart}
        >
        </SciChartReact>
      </Stack>
    </Container>
  );
}

export default SessionPage;
