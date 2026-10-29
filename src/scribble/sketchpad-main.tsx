import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Sketchpad } from './Sketchpad.tsx';
import '../styles/tokens.css';
import '../styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sketchpad />
  </StrictMode>,
);
