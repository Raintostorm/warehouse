import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Icons } from '../utils/icons';
import ModernButton from './ModernButton';
import ModernInput from './ModernInput';

/**
 * LoginForm Component - Single Responsibility: Handle login form logic and UI
 * Open/Closed: Can be extended without modification
 */
const LoginForm = ({ onForgotPasswordClick, themeColors }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <ModernInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
                icon={<Icons.Email size={20} />}
                error={error && error.includes('email') ? error : null}
            />

            <ModernInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                icon={<Icons.Password size={20} />}
                error={error && error.includes('password') ? error : null}
            />

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '8px',
                marginBottom: '24px'
            }}>
                <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: themeColors?.textSecondary || '#475569',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors?.hoverBg || '#f1f5f9';
                        e.currentTarget.style.color = themeColors?.textPrimary || '#334155';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = themeColors?.textSecondary || '#475569';
                    }}
                >
                    Forgot password?
                </button>
            </div>

            <ModernButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={<Icons.Security size={20} />}
                style={{ 
                    marginTop: '4px',
                    height: '52px',
                    fontSize: '16px',
                    fontWeight: '700',
                    boxShadow: '0 8px 16px -4px rgba(71, 85, 105, 0.4)'
                }}
            >
                {loading ? 'Logging in...' : 'Login'}
            </ModernButton>
        </form>
    );
};

export default LoginForm;

