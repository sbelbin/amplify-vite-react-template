import * as AWS_Auth from 'aws-amplify/auth';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';

import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationProperties {
  isUserLoggedIn: boolean;
  updateUserLoginStatus: (isUserLoggedIn: boolean) => void;
}

function SiteNavigationBar(props: NavigationProperties) {
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const isUserLoginPage = location.pathname === '/users/login';
  const isUserSignUpPage = location.pathname === '/users/sign_up';
  const isUserConfirmSignUpPage = location.pathname === '/users/confirm_sign_up';

  //
  // Determine the links & menu options which are accessible the navigation bar, which are
  // based on the current page and state (such as user login).
  //
  // For example:
  //  a) Given that the user hasn't logged into the application
  //       and the current page is the login page
  //      then the site navigation bar presents only these choices:
  //           - home
  //           - sign-up
  //           - confirm sign-up
  //       and the login & logout choices are shown since there aren't
  //           meaningful for the current situation.
  //
  const showHomeLink = !isHomePage;
  const showUserLogoutLink = props.isUserLoggedIn;
  const showUserLoginLink = !isUserLoginPage && !showUserLogoutLink;
  const showUserSignUpLink = !isUserSignUpPage && !showUserLogoutLink;
  const showUserConfirmSignUpLink = !isUserConfirmSignUpPage && !showUserLogoutLink;

  const navigate = useNavigate();

  const handleUserLogout = async () => {
    try {
      console.debug('Logging out.');

      await AWS_Auth.signOut();

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
        <Navbar.Toggle
          aria-controls="navbar_options"
        >
          <img
            alt="Home"
            src="/img/logo.png"
            width="50"
            height="50"
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
              {showHomeLink && (
                <Nav.Link href="/">
                  <img
                    alt="Home"
                    className="d-inline-block align-top navbar-menu-logo"
                    src="/img/logo.png"
                    width="25"
                    height="25"
                  />
                  Home
                </Nav.Link>
              )}
              <br />
              {showUserLogoutLink && (
                <Nav.Link onClick={handleUserLogout}>
                  <strong>Logout</strong>
                </Nav.Link>
              )}
              {showUserLoginLink && (
                <Nav.Link href="/users/login">
                  <strong>Login</strong>
                </Nav.Link>
              )}
              {!showUserLoginLink && showUserSignUpLink && (
                <Nav.Link href="/users/sign_up">
                  <strong>Sign-up</strong>
                </Nav.Link>
              )}
              {showUserLoginLink && showUserSignUpLink && (
                <Nav.Link href="/users/sign_up">Sign-Up</Nav.Link>
              )}
              {showUserConfirmSignUpLink && (
                <Nav.Link href="/users/confirm_sign_up">Confirm Sign-Up</Nav.Link>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
        {showUserLogoutLink && (
          <Nav.Link
            className="ms-auto"
            onClick={handleUserLogout}
          >
            <strong>Logout</strong>
          </Nav.Link>
        )}
        {showUserLoginLink && (
          <Nav.Link
            className="ms-auto"
            href="/users/login"
          >
            <strong>Login</strong>
          </Nav.Link>
        )}
        {!showUserLoginLink && showUserSignUpLink && (
          <Nav.Link
            className="ms-auto"
            href="/users/sign_up"
          >
            <strong>Sign-Up</strong>
          </Nav.Link>
        )}
      </Container>
    </Navbar>
  );
}

export default SiteNavigationBar;
