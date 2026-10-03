import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '../index.css';
import H5App from './H5App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <H5App />
    </HashRouter>
  </React.StrictMode>,
);
