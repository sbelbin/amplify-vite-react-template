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
          kind: charting.chart_loader.KindEventMessage.Initialize,
          storageRegion: 'us-east-1',
          storageCredentials: authenticationSession,
          bucket: 'veegix8iosdev140644-dev',
          folder: 'recordings/sbelbin/2024-05-09T201117.125Z/data/',
          filesLoaded: [],
          loadSequence: charting.chart_loader.LoadSequence.Latest
        });

        chartLoaderWorker.postMessage({
          kind: charting.chart_loader.KindEventMessage.Start,
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
      </Stack>
    </Container>
  );
}

export default SessionPage;
