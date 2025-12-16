import { useState } from 'react';
import { useTheme } from '../src/contexts/ThemeContext';
import { Icons } from '../src/utils/icons';
import LoginForm from '../src/components/LoginForm';
import GoogleLoginButton from '../src/components/GoogleLoginButton';
import ForgotPasswordModal from '../src/components/ForgotPasswordModal';

/**
 * Login Component - Composition of smaller components
 * Single Responsibility: Orchestrate login page layout and state
 * Open/Closed: Easy to extend with new auth methods
 */
const Login = () => {
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const { isDark } = useTheme();

    // Theme-aware colors
    const bgGradient = isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #475569 0%, #334155 100%)';
    const cardBg = isDark 
        ? 'rgba(30, 41, 59, 0.98)'
        : 'rgba(255, 255, 255, 0.98)';
    const textPrimary = isDark ? '#f1f5f9' : '#1f2937';
    const textSecondary = isDark ? '#cbd5e1' : '#64748b';
    
    const themeColors = {
        textPrimary,
        textSecondary,
        buttonBg: isDark ? '#1e293b' : '#ffffff',
        buttonBorder: isDark ? '2px solid #334155' : '2px solid #e2e8f0',
        buttonText: isDark ? '#f1f5f9' : '#334155',
        buttonShadow: isDark 
            ? '0 4px 12px -4px rgba(0, 0, 0, 0.4)'
            : '0 4px 12px -4px rgba(0, 0, 0, 0.1)',
        buttonHoverBorder: isDark ? '#475569' : '#cbd5e1',
        buttonHoverShadow: isDark
            ? '0 8px 16px -4px rgba(0, 0, 0, 0.5)'
            : '0 8px 16px -4px rgba(0, 0, 0, 0.15)',
        hoverBg: isDark ? '#1e293b' : '#f1f5f9'
    };

    return (
        <>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: bgGradient,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.3s ease'
            }}>
                {/* Animated background elements */}
                <div style={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    top: '-300px',
                    right: '-300px',
                    animation: 'pulse 6s ease-in-out infinite'
                }}></div>
                <div style={{
                    position: 'absolute',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    bottom: '-250px',
                    left: '-250px',
                    animation: 'pulse 8s ease-in-out infinite'
                }}></div>

                <div style={{
                    maxWidth: '480px',
                    width: '100%',
                    padding: '56px 48px',
                    background: cardBg,
                    backdropFilter: 'blur(20px)',
                    borderRadius: '28px',
                    boxShadow: isDark 
                        ? '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(51, 65, 85, 0.3)'
                        : '0 32px 64px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    zIndex: 1,
                    animation: 'fadeIn 0.6s ease-out',
                    transition: 'background 0.3s ease, box-shadow 0.3s ease'
                }}>
                    {/* Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '48px'
                    }}>
                        <div style={{
                            width: '88px',
                            height: '88px',
                            margin: '0 auto 28px',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 12px 32px -8px rgba(71, 85, 105, 0.5)'
                        }}>
                            <Icons.Security size={44} color="white" />
                        </div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '36px',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '12px',
                            letterSpacing: '-0.5px'
                        }}>
                            Login
                        </h1>
                        <p style={{
                            color: textSecondary,
                            fontSize: '16px',
                            margin: 0,
                            lineHeight: '1.5',
                            transition: 'color 0.3s ease'
                        }}>
                            Welcome back! Please login to continue
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '16px 20px',
                            marginBottom: '24px',
                            backgroundColor: '#fef2f2',
                            border: '2px solid #fecaca',
                            borderRadius: '16px',
                            color: '#dc2626',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            animation: 'slideIn 0.3s ease-out',
                            boxShadow: '0 4px 12px -4px rgba(220, 38, 38, 0.2)'
                        }}>
                            <Icons.Warning size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ lineHeight: '1.5' }}>{error}</span>
                        </div>
                    )}

                    {/* Info Message */}
                    {info && (
                        <div style={{
                            padding: '16px 20px',
                            marginBottom: '24px',
                            backgroundColor: '#ecfdf5',
                            border: '2px solid #bbf7d0',
                            borderRadius: '16px',
                            color: '#166534',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            animation: 'slideIn 0.3s ease-out',
                            boxShadow: '0 4px 12px -4px rgba(22, 101, 52, 0.2)'
                        }}>
                            <Icons.Info size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ lineHeight: '1.5' }}>{info}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <LoginForm 
                        onForgotPasswordClick={() => setIsForgotPasswordOpen(true)}
                        themeColors={themeColors}
                    />

                    {/* Divider */}
                    <div style={{
                        marginTop: '40px',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: isDark ? '#334155' : '#e2e8f0',
                            transition: 'background 0.3s ease'
                        }}></div>
                        <div style={{
                            marginBottom: '16px',
                            color: isDark ? '#64748b' : '#94a3b8',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'color 0.3s ease'
                        }}>
                            Hoặc
                        </div>
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: isDark ? '#334155' : '#e2e8f0',
                            transition: 'background 0.3s ease'
                        }}></div>
                    </div>

                    {/* Google Login Button */}
                    <GoogleLoginButton 
                        onError={setError}
                        themeColors={themeColors}
                    />
                </div>
            </div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
                onSuccess={() => {
                    setInfo('Email đặt lại mật khẩu đã được gửi!');
                    setIsForgotPasswordOpen(false);
                }}
                themeColors={themeColors}
            />
        </>
    );
};

export default Login;
