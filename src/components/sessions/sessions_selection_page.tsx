import { useEffect } from 'react';

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';

import { useNavigate } from 'react-router-dom';

interface PageProperties {
  isUserLoggedIn: boolean;
}

function SessionsSelectPage(props: PageProperties) {
  const navigate = useNavigate();

  useEffect(() => {
    {
      !props.isUserLoggedIn && navigate('/');
    }
  }, []);

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
          <h1 className="font-weight-light">Select a recording session.</h1>
          <p className="todo">
            TO DO: Present the user with a list of recordings in a grid to select a recording.
            <br />
            Preferably the most recent recordings will appear first. Later, we could add support to save preferences and
            possibly filtering.
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default SessionsSelectPage;
