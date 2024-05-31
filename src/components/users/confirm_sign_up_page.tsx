import { TextField } from '@mui/material';

import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

import { Link, useNavigate } from 'react-router-dom';

interface PageProperties {
  onUserLoggedIn: (userName: string) => void;
}

function UserConfirmSignUpPage(props: PageProperties) {
  const navigate = useNavigate();

  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  const [userName, setUserName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const onSubmitForm = () => {
    AWS_Auth.confirmSignUp({ username: userName, confirmationCode: confirmationCode })
    .then((result) => {
      if (result.isSignUpComplete && result.userId) {
        props.onUserLoggedIn(result.userId);
      }
      else if (result.isSignUpComplete) {
        navigate('/users/login');
      }
    })
    .catch((error) => {
      setErrorTitle('Failed to confirm sign-up.');
      const errorMessage = `${error}`.split(':').pop() ?? `${error}`;
      setErrorMessage(errorMessage);
      setShowError(true);
    });
  };

  return (
    <Container>
      <h1 className="mb-5" >Sign-Up Confirmation</h1>
      <Form>
        <Form.Group
          className="d-flex align-items-start flex-column mb-3"
          controlId="formHorizontalEmail"
        >
          <TextField
            fullWidth
            label="User Name"
            onChange={(evt) => setUserName(evt.target.value)}
            placeholder="Enter E-mail"
            required
            sx={{ input: { color: 'white' } }}
            type="email"
          />
        </Form.Group>
        <Form.Group
          className="d-flex align-items-start flex-column mb-3"
          controlId="formHorizontalText"
        >
          <TextField
            fullWidth
            label="Confirmation Code"
            onChange={(evt) => setConfirmationCode(evt.target.value)}
            placeholder="Enter Confirmation Code"
            required
            sx={{ input: { color: 'white' } }}
            type="text"
          />
        </Form.Group>
        <br/><br/>
        <div className="d-flex mb-5" >
          <Link
            className="me-auto"
            to="/"
          >
            <Button>
              Cancel
            </Button>
          </Link>
          <Button
            className="mr-auto"
            onClick={onSubmitForm}
          >
            Confirm
          </Button>
        </div>
      </Form>
      <div className="relative" >
        <ToastContainer>
          <Toast
            autohide
            bg="danger"
            delay={5000}
            show={showError}
            onClose={toggleShowError}
          >
            <Toast.Header>
              <strong className="me-auto" >
                {errorTitle}
              </strong>
            </Toast.Header>
            <Toast.Body>
              {errorMessage}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </Container>
  );
}

export default UserConfirmSignUpPage;
