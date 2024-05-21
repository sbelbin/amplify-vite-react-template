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

import { Route, Routes } from 'react-router-dom';

function App() {

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  function updateUserLoginStatus(isUserLoggedIn: boolean) {
    setIsUserLoggedIn(isUserLoggedIn);
  }

  const [userName, setUserName] = useState('');

  function updateUserName(userName: string | undefined) {
    setUserName(userName ?? '');
  }

  return (
    <div>
      <SiteNavigationBar
        isUserLoggedIn={isUserLoggedIn}
        updateUserLoginStatus={updateUserLoginStatus}
        userName={userName}
        updateUserName={updateUserName}
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
          element={<UserLoginPage updateUserLoginStatus={updateUserLoginStatus} updateUserName={updateUserName} />}
        />
        <Route
          path="users/logged_out"
          element={<UserLoggedOutPage />}
        />
        <Route
          path="/users/sign_up"
          element={<UserSignUpPage />}
        />
        <Route
          path="/users/confirm_sign_up"
          element={<UserConfirmSignUpPage updateUserLoginStatus={updateUserLoginStatus} updateUserName={updateUserName} />}
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
