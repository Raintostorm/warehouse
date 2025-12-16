import { useState, useEffect } from 'react';
import { useTheme } from '../src/contexts/ThemeContext';
import { Icons } from '../src/utils/icons';
import ModernButton from '../src/components/ModernButton';
import ModernInput from '../src/components/ModernInput';
import { authAPI } from '../services/api';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(null);
    const { isDark } = useTheme();

    // Theme-aware colors
    const bgGradient = isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #475569 0%, #334155 100%)';
    const cardBg = isDark 
        ? 'rgba(30, 41, 59, 0.98)'
        : 'rgba(255, 255, 255, 0.98)';
    const textSecondary = isDark ? '#cbd5e1' : '#64748b';

    // Get token from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!password || !confirmPassword) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (!token) {
            setError('Token không hợp lệ');
            return;
        }

        setLoading(true);

        try {
            const data = await authAPI.resetPassword(token, password);
            if (data.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                setError(data.error || 'Không thể đặt lại mật khẩu');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.error || err.message || 'Không thể đặt lại mật khẩu. Link có thể đã hết hạn.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
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
                {/* Animated background */}
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
                    maxWidth: '480px',
                    width: '100%',
                    padding: '56px 48px',
                    background: cardBg,
                    backdropFilter: 'blur(20px)',
                    borderRadius: '28px',
                    boxShadow: isDark 
                        ? '0 32px 64px -12px rgba(0, 0, 0, 0.6)'
                        : '0 32px 64px -12px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    transition: 'background 0.3s ease, box-shadow 0.3s ease'
                }}>
                    <div style={{
                        width: '88px',
                        height: '88px',
                        margin: '0 auto 28px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 32px -8px rgba(22, 163, 74, 0.5)'
                    }}>
                        <Icons.Success size={44} color="white" />
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '36px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '12px'
                    }}>
                        Đặt lại mật khẩu thành công!
                    </h1>
                    <p style={{
                        color: textSecondary,
                        fontSize: '16px',
                        margin: '0 0 32px 0',
                        lineHeight: '1.5',
                        transition: 'color 0.3s ease'
                    }}>
                        Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
                    </p>
                    <ModernButton
                        onClick={() => window.location.href = '/'}
                        variant="primary"
                        size="lg"
                        fullWidth
                        icon={<Icons.Security size={20} />}
                        style={{
                            height: '52px',
                            fontSize: '16px',
                            fontWeight: '700'
                        }}
                    >
                        Đi đến trang đăng nhập
                    </ModernButton>
                </div>
            </div>
        );
    }

    return (
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
                        Đặt lại mật khẩu
                    </h1>
                    <p style={{
                        color: textSecondary,
                        fontSize: '16px',
                        margin: 0,
                        lineHeight: '1.5',
                        transition: 'color 0.3s ease'
                    }}>
                        Nhập mật khẩu mới cho tài khoản của bạn
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

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <ModernInput
                        label="Mật khẩu mới"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        required
                        autoComplete="new-password"
                        icon={<Icons.Password size={20} />}
                        error={error && error.includes('Mật khẩu') ? error : null}
                    />

                    <ModernInput
                        label="Xác nhận mật khẩu"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        autoComplete="new-password"
                        icon={<Icons.Password size={20} />}
                        error={error && error.includes('khớp') ? error : null}
                    />

                    <ModernButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                        icon={<Icons.Security size={20} />}
                        style={{
                            marginTop: '8px',
                            height: '52px',
                            fontSize: '16px',
                            fontWeight: '700',
                            boxShadow: '0 8px 16px -4px rgba(71, 85, 105, 0.4)'
                        }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </ModernButton>
                </form>

                <div style={{
                    marginTop: '24px',
                    textAlign: 'center'
                }}>
                    <button
                        type="button"
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.color = '#475569';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                        }}
                    >
                        ← Quay lại đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

