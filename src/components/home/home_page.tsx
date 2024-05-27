import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

import { Link } from 'react-router-dom';

interface PageProperties {
  isUserLoggedIn: () => boolean;
};

export function HomePage(props: PageProperties) {
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
        <p><strong>Welcome</strong> to <span className="neuro">NEURO</span><span className="servo" >SERVO</span>'s <span className="app-name">Horizon</span>.</p>
        <br />
        <p>
          This is a cloud-based application allowing to remotely monitor the live-feed of patients' electroencephalogram (EEG) signals as there are being recorded by the <span className="neuro">NEURO</span><span className="servo" >SERVO</span>'s <span className="app-name">VEEGix8</span> device and iPad app. Additionally, it can also be used to review previous recording sessions.
        </p>
      </span>
      <br/>
      <br/>
      {!props.isUserLoggedIn() && (
        <>
          <Link
            className="ms-auto"
            to="/users/login"
          >
            <Button variant="primary" >Login</Button>
          </Link>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Link
            className="ms-auto"
            to="/users/sign_up"
          >
            <Button variant="primary" >Sign-Up</Button>
          </Link>
        </>
      )}
      {props.isUserLoggedIn() && (
        <Link
          to="/sessions/select"
        >
          <Button variant="primary" >Select Sessions</Button>
        </Link>
      )}
    </Container>
  );
}

export default HomePage;
