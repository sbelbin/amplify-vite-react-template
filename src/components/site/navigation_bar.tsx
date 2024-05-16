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
      navigate('/');
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
        <Navbar.Brand href="#" />
        <Navbar.Toggle aria-controls="navbar_options" />
        <Navbar.Offcanvas
          id="navbar_options"
          aria-labelledby="navbar_options_title"
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="navbar_options_title">Options</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3">
              {props.isUserLoggedIn && (
                <>
                  <Nav.Link onClick={handleUserLogout}>Logout</Nav.Link>
                </>
              )}
              {!props.isUserLoggedIn && (
                <>
                  <Nav.Link href="/users/login">Login</Nav.Link>
                  <br />
                  <Nav.Link href="/users/sign_up">Sign-Up</Nav.Link>
                </>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
}

export default SiteNavigationBar;
