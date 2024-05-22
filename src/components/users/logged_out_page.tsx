import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

import { Link } from 'react-router-dom';

function UserLoggedOutPage() {
  return (
    <Container fluid>
      <h1>
        <img
          src="/img/logo.png"
          width="50"
          height="auto"
        />
        <span className="neuro">NEURO</span>
        <span className="servo" >SERVO</span>
      </h1>
      <h2 className="app-name" >
        Horizon
      </h2>
      <br />
      <br />
      <span className="greeting-text">
        <p>You have been logged out of the application.</p>
        <p>Click <strong>OK</strong> to return back to the home page.</p>
      </span>
      <br />
      <br />
      <Link to="/" >
        <Button variant="primary" >OK</Button>
      </Link>
    </Container>
  );
}

export default UserLoggedOutPage;
