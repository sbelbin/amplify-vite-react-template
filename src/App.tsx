import { useEffect, useState } from 'react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

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

import '@aws-amplify/ui-react/styles.css'

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  const components = {
    Header() {
      const { tokens } = useTheme();

      return (
        <View textAlign="center" padding={tokens.space.large}>
          <Image
            alt="NeuroServo logo"
            height="40%"
            width="40%"
            src="/img/neuroservo.png"
          />
        </View>
      );
    },

    Footer() {
      const { tokens } = useTheme();

      return (
        <View textAlign="center" padding={tokens.space.large}>
          <Text color={tokens.colors.white}>
            &copy; All Rights Reserved
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
            Sign in to your account
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
            Create a new account
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
              Back to Sign In
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

  return (
    <Authenticator components={components}
                   formFields={formFields}
                   socialProviders={['google']}>
      {({ signOut, user }) => (
        <main>
          <h1>{user?.signInDetails?.loginId}'s todos</h1>
          <button onClick={createTodo}>+ new</button>
          <ul>
            {todos.map((todo) => (
              <li
                onClick={() => deleteTodo(todo.id)}
                key={todo.id}>
                {todo.content}</li>
            ))}
          </ul>
          <div>
            🥳 App successfully hosted. Try creating a new todo.
            <br />
            <a href="https://next-release-dev.d1ywzrxfkb9wgg.amplifyapp.com/react/start/quickstart/vite-react-app/#step-2-add-delete-to-do-functionality">
              Review next step of this tutorial.
            </a>
          </div>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
