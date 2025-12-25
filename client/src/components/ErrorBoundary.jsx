import React from 'react';
import { Icons } from '../utils/icons';

/**
 * ErrorBoundary Component
 * Catches React component errors and displays a user-friendly error message
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Log error to error reporting service in production
        // You can integrate with services like Sentry, LogRocket, etc.
        if (import.meta.env.PROD) {
            // Example: logErrorToService(error, errorInfo);
        }

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    onReset={this.handleReset}
                    onReload={this.handleReload}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Error Fallback UI Component
 * Note: This component cannot use useTheme() because ErrorBoundary is outside ThemeProvider
 * We use a default theme or check localStorage directly
 */
const ErrorFallback = ({ error, errorInfo, onReset, onReload }) => {
    // Get theme from localStorage directly since we're outside ThemeProvider
    const getTheme = () => {
        try {
            const theme = localStorage.getItem('theme');
            return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } catch {
            return false;
        }
    };
    const isDark = getTheme();

    const bgGradient = isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
    const cardBg = isDark
        ? 'rgba(30, 41, 59, 0.95)'
        : 'rgba(255, 255, 255, 0.95)';
    const textPrimary = isDark ? '#f1f5f9' : '#1f2937';
    const textSecondary = isDark ? '#cbd5e1' : '#6b7280';
    const borderColor = isDark ? '#334155' : '#e5e7eb';
    const errorColor = '#ef4444';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: bgGradient,
            transition: 'background 0.3s ease'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                padding: '40px',
                background: cardBg,
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                boxShadow: isDark
                    ? '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(51, 65, 85, 0.3)'
                    : '0 32px 64px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                border: `1px solid ${borderColor}`,
                animation: 'fadeIn 0.5s ease-out'
            }}>
                {/* Error Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 24px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 32px -8px rgba(239, 68, 68, 0.3)'
                }}>
                    <Icons.Warning size={44} color={errorColor} />
                </div>

                {/* Error Title */}
                <h1 style={{
                    margin: '0 0 12px 0',
                    fontSize: '28px',
                    fontWeight: '700',
                    color: textPrimary,
                    textAlign: 'center'
                }}>
                    Something went wrong
                </h1>

                {/* Error Message */}
                <p style={{
                    margin: '0 0 32px 0',
                    color: textSecondary,
                    fontSize: '16px',
                    textAlign: 'center',
                    lineHeight: '1.6'
                }}>
                    We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
                </p>

                {/* Error Details (Development only) */}
                {import.meta.env.DEV && error && (
                    <details style={{
                        marginBottom: '32px',
                        padding: '16px',
                        background: isDark ? '#1e293b' : '#f9fafb',
                        borderRadius: '12px',
                        border: `1px solid ${borderColor}`
                    }}>
                        <summary style={{
                            cursor: 'pointer',
                            color: textSecondary,
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '12px'
                        }}>
                            Error Details (Development)
                        </summary>
                        <pre style={{
                            margin: 0,
                            padding: '12px',
                            background: isDark ? '#0f172a' : '#ffffff',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: errorColor,
                            overflow: 'auto',
                            maxHeight: '200px',
                            border: `1px solid ${borderColor}`
                        }}>
                            {error.toString()}
                            {errorInfo && errorInfo.componentStack && (
                                <>
                                    {'\n\nComponent Stack:'}
                                    {errorInfo.componentStack}
                                </>
                            )}
                        </pre>
                    </details>
                )}

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={onReset}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(71, 85, 105, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.3)';
                        }}
                    >
                        <Icons.Refresh size={18} />
                        Try Again
                    </button>
                    <button
                        onClick={onReload}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: textPrimary,
                            border: `2px solid ${borderColor}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? '#334155' : '#f1f5f9';
                            e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = borderColor;
                        }}
                    >
                        <Icons.Settings size={18} />
                        Reload Page
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: textPrimary,
                            border: `2px solid ${borderColor}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? '#334155' : '#f1f5f9';
                            e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = borderColor;
                        }}
                    >
                        <Icons.Users size={18} />
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;
