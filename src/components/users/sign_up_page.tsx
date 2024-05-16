// import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import { useNavigate, Link } from 'react-router-dom';

function UserSignUpPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleUserSignUp = async () => {
    try {
      console.debug(
        `Attempting to sign-up. userName: ${userName}, userPassword: ${userPassword}, userEmail: ${userEmail}`
      );

      // const signUpResult =
      //     await AWS_Auth.signUp({
      //         username: userName,
      //         password: userPassword,
      //         attributes: {
      //             email: userEmail,
      //         }
      //     });

      // if (!signUpResult.isSignUpComplete) {
      //     return;
      // }

      navigate('/users/confirm_sign_up');
    } catch (error) {
      console.error(`Failed to sign-up. Reason: ${error}`);
    }
  };

  return (
    <Container>
      <Row className="px-4 my-5">
        <Col>
          <h1>Sign-Up</h1>
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
              controlId="formBasicEmail"
            >
              <Form.Label>E-mail Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                onChange={(evt) => setUserEmail(evt.target.value)}
              />
              <Form.Text className="text-muted">We don't share E-mail details with anyone.</Form.Text>
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="formPassword"
            >
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                minLength={8}
                placeholder="Enter Password"
                onChange={(evt) => setUserPassword(evt.target.value)}
              />
            </Form.Group>
            <Button
              variant="primary"
              type="button"
              onClick={handleUserSignUp}
            >
              Sign-Up
            </Button>
            &nbsp;&nbsp;
            <Link to="/users/login">
              <Button variant="outline-primary">Login</Button>
            </Link>
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

export default UserSignUpPage;
