import { useState, useEffect } from 'react';

/**
 * Component to help user configure Google OAuth
 * Shows a helpful message with direct link to Google Console
 */
const GoogleOAuthConfigHelper = () => {
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    // Show helper after page loads (if there are likely Google OAuth errors)
    // We check by looking at network errors in console
    const timer = setTimeout(() => {
      // Check if there are Google OAuth related errors in the console
      // Since we can't directly access network errors, we'll show the helper
      // if the user is on the login page (where Google OAuth is used)
      const isLoginPage = window.location.pathname === '/' || 
                         window.location.pathname.includes('login');
      
      if (isLoginPage) {
        // Show helper after 2 seconds to let errors appear first
        setShowHelper(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!showHelper) {
    return null;
  }

  const currentOrigin = window.location.origin;
  const googleConsoleUrl = `https://console.cloud.google.com/apis/credentials?project=check-469407`;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      maxWidth: '400px',
      backgroundColor: '#fff',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      zIndex: 10000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          color: '#1f2937',
          fontWeight: '600'
        }}>
          ⚠️ Cần Cấu Hình Google OAuth
        </h3>
        <button
          onClick={() => setShowHelper(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>
      
      <p style={{
        margin: '0 0 16px 0',
        fontSize: '14px',
        color: '#4b5563',
        lineHeight: '1.5'
      }}>
        Để fix lỗi 403, bạn cần thêm origin vào Google Console:
      </p>

      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontFamily: 'monospace',
        fontSize: '13px',
        wordBreak: 'break-all'
      }}>
        {currentOrigin}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <a
          href={googleConsoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          🔗 Mở Google Console
        </a>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(currentOrigin);
            alert('Đã copy origin vào clipboard!');
          }}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          📋 Copy Origin
        </button>
      </div>

      <p style={{
        margin: '12px 0 0 0',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.4'
      }}>
        💡 Sau khi thêm origin, đợi 5-10 phút và refresh trang
      </p>
    </div>
  );
};

export default GoogleOAuthConfigHelper;

