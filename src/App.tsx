import './App.css';

import HomePage from './components/home/home_page';
import UserConfirmSignUpPage from './components/users/confirm_sign_up_page';
import UserLoginPage from './components/users/login_page';
import UserSignUpPage from './components/users/sign_up_page';
import SessionsSelectPage from './components/sessions/sessions_selection_page';
import SiteNavigation from './components/common/site_navigation';
import SiteFooter from './components/common/site_footer';

import {
  Authenticator,
  Button,
  Heading,
  Image,
  Text,
  View,
  useAuthenticator,
  useTheme
} from '@aws-amplify/ui-react';

import '@aws-amplify/ui-react/styles.css';

import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';

function App() {

  const components = {
    Header() {
      const { tokens } = useTheme();

      return (
        <View textAlign="center" padding={tokens.space.large}>
          <Image
            alt="logo"
            height="40%"
            width="40%"
            src="/img/logo.png"
          />
        </View>
      );
    },

    Footer() {
      const { tokens } = useTheme();

      return (
        <View textAlign="center" padding={tokens.space.large}>
          <Text color={tokens.colors.white}>
            <br>&copy; 2024 NeuroServo Inc.&nbsp;&nbsp;</br>
          </Text>
        </View>
      );
    },

    SignIn: {
      Header() {
        const { tokens } = useTheme();

        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Login
          </Heading>
        );
      },
      Footer() {
        const { toForgotPassword } = useAuthenticator();

        return (
          <View textAlign="center">
            <Button
              fontWeight="normal"
              onClick={toForgotPassword}
              size="small"
              variation="link"
            >
              Reset Password
            </Button>
          </View>
        );
      },
    },

    SignUp: {
      Header() {
        const { tokens } = useTheme();

        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Sign-up for a new account
          </Heading>
        );
      },
      Footer() {
        const { toSignIn } = useAuthenticator();

        return (
          <View textAlign="center">
            <Button
              fontWeight="normal"
              onClick={toSignIn}
              size="small"
              variation="link"
            >
              Back to Login
            </Button>
          </View>
        );
      },
    },
    ConfirmSignUp: {
      Header() {
        const { tokens } = useTheme();
        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Enter Information:
          </Heading>
        );
      },
      Footer() {
        return <Text>Footer Information</Text>;
      },
    },
    SetupTotp: {
      Header() {
        const { tokens } = useTheme();
        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Enter Information:
          </Heading>
        );
      },
      Footer() {
        return <Text>Footer Information</Text>;
      },
    },
    ConfirmSignIn: {
      Header() {
        const { tokens } = useTheme();
        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Enter Information:
          </Heading>
        );
      },
      Footer() {
        return <Text>Footer Information</Text>;
      },
    },
    ForgotPassword: {
      Header() {
        const { tokens } = useTheme();
        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Enter Information:
          </Heading>
        );
      },
      Footer() {
        return <Text>Footer Information</Text>;
      },
    },
    ConfirmResetPassword: {
      Header() {
        const { tokens } = useTheme();
        return (
          <Heading
            padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
            level={3}
          >
            Enter Information:
          </Heading>
        );
      },
      Footer() {
        return <Text>Footer Information</Text>;
      },
    },
  };

  const formFields = {
    signIn: {
      username: {
        label: 'E-mail:',
        placeholder: 'Enter your e-mail',
        isRequired: true
      },
      password: {
        label: 'Password:',
        placeholder: 'Enter your password',
        isRequired: true
      }
    },
    signUp: {
      email: {
        label: 'E-mail:',
        placeholder: 'Enter your e-mail',
        order: 1
      },
      password: {
        label: 'Password:',
        placeholder: 'Enter your password',
        isRequired: false,
        order: 2
      },
      confirm_password: {
        label: 'Password (confirmation):',
        placeholder: 'Confirm your password',
        order: 3
      },
    },
    forceNewPassword: {
      password: {
        label: 'Password:',
        placeholder: 'Enter your password',
      },
    },
    forgotPassword: {
      username: {
        label: 'E-mail:',
        placeholder: 'Enter your e-mail',
      },
    },
    confirmResetPassword: {
      confirmation_code: {
        label: 'Confirmation Code:',
        placeholder: 'Enter the confirmation code',
        isRequired: false
      },
      confirm_password: {
        label: 'Password (confirmation):',
        placeholder: 'Confirm your password',
      },
    },
    setupTotp: {
      QR: {
        totpIssuer: 'test issuer',
        totpUsername: 'amplify_qr_test_user',
      },
      confirmation_code: {
        label: 'Confirmation Code:',
        placeholder: 'Enter the confirmation code',
        isRequired: false
      },
    },
    confirmSignIn: {
      confirmation_code: {
        label: 'Confirmation Code:',
        placeholder: 'Enter the confirmation code',
        isRequired: false
      },
    },
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function updateLoggedIn(isLoggedIn: boolean) {
    setIsLoggedIn(isLoggedIn)
  }

  return (
    <Authenticator components={components}
                   formFields={formFields}
                   socialProviders={['google']}>
      {({ signOut, user }) => (
        <div>
        <SiteNavigation isLoggedIn={isLoggedIn} updateLoggedIn={updateLoggedIn} />
        <Routes>
          <Route path='*' element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path='/' exact={true} element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path='/users/login' element={<UserLoginPage updateLoggedIn={updateLoggedIn} />} />
          <Route path='/users/sign_up' element={<UserSignUpPage />} />
          <Route path='/users/confirm_sign_up' element={<UserConfirmSignUpPage />} />
          <Route path='/sessions/select' element={<SessionsSelectPage isLoggedIn={isLoggedIn} />} />
        </Routes>
        <SiteFooter />
        </div>
      )}
    </Authenticator>
  );
}

export default App;
