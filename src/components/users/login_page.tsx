import * as AWS_Auth from 'aws-amplify/auth';

import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import { useNavigate, Link } from 'react-router-dom';

interface PageProperties {
    updateLoggedIn: (param: boolean) => void;
};

export default function UserLoginPage(props: PageProperties) {
    const navigate = useNavigate();

    const [userName, setUserName] = useState('');
    const [userPassword, setUserPassword] = useState('');

    const handleUserLogin = async () => {
        try {
            console.debug(`Logging into AWS. userName: ${userName}`);

            const signInResult = await AWS_Auth.signIn(userName, userPassword);

            props.updateLoggedIn(signInResult.isSignedIn);

            if (signInResult.isSignedIn) {
                navigate('/sessions/select');
            }

        } catch (error) {
            console.error(`Failed to login. Reason: ${error}`);
        }
    }

    return (
        <Container>
            <Row className="px-4 my-5">
                <Col><h1>Login</h1></Col>
            </Row>
            <Row className="px-4 my-5">
                <Col sm={6}>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>User Name</Form.Label>
                            <Form.Control type="text" placeholder="Enter User Name"
                                onChange={evt => setUserName(evt.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" minLength={8} placeholder="Enter Password"
                                onChange={evt => setUserPassword(evt.target.value)} />
                        </Form.Group>

                        <Button variant="primary" type="button"
                            onClick={handleUserLogin}>Login &gt;&gt;</Button>
                        &nbsp;&nbsp;
                        <Link
                            to='/users/sign_up'>
                            <Button variant="outline-primary">Sign-Up</Button>
                        </Link>
                        &nbsp;&nbsp;
                        <Link
                            to='/'>
                            <Button variant="outline-primary">Cancel</Button>
                        </Link>
                    </Form>
                </Col>
            </Row>
        </Container>
    )
}