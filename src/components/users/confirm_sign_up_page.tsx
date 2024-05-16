import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import * as AWS_Auth from 'aws-amplify/auth';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

export default function UserConfirmSignUpPage() {
    const navigate = useNavigate();

    const [userName, setUserName] = useState('');
    const [authenticationCode, setAuthenticationCode] = useState('');

    const handleRegisterConfirmation = async () => {
        try {
            console.log('handleRegisterConfirmation')
            console.log(userName);
            console.log(authenticationCode);

            const confirmSignUpResult = await AWS_Auth.confirmSignUp(userName, authenticationCode);

            if (confirmSignUpResult.isSignUpComplete) {
                navigate('/users/login');
            }
        } catch (error) {
            console.error(`Failed to confirm sign-up. Reason: ${error}`);
        }
    }

    return (
        <Container>
            <Row className="px-4 my-5">
                <Col><h1>Sign-Up Confirmation</h1></Col>
            </Row>
            <Row className="px-4 my-5">
                <Col sm={6}>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>User Name</Form.Label>
                            <Form.Control type="text" placeholder="Enter User Name"
                                onChange={evt => setUserName(evt.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>Authentication Code</Form.Label>
                            <Form.Control type="text" placeholder="Enter Authentication Code"
                                onChange={evt => setAuthenticationCode(evt.target.value)} />
                        </Form.Group>

                        <Button variant="primary" type="button"
                            onClick={handleRegisterConfirmation}>Confirm &gt;&gt;</Button>
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