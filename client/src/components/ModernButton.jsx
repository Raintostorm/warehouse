import { Icons } from '../utils/icons';

const ModernButton = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    onClick,
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
    ...props
}) => {
    const variants = {
        primary: {
            bg: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            hover: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
            color: 'white',
        },
        secondary: {
            bg: '#e2e8f0',
            hover: '#cbd5e1',
            color: '#334155',
        },
        success: {
            bg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            hover: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            color: 'white',
        },
        danger: {
            bg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            hover: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
            color: 'white',
        },
        warning: {
            bg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            hover: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            color: 'white',
        },
        ghost: {
            bg: 'transparent',
            hover: '#f1f5f9',
            color: '#475569',
        },
    };

    const sizes = {
        sm: { padding: '8px 16px', fontSize: '14px', iconSize: 16 },
        md: { padding: '12px 24px', fontSize: '15px', iconSize: 18 },
        lg: { padding: '16px 32px', fontSize: '16px', iconSize: 20 },
    };

    const style = variants[variant] || variants.primary;
    const sizeStyle = sizes[size] || sizes.md;

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`modern-button ${className}`}
            style={{
                background: disabled ? '#e5e7eb' : style.bg,
                color: disabled ? '#9ca3af' : style.color,
                border: 'none',
                borderRadius: '12px',
                padding: sizeStyle.padding,
                fontSize: sizeStyle.fontSize,
                fontWeight: '600',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                width: fullWidth ? '100%' : 'auto',
                boxShadow: disabled ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                opacity: disabled ? 0.6 : 1,
                ...props.style
            }}
            onMouseEnter={(e) => {
                if (!disabled && !loading) {
                    e.currentTarget.style.background = style.hover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled && !loading) {
                    e.currentTarget.style.background = style.bg;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
            }}
            {...props}
        >
            {loading ? (
                <>
                    <span style={{
                        display: 'inline-block',
                        width: sizeStyle.iconSize,
                        height: sizeStyle.iconSize,
                        border: `2px solid ${disabled ? '#9ca3af' : 'rgba(255,255,255,0.3)'}`,
                        borderTop: `2px solid ${disabled ? '#9ca3af' : style.color}`,
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }}></span>
                    Đang xử lý...
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    {children}
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </button>
    );
};

export default ModernButton;

