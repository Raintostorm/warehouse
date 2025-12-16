// Import error suppression FIRST, before any other imports
// This ensures Google OAuth errors are suppressed as early as possible
import './utils/suppressGoogleErrors.js';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import './styles/global.css';
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '586869650679-aq36mi8vkeu09tkcv1o3v1gn8lu9b1th.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
    >
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
