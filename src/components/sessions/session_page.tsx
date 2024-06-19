import * as authentication from '../../authentication';

import { fetchRecordingById } from '../../models/recordings/fetch_recording_by_id';
import { RecordingId } from '../../models/recordings';

import { ChartController } from '../../chart/controller/controller';
import {
  LoadSequence,
  RecordingSessionFolder
} from '../../chart/data_source';

import { TimelineController } from '../../timeline_controller';

import {
  useEffect,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Col,
  Container,
  Row,
  Stack,
  Toast,
  ToastContainer
} from 'react-bootstrap';

import { EThemeProviderType, SciChartJsNavyTheme, chartBuilder } from "scichart";

import { SciChartNestedOverview, SciChartReact } from "scichart-react";

interface PageProperties {
  isUserLoggedIn: () => boolean;
  recordingId: RecordingId;
}

function SessionPage(props: PageProperties) {
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  const navigate = useNavigate();

  useEffect(() => {
      // @todo - Mechanism ensuring that the session is authenticated.
      (props.isUserLoggedIn === undefined) && navigate('/');
    },
    [navigate, props]);

  let timelineController: TimelineController | undefined;
  let chartController: ChartController | undefined;

  const [status, setStatus] = useState('');

  const initChart = async (rootElement: string | HTMLDivElement) => {

    const sessionCredentialsPromise = authentication.sessionCredentials();

    const recording = await fetchRecordingById(props.recordingId);

    const sessionCredentials = await sessionCredentialsPromise;

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

    timelineController = new TimelineController(startTime, finishTime, referenceTime);

    const folderDetails: RecordingSessionFolder = {
      region: 'us-east-1',
      bucket: 'veegix8iosdev140644-dev',
      folder: 'recordings/sbelbin/2024-05-09T201117.125Z/data/'
    };

    const loadSequence = (referenceTime === startTime)
                       ? LoadSequence.Earliest
                       : LoadSequence.Latest;

    const { wasmContext, sciChartSurface } = await chartPromise;

    chartController = new ChartController({ wasmContext, sciChartSurface },
                                          timelineController,
                                          sessionCredentials,
                                          folderDetails,
                                          loadSequence);

    return { sciChartSurface: chartController.view.chart.sciChartSurface };
  };

  const deleteChart = async () => {
    if (chartController) {
      await chartController.dispose();
    }

    chartController = undefined;
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
        </Row>
        <div className="vr" />
        <div>
          {status}
        </div>
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
