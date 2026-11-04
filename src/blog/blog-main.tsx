import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Blog } from './Blog.tsx';
import '../styles/tokens.css';
import '../styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Blog />
  </StrictMode>,
);
