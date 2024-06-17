import * as authentication from '../../authentication';

import { AWSCredentials } from '@aws-amplify/core/internals/utils';

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
  //   Make the authentication session part of the application's context, so that the chart data source
  //   worker can be instantiated immediately.
  //
  const [authenticationSession, setAuthenticationSession] = useState<AWSCredentials | undefined>(undefined);

  useEffect(() => {
      authentication.sessionCredentials()
      .then((credentials) => setAuthenticationSession(credentials));
    },
    [setAuthenticationSession]);

  const [status, setStatus] = useState('');

  useEffect(() => {
      if (authenticationSession) {
        setErrorTitle('Authentication gotten.');
        setErrorMessage('Construction of the chart and timeline controller can proceed.');
        setShowError(true);
        setStatus('Construction of the chart and timeline controller can proceed.');
      }
    },
    [
      authenticationSession,
      setStatus,
      setErrorTitle,
      setErrorMessage,
      setShowError
    ]);

  const initChart = async (rootElement: string | HTMLDivElement) => {
    const createChart = async () => {
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
