import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NotFound } from './NotFound.tsx';
import '../styles/tokens.css';
import '../styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotFound />
  </StrictMode>,
);
