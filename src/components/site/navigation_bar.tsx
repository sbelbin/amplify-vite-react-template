import * as AWS_Auth from 'aws-amplify/auth';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';

import { useLocation } from 'react-router-dom';

interface NavigationProperties {
  userName: string | undefined;
  isUserLoggedIn: () => boolean;
  onUserLoggedOut: () => void;
}

/**
 * Determine the links & menu options which are accessible in the site navigation bar, which are
 * based on the current page and state (such as user login).
 *
 * @param props - The site's navigation bar properties.
 * @returns The JSX.Element of the this navigation bar.
 *
 * @remarks
 *   Scenarios to describe how this site navigation bar shall behave:
 *    a) Given that the user hasn't logged into the application
 *         and the current page is the login page
 *        then the site navigation bar presents only these choices:
 *             - home
 *             - sign-up
 *             - confirm sign-up
 *         and login is hidden since there is no use to navigate to itself
 *         and logout is hidden since the pre-requisite of a logged-in user doesn't apply.
 *
 *    b) Given that the user is logged into the application
 *         and the current page is the home page
 *        then the site navigation bar presents only these choices:
 *             - logout
 *             - select sessions
 *         and home is hidden since there is no use to navigate to itself
 *         and login, sign-up, confirm sign-up are hidden since the pre-requisite of a logged-out user doesn't apply.
 */
function SiteNavigationBar(props: NavigationProperties) {
  const location = useLocation();

  const isHomePage              = location.pathname === '/';
  const isUserLoginPage         = location.pathname === '/users/login';
  const isUserSignUpPage        = location.pathname === '/users/sign_up';
  const isUserConfirmSignUpPage = location.pathname === '/users/confirm_sign_up';
  const isSessionsSelectionPage = location.pathname === '/sessions/select';

  const isUserLoggedIn = props.isUserLoggedIn();
  const showHomeLink = !isHomePage;
  const showUserLogoutLink = isUserLoggedIn;
  const showUserLoginLink = !isUserLoginPage && !isUserLoggedIn;
  const showUserSignUpLink = !isUserSignUpPage && !isUserLoggedIn;
  const showUserConfirmSignUpLink = !isUserConfirmSignUpPage && !isUserLoggedIn;
  const showSessionsSelectionLink = !isSessionsSelectionPage && isUserLoggedIn;

  const handleUserLogout = () => {
    AWS_Auth.signOut()
    .then(() => {
      props.onUserLoggedOut();
    })
    .catch((error) => {
      console.error(`Failed to logout. Reason: ${error}`);
    });
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
            height="auto"
          />
        </Navbar.Toggle>
        <Navbar.Offcanvas
          id="navbar_options"
          aria-labelledby="navbar_options_title"
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="navbar_options_title" >Options</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3" >
              {showHomeLink && (
                <Nav.Link href="/" >
                  <img
                    alt="Home"
                    className="d-inline-block align-top navbar-menu-logo"
                    src="/img/logo.png"
                    width="25"
                    height="auto"
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
                <Nav.Link href="/users/login" >
                  <strong>Login</strong>
                </Nav.Link>
              )}
              {!showUserLoginLink && showUserSignUpLink && (
                <Nav.Link href="/users/sign_up" >
                  <strong>Sign-up</strong>
                </Nav.Link>
              )}
              {showUserLoginLink && showUserSignUpLink && (
                <Nav.Link href="/users/sign_up" >Sign-Up</Nav.Link>
              )}
              {showUserConfirmSignUpLink && (
                <Nav.Link href="/users/confirm_sign_up" >Confirm Sign-Up</Nav.Link>
              )}
              {showSessionsSelectionLink && (
                <Nav.Link href="/sessions/select" >Select Session</Nav.Link>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
        {showUserLogoutLink && (
          <Nav.Item>
            <Nav.Item>
              {props.userName}
            </Nav.Item>
            <Nav.Link onClick={handleUserLogout} >
              <strong>Logout</strong>
            </Nav.Link>
          </Nav.Item>
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
