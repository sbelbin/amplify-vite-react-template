import * as authentication from '../../authentication';
import * as charting from '../../charting';

import { AWSCredentials } from '@aws-amplify/core/internals/utils';

import {
  useEffect,
  useMemo,
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

import {
  EAutoRange,
  EAxisType,
  EThemeProviderType,
  NumberRange,
  XyDataSeries,
  XyScatterRenderableSeries,
  chartBuilder
} from "scichart";

import { SciChartNestedOverview, SciChartReact } from "scichart-react";

interface PageProperties {
  isUserLoggedIn: () => boolean;
  storageRegion: string;
  bucket: string;
  folder: string;
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

  //
  // @todo
  //   Make the authentication session part of the application's context, so that the chart loader
  //   worker can be instantiated immediately.
  //
  const [authenticationSession, setAuthenticationSession] = useState<AWSCredentials | undefined>(undefined);

  useEffect(() => {
      authentication.sessionCredentials()
      .then((credentials) => setAuthenticationSession(credentials));
    },
    [setAuthenticationSession]);

  const [status, setStatus] = useState('');

  const chartLoaderWorker: Worker = useMemo(() =>
      new Worker(new URL('../../workers/chart_loader.ts', import.meta.url), {type: 'module'}),
    []);

  useEffect(() => {
      if (window.Worker && chartLoaderWorker && authenticationSession) {
        chartLoaderWorker.onmessage = (event: MessageEvent<charting.chart_loader.ResponseMessage>) => {
          const msg = event.data as charting.chart_loader.ResponseMessage;

          switch (msg.kind) {
            case charting.chart_loader.KindResponseMessage.DataPayloadReady:
              setStatus(`Fetched the segment '${msg.filePath}' that had ${msg.dataPayload.byteLength} bytes.`);
              break;
          }
        };

        chartLoaderWorker.onerror = (event: ErrorEvent) => {
          setErrorTitle('Failed to download an EEG segment.');
          setErrorMessage(`${event.error}`);
          setShowError(true);
          setStatus(`Failed. Reason: ${event.error}`);
        }

        chartLoaderWorker.postMessage({
          kind: charting.chart_loader.KindRequestMessage.Initialize,
          storageRegion: 'us-east-1',
          storageCredentials: authenticationSession,
          bucket: 'veegix8iosdev140644-dev',
          folder: 'recordings/sbelbin/2024-05-09T201117.125Z/data/',
          filesLoaded: [],
          loadSequence: charting.chart_loader.LoadSequence.Latest
        });

        chartLoaderWorker.postMessage({
          kind: charting.chart_loader.KindRequestMessage.Start,
          interval: 1000
        });
      }
    },
    [
      authenticationSession,
      chartLoaderWorker,
      setStatus,
      setErrorTitle,
      setErrorMessage,
      setShowError
    ]);

  const initChart = async (rootElement) => {
    const createChart = async () => {
      // for demonstration purposes, here we have used Builder API explicitly
      const { sciChartSurface } = await chartBuilder.build2DChart(rootElement, {
        xAxes: {
          type: EAxisType.NumericAxis,
          options: {
            autoRange: EAutoRange.Once,
            growBy: new NumberRange(0.2, 0.2),
          },
        },
        yAxes: {
          type: EAxisType.NumericAxis,
          options: { autoRange: EAutoRange.Never },
        },
        surface: {
          theme: { type: EThemeProviderType.Dark },
          title: "Scatter Chart",
          titleStyle: {
            fontSize: 20,
          },
        },
      });

      return sciChartSurface;
    };

    // a function that simulates an async data fetching
    const getData = async () => {
      await new Promise((resolve) => {
        setTimeout(() => resolve({}), 1500);
      });

      return { xValues: [0, 1, 2, 3, 4], yValues: [3, 6, 1, 5, 2] };
    };

    const [sciChartSurface, data] = await Promise.all([createChart(), getData()]);

    const wasmContext = sciChartSurface.webAssemblyContext2D;

    sciChartSurface.renderableSeries.add(
      new XyScatterRenderableSeries(wasmContext, {
        dataSeries: new XyDataSeries(wasmContext, {
          ...data,
        }),
        strokeThickness: 4,
        stroke: "#216939",
      })
    );
    return { sciChartSurface };
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
          style={{ width: 400, height: 300 }}
          fallback={
            <div className="fallback">
              <div>Data fetching & Chart Initialization in progress</div>
            </div>
          }
          initChart={initChart}
        >
          <SciChartNestedOverview />
        </SciChartReact>
      </Stack>
    </Container>
  );
}

export default SessionPage;
