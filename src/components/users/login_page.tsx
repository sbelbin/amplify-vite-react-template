import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';

import { Link, useNavigate } from 'react-router-dom';

interface PageProperties {
  updateUserLoginStatus: (isUserLoggedIn: boolean) => void;
}

function UserLoginPage(props: PageProperties) {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const onSubmitForm = () => {
    console.debug(`Logging into AWS. userName: ${userName}, userPassword: ${userPassword}`);

    AWS_Auth.signIn({ username: userName, password: userPassword })
    .then((result) => {
      if (result.isSignedIn) {
        props.updateUserLoginStatus(true);
        navigate('/sessions/select');

        return AWS_Auth.getCurrentUser();
      }
    })
    .then((user) => {
      console.debug(`Logged in as userId: ${user?.userId}, userName: ${user?.username}`);
    })
    .catch((error) => {
      console.error(`Failed to login. Reason: ${error}`);
    });
  };

  return (
    <Container>
      <h1 className="mb-5">Login</h1>
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
        <div className="d-flex mb-5">
          <Button
            className="me-auto"
            onClick={onSubmitForm}
          >
            Login
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

export default UserLoginPage;
