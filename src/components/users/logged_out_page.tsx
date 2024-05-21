import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';

import { Link } from 'react-router-dom';

function UserLoggedOutPage() {
  return (
    <Container>
      <Row className="px-4 my-5">
        <Col
          xs={4}
          sm={6}
        >
          <Image
            src="/img/logo.png"
            fluid
          />
        </Col>
        <Col sm={6}>
          <p className="todo">
            You have been logged out. Click <strong>OK</strong> to return to the home page.
          </p>
        </Col>
      </Row>
      <Link to="/">
        <Button variant="primary">OK</Button>
      </Link>
    </Container>
  );
}

export default UserLoggedOutPage;
