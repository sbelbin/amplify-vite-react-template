import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import { useNavigate, Link } from 'react-router-dom';

function UserConfirmSignUpPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [authenticationCode, setAuthenticationCode] = useState('');

  const handleConfirmSignUp = async () => {
    try {
      console.debug(
        `Attempting to confirm user sign-up. userName: ${userName}, authenticationCode: ${authenticationCode}`
      );

      const confirmSignUpResult = await AWS_Auth.confirmSignUp({ username: userName, confirmationCode: authenticationCode });
      if (!confirmSignUpResult.isSignUpComplete) {
        return;
      }

      navigate('/users/login');
    } catch (error) {
      console.error(`Failed to confirm sign-up. Reason: ${error}`);
    }
  };

  return (
    <Container>
      <Row className="px-4 my-5">
        <Col>
          <h1>Sign-Up Confirmation</h1>
        </Col>
      </Row>
      <Row className="px-4 my-5">
        <Col sm={6}>
          <Form>
            <Form.Group
              className="mb-3"
              controlId="formBasicText"
            >
              <Form.Label>User Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter User Name"
                onChange={(evt) => setUserName(evt.target.value)}
              />
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formBasicText"
            >
              <Form.Label>Authentication Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Authentication Code"
                onChange={(evt) => setAuthenticationCode(evt.target.value)}
              />
            </Form.Group>
            <Button
              variant="primary"
              type="button"
              onClick={handleConfirmSignUp}
            >
              Confirm
            </Button>
            &nbsp;&nbsp;
            <Link to="/">
              <Button variant="outline-primary">Cancel</Button>
            </Link>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default UserConfirmSignUpPage;
