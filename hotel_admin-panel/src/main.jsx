import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress harmless browser extension message-channel errors
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || (typeof event.reason === 'string' ? event.reason : '');
  if (
    msg.includes('A listener indicated an asynchronous response by returning true') ||
    msg.includes('message channel closed before a response was received')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
