import * as authentication from '../../authentication';

import { ChartController } from '../../chart/controller/controller';

import { loadAnnotationImage } from '../../chart/view';

import { fetchRecordingById } from '../../models/recordings/fetch_recording_by_id';

import hasValue from '../../utilities/optional/has_value';

import { TimelineController } from '../../timeline_controller';

import { VideoController } from '../../video';

import { Container } from '@mui/material';

import {
  useRef,
  useState
} from 'react';

import {
  Toast,
  ToastContainer
} from 'react-bootstrap';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  chartBuilder,
  EThemeProviderType
} from 'scichart';

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SessionPage(_props: PageProperties) {
  const navigate = useNavigate();
  const { recordingId } = useParams();
  (recordingId === undefined) &&navigate('/');

  const videoViewRef = useRef<HTMLVideoElement>(null);

  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  let timelineController: TimelineController | undefined;
  let chartController: ChartController | undefined;
  let videoFeedController: VideoController | undefined;

  const initChart = async (rootElement: string | HTMLDivElement) => {
    const loadImagesPromise = loadAnnotationImage();

    const sessionCredentialsPromise = authentication.sessionCredentials();

    const chartPromise = chartBuilder.build2DChart(rootElement,
                                                   {
                                                     surface: {
                                                       theme: { type: EThemeProviderType.Navy },
                                                     }
                                                   });

    const recording = await fetchRecordingById(recordingId!);

    if (!recording?.data?.folder) {
      setErrorTitle('Recording session unavailable.');
      setErrorMessage('The recording session is unavailable');
      setShowError(true);

      const { sciChartSurface } = await chartPromise;
      return { sciChartSurface };
    }

    const referenceTime = recording.isLiveFeed
                        ? Date.now()
                        : recording.startTime.getTime();

    timelineController = new TimelineController(recording.startTime.getTime(),
                                                recording.finishTime?.getTime(),
                                                referenceTime);

    await loadImagesPromise;
    const { wasmContext, sciChartSurface } = await chartPromise;

    chartController = new ChartController({ wasmContext, sciChartSurface },
                                          timelineController,
                                          await sessionCredentialsPromise,
                                          recording.data.folder);

    const videoView = videoViewRef.current!;
    const isVideoPlayback = hasValue(recording.video?.playbackURL);

    if (isVideoPlayback) {
      videoFeedController = new VideoController(timelineController,
                                                videoView,
                                                recording.video!.playbackURL!);
    }

    videoView.hidden = !isVideoPlayback;
    videoView.controls = isVideoPlayback;

    return { sciChartSurface };
  };

  const deleteChart = async () => {
    if (videoViewRef.current) {
      videoViewRef.current.hidden = true;
      videoViewRef.current.controls = false;
    }

    if (chartController) {
      await chartController.dispose();
      chartController = undefined;
    }

    if (videoFeedController) {
      videoFeedController.dispose();
      videoFeedController = undefined;
    }

    if (timelineController) {
      timelineController = undefined;
    }
  };

  return (
    <Container fixed={true} maxWidth={'xl'}>
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
      <video
        ref={videoViewRef}
        style={{ width: 500, height: 100 }}
        autoPlay={false}
        controls={false}
        hidden={true}
      />
      <div
        id="overview"
        style={{ width: 1400, height: 50 }}
      />
      <SciChartReact
        style={{ width: 1400, height: 600 }}
        initChart={initChart}
        onDelete={deleteChart}
      >
      </SciChartReact>
    </Container>
  );
}

export default SessionPage;
