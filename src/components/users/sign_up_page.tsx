import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

import { Link, useNavigate } from 'react-router-dom';

function UserSignUpPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const onSubmitForm = () => {
    console.debug(
      `Attempting to sign-up. userName: ${userName}, userPassword: ${userPassword}`
    );

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
      console.error(`Failed to sign-up. Reason: ${error}`);
    });
  };

  return (
    <Container>
      <h1 className="mb-5">Sign-Up</h1>
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
        <div className="d-flex mb-5">
          <Button
            className="me-auto"
            onClick={onSubmitForm}
          >
            Sign-Up
          </Button>
          <Link to="/">
            <Button className="me-auto" >
              Cancel
            </Button>
          </Link>
        </div>
      </Form>
    </Container>
  );
}

export default UserSignUpPage;
