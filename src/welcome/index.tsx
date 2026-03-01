import React from 'react';
import { createRoot } from 'react-dom/client';
import Welcome from './Welcome';
import './welcome.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Welcome />
    </React.StrictMode>
  );
}
