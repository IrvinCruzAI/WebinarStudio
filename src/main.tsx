import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise,
  });
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('[Global] Unhandled error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
