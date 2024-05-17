import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

import { Link, useNavigate } from 'react-router-dom';

interface PageProperties {
  updateUserLoginStatus: (isUserLoggedIn: boolean) => void;
}

function UserConfirmSignUpPage(props: PageProperties) {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const onSubmitForm = () => {
    console.debug(
      `Attempting to confirm user's sign-up. userName: ${userName}, confirmationCode: ${confirmationCode}`
    );

    AWS_Auth.confirmSignUp({ username: userName, confirmationCode: confirmationCode })
    .then((result) => {
      if (result.isSignUpComplete && result.userId) {
        props.updateUserLoginStatus(true);
        navigate('selections/select');
      } else if (result.isSignUpComplete) {
        navigate('/users/login');
      }
    })
    .catch((error) => {
      console.error(`Failed to confirm sign-up. Reason: ${error}`);
    });
  };

  return (
    <Container>
      <h1 className="mb-5">Sign-Up Confirmation</h1>
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
          controlId="formHorizontalText"
        >
          <Form.Label>Confirmation Code</Form.Label>
          <Form.Control
            required
            onChange={(evt) => setConfirmationCode(evt.target.value)}
            placeholder="Enter Confirmation Code"
            type="text"
          />
        </Form.Group>
        <br/><br/>
        <div className="d-flex mb-5">
          <Button
            className="me-auto"
            onClick={onSubmitForm}
          >
            Confirm
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

export default UserConfirmSignUpPage;
