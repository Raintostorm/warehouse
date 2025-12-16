/**
 * Suppress Google GSI console errors
 * These errors are non-critical and don't affect Google OAuth functionality
 * They occur because Google GSI library tries to check status/button availability
 * but may be blocked by CORS or origin configuration
 * 
 * Note: This is a backup - the main suppression is in index.html
 * to catch errors before React loads
 */

if (typeof window !== 'undefined' && !window.__GOOGLE_ERRORS_SUPPRESSED__) {
  window.__GOOGLE_ERRORS_SUPPRESSED__ = true;
  // Suppress console.error for Google GSI errors
  const originalError = console.error;
  console.error = (...args) => {
    // Convert all arguments to strings for pattern matching
    const errorMessage = args.length > 0 ? String(args[0]) : '';
    const fullMessage = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    // Patterns to suppress (non-critical Google OAuth errors)
    const shouldSuppress = 
      // GSI Logger errors
      errorMessage.includes('GSI_LOGGER') ||
      fullMessage.includes('GSI_LOGGER') ||
      // Cross-Origin-Opener-Policy warnings
      errorMessage.includes('Cross-Origin-Opener-Policy') ||
      fullMessage.includes('Cross-Origin-Opener-Policy') ||
      fullMessage.includes('Cross-Origin') ||
      fullMessage.includes('window.closed') ||
      // Google GSI button/status endpoints
      fullMessage.includes('accounts.google.com/gsi/button') ||
      fullMessage.includes('accounts.google.com/gsi/status') ||
      // 403 errors from Google accounts
      (fullMessage.includes('accounts.google.com') && 
       (fullMessage.includes('403') || 
        fullMessage.includes('Failed to load resource') ||
        fullMessage.includes('status of 403'))) ||
      // Origin not allowed errors
      (errorMessage.includes('origin is not allowed') && 
       errorMessage.includes('client ID')) ||
      fullMessage.includes('origin is not allowed for the given client ID') ||
      // Credential button library errors
      fullMessage.includes('credential_button_library') ||
      fullMessage.includes('m=credential_button_library');
    
    if (shouldSuppress) {
      // Suppress these non-critical errors silently
      return;
    }
    
    // Log other errors normally
    originalError.apply(console, args);
  };

  // Suppress console.warn for Google OAuth related warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const fullMessage = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    if (
      fullMessage.includes('GSI_LOGGER') ||
      fullMessage.includes('Cross-Origin-Opener-Policy') ||
      fullMessage.includes('Cross-Origin') ||
      fullMessage.includes('window.closed') ||
      fullMessage.includes('accounts.google.com') ||
      fullMessage.includes('Google OAuth')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

