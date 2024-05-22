import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import HomePage from './components/home/home_page';
import UserConfirmSignUpPage from './components/users/confirm_sign_up_page';
import UserLoginPage from './components/users/login_page';
import UserLoggedOutPage from './components/users/logged_out_page';
import UserSignUpPage from './components/users/sign_up_page';
import SessionsSelectPage from './components/sessions/sessions_selection_page';
import SiteNavigationBar from './components/site/navigation_bar';
import SiteFooter from './components/site/footer';

import { useState } from 'react';

import { Route, Routes, useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');

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
    <div>
      <SiteNavigationBar
        userName={userName}
        isUserLoggedIn={isUserLoggedIn}
        onUserLoggedOut={onUserLoggedOut}
      />
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
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
