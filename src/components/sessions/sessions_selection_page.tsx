import { useEffect } from 'react';

import Container from 'react-bootstrap/Container';

import { useNavigate } from 'react-router-dom';

interface PageProperties {
  isUserLoggedIn: () => boolean;
}

function SessionsSelectPage(props: PageProperties) {
  const navigate = useNavigate();

  useEffect(() => {
    { !props.isUserLoggedIn() && navigate('/'); }
  }, []);

  return (
    <Container fluid>
      <h1 className="font-weight-light" >Select a recording session.</h1>
      <p className="todo" >
        <strong>TO DO:</strong>
        <br />
        Present the user with a table of recording sessions that they'll select to open one.
        <br />
        <br />
        The sessions associated to a live-feed shall appear first, followed by recent sessions then onto older ones.
        <br />
        In a later version, include a feature in which users define query filters and save those preferences.
      </p>
    </Container>
  );
}

export default SessionsSelectPage;
