import App from './App';
import './index.css';
import outputs from '../amplify_outputs.json';

import { Amplify } from 'aws-amplify';

import ReactDOM from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

Amplify.configure(outputs);

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
