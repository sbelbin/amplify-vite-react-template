// import * as AWS_Auth from 'aws-amplify/auth';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';

import { useNavigate } from 'react-router-dom';

interface NavigationProperties {
  isUserLoggedIn: boolean;
  updateUserLoginStatus: (isUserLoggedIn: boolean) => void;
}

function SiteNavigationBar(props: NavigationProperties) {
  const navigate = useNavigate();

  const handleUserLogout = async () => {
    try {
      console.debug('Logging out.');

      // await AWS_Auth.signOut();

      props.updateUserLoginStatus(false);
      navigate('/users/logged_out');
    } catch (error) {
      console.error(`Failed to sign-out user. Reason: ${error}`);
    }
  };

  return (
    <Navbar
      fixed="top"
      expand={false}
      className="bg-body-tertiary mb-3"
    >
      <Container fluid>
        <Navbar.Toggle aria-controls="navbar_options">
          <img
            src="/img/logo.png"
            width="50"
            height="50"
            className="d-inline-block align-top"
            alt="Home"
          />
        </Navbar.Toggle>
        <Navbar.Offcanvas
          id="navbar_options"
          aria-labelledby="navbar_options_title"
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="navbar_options_title">Options</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3">
              <Nav.Link href="/">
                <img
                  src="/img/logo.png"
                  width="25"
                  height="25"
                  className="d-inline-block align-top navbar-menu-logo"
                  alt="Home"
                />
                Home
              </Nav.Link>
              <br />
              {props.isUserLoggedIn && (
                <>
                  <Nav.Link onClick={handleUserLogout}>
                    <strong>Logout</strong>
                  </Nav.Link>
                </>
              )}
              {!props.isUserLoggedIn && (
                <>
                  <Nav.Link href="/users/login">
                    <strong>Login</strong>
                  </Nav.Link>
                  <Nav.Link href="/users/sign_up">Sign-Up</Nav.Link>
                </>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
        {!props.isUserLoggedIn && (
                <Nav.Item className="ms-auto">
                  <Nav.Link href="/users/login"><strong>Login</strong></Nav.Link>
                </Nav.Item>
        )}
        {props.isUserLoggedIn && (
                <Nav.Item className="ms-auto">
                  <Nav.Link onClick={handleUserLogout}><strong>Logout</strong></Nav.Link>
                </Nav.Item>
        )}
      </Container>
    </Navbar>
  );
}

export default SiteNavigationBar;
