import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import { Icons } from '../utils/icons';

/**
 * GoogleLoginButton Component - Single Responsibility: Handle Google OAuth login
 * Uses GoogleLogin component which handles script loading automatically
 */
const GoogleLoginButton = ({ onError, themeColors }) => {
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const { loginWithGoogle, registerWithGoogle } = useAuth();
    const googleLoginRef = useRef(null);

    // Check if Google script is loaded
    useEffect(() => {
        const checkScript = () => {
            if (window.google && window.google.accounts) {
                setScriptLoaded(true);
            } else {
                // Retry after 1 second
                setTimeout(checkScript, 1000);
            }
        };
        
        // Initial check
        checkScript();
        
        // Also listen for script load event
        const handleScriptLoad = () => {
            setScriptLoaded(true);
        };
        
        window.addEventListener('load', handleScriptLoad);
        return () => window.removeEventListener('load', handleScriptLoad);
    }, []);

    // Google icon SVG component
    const GoogleIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            if (onError) onError('');
            
            if (!credentialResponse || !credentialResponse.credential) {
                throw new Error('Failed to receive token from Google');
            }
            
            // Thử login trước
            const loginResult = await loginWithGoogle(credentialResponse.credential, false);
            
            if (!loginResult.success) {
                // Kiểm tra xem có phải lỗi "User not found" không
                const isUserNotFound = loginResult.error && (
                    loginResult.error.includes('not found') || 
                    loginResult.error.includes('chưa đăng ký') ||
                    loginResult.error.includes('Please register')
                );
                
                if (isUserNotFound) {
                    // Nếu user chưa tồn tại, tự động register
                    const registerResult = await registerWithGoogle(credentialResponse.credential, {}, false);
                    
                    if (!registerResult.success) {
                        if (onError) {
                            onError(registerResult.error || 'Auto registration failed. Please try again.');
                        }
                    }
                } else {
                    // Lỗi khác
                    if (onError) {
                        onError(loginResult.error || 'Google login failed');
                    }
                }
            }
        } catch (err) {
            console.error('❌ Google auth error:', err);
            if (onError) {
                const errorMsg = err.response?.data?.error || err.message || 'An error occurred during Google login';
                onError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = (error) => {
        console.error('❌ Google OAuth error:', error);
        setLoading(false);
        if (onError) {
            if (error?.error === 'popup_closed_by_user') {
                onError('You closed the login window. Please try again.');
            } else if (error?.error === 'access_denied') {
                onError('You denied access. Please allow to login.');
            } else {
                const errorDetails = error?.error || error?.type || JSON.stringify(error);
                onError(`Google login failed: ${errorDetails}. If error 403, please check Google Console configuration.`);
            }
        }
    };

    const triggerGoogleLogin = () => {
        if (!scriptLoaded) {
            if (onError) {
                onError('Google OAuth script is still loading. Please wait a few seconds and try again.');
            }
            return;
        }

        // Try multiple ways to trigger GoogleLogin button
        const container = googleLoginRef.current;
        if (!container) {
            if (onError) {
                onError('Google Login component not found. Please refresh the page.');
            }
            return;
        }

        // Method 1: Find iframe and click
        const iframe = container.querySelector('iframe[title*="Sign in with Google"]');
        if (iframe) {
            iframe.click();
            return;
        }

        // Method 2: Find button element
        const button = container.querySelector('button, div[role="button"]');
        if (button) {
            button.click();
            return;
        }

        // Method 3: Find any clickable element
        const clickable = container.querySelector('[onclick], [data-testid*="google"]');
        if (clickable) {
            clickable.click();
            return;
        }

        if (onError) {
            onError('Could not find Google login button. Please refresh the page.');
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* GoogleLogin component - hidden but functional */}
            <div
                ref={googleLoginRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '52px',
                    opacity: 0,
                    zIndex: 2,
                    pointerEvents: 'auto',
                    overflow: 'hidden'
                }}
            >
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    auto_select={false}
                />
            </div>

            {/* Custom styled button overlay */}
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerGoogleLogin();
                }}
                disabled={loading || !scriptLoaded}
                style={{
                    width: '100%',
                    height: '52px',
                    padding: '0 24px',
                    background: themeColors?.buttonBg || '#ffffff',
                    border: themeColors?.buttonBorder || '2px solid #e2e8f0',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (loading || !scriptLoaded) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: themeColors?.buttonText || '#334155',
                    boxShadow: themeColors?.buttonShadow || '0 4px 12px -4px rgba(0, 0, 0, 0.1)',
                    opacity: (loading || !scriptLoaded) ? 0.6 : 1,
                    zIndex: 1,
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    if (!loading && scriptLoaded) {
                        e.currentTarget.style.borderColor = themeColors?.buttonHoverBorder || '#cbd5e1';
                        e.currentTarget.style.boxShadow = themeColors?.buttonHoverShadow || '0 8px 16px -4px rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!loading && scriptLoaded) {
                        e.currentTarget.style.borderColor = themeColors?.buttonBorder || '#e2e8f0';
                        e.currentTarget.style.boxShadow = themeColors?.buttonShadow || '0 4px 12px -4px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }}
            >
                <GoogleIcon />
                {loading ? 'Processing...' : !scriptLoaded ? 'Loading Google...' : 'Sign in with Google'}
            </button>
        </div>
    );
};

export default GoogleLoginButton;
