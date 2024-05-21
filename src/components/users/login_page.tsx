import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

import { Link, useNavigate } from 'react-router-dom';

interface PageProperties {
  updateUserLoginStatus: (isUserLoggedIn: boolean) => void;
}

function UserLoginPage(props: PageProperties) {
  const navigate = useNavigate();

  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const onSubmitForm = () => {
    AWS_Auth.signIn({ username: userName, password: userPassword })
    .then((result) => {
      if (result.isSignedIn) {
        return AWS_Auth.getCurrentUser();
      }
    })
    .then((user) => {
      //
      // \todo
      //   - Set the cloud application user credentials so that fetching the following
      //     records, recording's EEG readings and video are only for valid user accounts.
      //
      //   - Nice to have. Revise the user details on the site navigation bar.
      //
      console.debug(`Logged in as userId: ${user?.userId}, userName: ${user?.username}`);

      props.updateUserLoginStatus(true);
      navigate('/sessions/select');
    })
    .catch((error) => {
      setErrorTitle('Failed to login.');
      const errorMessage = `${error}`.split(':').pop() ?? `${error}`;
      setErrorMessage(errorMessage);
      setShowError(true);
    });
  };

  return (
    <Container>
      <h1 className="mb-5" >Login</h1>
      <Form>
        <Form.Group
          className="d-flex align-items-start flex-column mb-3"
          controlId="formHorizontalEmail"
        >
          <Form.Label>User Name</Form.Label>
          <Form.Control
            required
            onChange={(evt) => setUserName(evt.target.value)}
            placeholder="Enter E-mail"
            type="email"
          />
        </Form.Group>
        <Form.Group
          className="d-flex align-items-start flex-column mb-3"
          controlId="formHorizontalPassword"
        >
          <Form.Label>Password</Form.Label>
          <Form.Control
            required
            onChange={(evt) => setUserPassword(evt.target.value)}
            placeholder="Enter Password"
            type="password"
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
            Login
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

export default UserLoginPage;
