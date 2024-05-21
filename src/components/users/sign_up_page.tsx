import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

import { Link, useNavigate } from 'react-router-dom';

function UserSignUpPage() {
  const navigate = useNavigate();

  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const onSubmitForm = () => {
    AWS_Auth.signUp({
      username: userName,
      password: userPassword,
      options: {
        userAttributes: {
          email: userName
        }
      }
    })
    .then((result) => {
      if (result.isSignUpComplete) {
        navigate('/users/login');
      }
      else if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        navigate('/users/confirm_sign_up');
      }
    })
    .catch((error) => {
      setErrorTitle('Failed to sign-up.');
      const errorMessage = `${error}`.split(':').pop() ?? `${error}`;
      setErrorMessage(errorMessage);
      setShowError(true);
    });
  };

  return (
    <Container>
      <h1 className="mb-5" >Sign-Up</h1>
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
            controlId="formHorizontalEmail"
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
            Sign-Up
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

export default UserSignUpPage;
