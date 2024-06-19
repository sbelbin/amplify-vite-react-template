import './App.css';
import * as authentication from './authentication';

import 'bootstrap/dist/css/bootstrap.min.css';

import HomePage from './components/home/home_page';
import UserConfirmSignUpPage from './components/users/confirm_sign_up_page';
import UserLoginPage from './components/users/login_page';
import UserLoggedOutPage from './components/users/logged_out_page';
import UserSignUpPage from './components/users/sign_up_page';
import SessionPage from './components/sessions/session_page';
import SessionsSelectPage from './components/sessions/sessions_selection_page';
import SiteNavigationBar from './components/site/navigation_bar';
import SiteFooter from './components/site/footer';

import { useEffect, useState } from 'react';

import { Container, Row } from 'react-bootstrap';

import { Route, Routes, useNavigate } from 'react-router-dom';

import { SciChartSurface } from 'scichart';

/**
 * @todo
 *   Wrap this as part of chart code such that it's hidden from the main application code.
 *   Determine if there is a possibility to defer until the user opens a session page and
 *   if so to do it once (i.e. does it make sense to be a context).
 */
SciChartSurface.loadWasmFromCDN();
SciChartSurface.UseCommunityLicense();

function App() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');

  useEffect(() => {
      const setLoginId = async () => {
        setUserName(await authentication.currentUserName() ?? '');
      };

      setLoginId();
    },
    [setUserName]);

  function isUserLoggedIn(): boolean {
    return !!userName;
  }

  //
  // Application callback indicating when a user is logged into the application.
  //
  // \notes
  //   The user name is the underlying unique identifier assigned to a person that is
  //   stored in the user pool. In principal a user could login using an E-mail address
  //   or a phone number. However, it's their user name that the application presents in
  //   the site navigation bar.
  //
  function onUserLoggedIn(userName: string): void {
    setUserName(userName);
    navigate('/sessions/select');
  }

  //
  // Application callback indicating when the user has logged out from the application.
  //
  function onUserLoggedOut(): void {
    setUserName('');
    navigate('/users/logged_out');
  }

  return (
    <Container fluid>
      <Row>
      <SiteNavigationBar
        userName={userName}
        isUserLoggedIn={isUserLoggedIn}
        onUserLoggedOut={onUserLoggedOut}
      />
      </Row>
      <Row>
        <Routes>
          <Route
            path="*"
            element={<HomePage isUserLoggedIn={isUserLoggedIn} />}
          />
          <Route
            path="/"
            element={<HomePage isUserLoggedIn={isUserLoggedIn} />}
          />
          <Route
            path="/users/login"
            element={<UserLoginPage onUserLoggedIn={onUserLoggedIn} />}
          />
          <Route
            path="/users/logged_out"
            element={<UserLoggedOutPage />}
          />
          <Route
            path="/users/sign_up"
            element={<UserSignUpPage />}
          />
          <Route
            path="/users/confirm_sign_up"
            element={<UserConfirmSignUpPage onUserLoggedIn={onUserLoggedIn} />}
          />
          <Route
            path="/sessions/select"
            element={<SessionsSelectPage isUserLoggedIn={isUserLoggedIn} />}
          />
          <Route
            path="/sessions/id"
            element={<SessionPage
                        isUserLoggedIn={isUserLoggedIn}
                        recordingId={'f11a57e6-50f2-49d4-83bc-a6d8927e518a'} // main -  {'567e4583-2e70-4a47-b360-1e2650c0673d'}, {'57d7e1f4-5c4e-4dda-8e63-ef77db839690'}
                     />}
          />
        </Routes>
      </Row>
      <Row>
        <SiteFooter />
      </Row>
    </Container>
  );
}

export default App;
