import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';

import { Link } from 'react-router-dom';

interface PageProperties {
  isUserLoggedIn: boolean;
}

export function HomePage(props: PageProperties) {
  return (
    <Container>
      <Row className="px-4 my-5" >
        <Col
          xs={4}
          sm={6}
        >
          <Image
            src="/img/logo.png"
            fluid
          />
        </Col>
        <Col sm={6}>
          <h1 className="app_name" >NeuroServo Horizon</h1>
          <p className="mt-4" >
            Lorem Ipsum
            <br />
            <br />
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>
          {!props.isUserLoggedIn && (
            <>
              <Link to="/users/login" >
                <Button variant="primary" >Login</Button>
              </Link>
              &nbsp;&nbsp;
              <Link to="/users/sign_up" >
                <Button variant="primary" >Sign-Up</Button>
              </Link>
            </>
          )}
          {props.isUserLoggedIn && (
            <Link
              to="/sessions/select"
              state={{ isUserLoggedIn: props.isUserLoggedIn }}
            >
              <Button variant="primary" >Select Sessions</Button>
            </Link>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
