import * as storage from '../../storage';

import {
  useEffect,
  useState
} from 'react';

// import { useNavigate } from 'react-router-dom';

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

type StatusUpdate = (message: string) => void;

async function downloadFirstFile(storageRegion: string,
                                 bucket: string,
                                 folder: string,
                                 statusUpdate: StatusUpdate) {
  statusUpdate(`Connecting to the AWS S3 storage in the ${storageRegion} region.`);

  const client = await storage.connect(storageRegion);

  statusUpdate(`Scanning the ${bucket}'s ${folder} for files.`);

  const listFiles = await storage.listFilesInFolder(client, bucket, folder);

  if (listFiles.length === 0) {
    throw new Error(`No files were found in the ${folder} from the ${bucket}.`);
  }

  const file = listFiles[0];

  if (!file.Key) {
    throw new Error(`No file path provided in the ${folder} from the ${bucket}.`);
  }

  statusUpdate(`Downloading the contents of ${file.Key}.`);
  const dataBuffer = await storage.fetchData(client, bucket, file.Key, file.Size ?? 0);

  const fileSize = dataBuffer.byteLength;

  statusUpdate(`Downloaded ${fileSize} bytes of the file ${file.Key}.`);
}

function SessionPage(props: PageProperties) {
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  // const navigate = useNavigate();

  // useEffect(() => {
  //     !props.isUserLoggedIn() && navigate('/');
  //   },
  //   [navigate, props]);

  const [status, setStatus] = useState('');

  useEffect(() => {
    const fn = async () => {
        try {
          await downloadFirstFile(props.storageRegion,
                                  props.bucket,
                                  props.folder,
                                  (message: string) => setStatus(message));
        }
        catch(error) {
          setErrorTitle('Failed to download the first file in folder.');
          setErrorMessage(`${error}`);
          setShowError(true);
          setStatus(`Failed. Reason: ${error}`);
        }
      }

      fn();
    },
    [props, setStatus, setErrorTitle, setErrorMessage, setShowError]);

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
