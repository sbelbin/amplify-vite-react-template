import * as AWS_Auth from 'aws-amplify/auth';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useNavigate } from 'react-router-dom';

interface NavigationProperties {
    isLoggedIn: boolean;
    updateLoggedIn: (param: boolean) => void;
};

export default function SiteNavigation(props: NavigationProperties) {
    const navigate = useNavigate();

    const handleUserLogout = async () => {
        try {
            console.debug('Logging out.');

            await AWS_Auth.signOut();

            props.updateLoggedIn(false);
            navigate('/');
        } catch (error) {
            console.error(`Failed to sign-out user. Reason: ${error}`);
        }
    }

    return (
        <header>
            <Navbar bg="dark" expand="lg" variant="dark">
                <Container>
                    <Navbar.Brand><Nav.Link href="/">Contacts App</Nav.Link></Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                            <Navbar.Collapse id="basic-navbar-nav">
                                {
                                    props.isLoggedIn && (
                                        <Nav className="ms-md-auto">
                                            <Nav.Link onClick={handleUserLogout}>Logout</Nav.Link>
                                        </Nav>
                                    )
                                }
                                {
                                    !props.isLoggedIn && (
                                        <Nav className="ms-md-auto">
                                            <Nav.Link href="/login">Login</Nav.Link>
                                            <Nav.Link href="/sign_up">Sign-Up</Nav.Link>
                                        </Nav>
                                    )
                                }
                            </Navbar.Collapse>
                </Container>
            </Navbar>
        </header>
    )
}