import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installDragScroll } from '../dragScroll.ts';
import { NotFound } from './NotFound.tsx';
import '../styles/tokens.css';
import '../styles/global.css';

// hold the right mouse button and drag to move the page
installDragScroll();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotFound />
  </StrictMode>,
);
