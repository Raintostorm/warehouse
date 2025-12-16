import { useTheme } from '../contexts/ThemeContext';

const ModernInput = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    error,
    icon,
    fullWidth = true,
    ...props
}) => {
    const { isDark } = useTheme();

    const labelColor = isDark ? '#cbd5e1' : '#374151';
    const inputBg = isDark ? '#1e293b' : '#ffffff';
    const inputColor = isDark ? '#f1f5f9' : '#1f2937';
    const borderColor = error ? '#ef4444' : (isDark ? '#334155' : '#e5e7eb');
    const iconColor = isDark ? '#64748b' : '#9ca3af';
    return (
        <div style={{ width: fullWidth ? '100%' : 'auto', marginBottom: '20px' }}>
            {label && (
                <label style={{
                    display: 'flex',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: labelColor,
                    fontSize: '14px',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'color 0.3s ease'
                }}>
                    {label}
                    {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                {icon && (
                    <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: iconColor,
                        zIndex: 1,
                        transition: 'color 0.3s ease'
                    }}>
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        width: '100%',
                        padding: icon ? '12px 16px 12px 48px' : '12px 16px',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.3s',
                        backgroundColor: inputBg,
                        color: inputColor,
                        boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = error ? '#ef4444' : '#475569';
                        e.currentTarget.style.boxShadow = error
                            ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                            : '0 0 0 3px rgba(71, 85, 105, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? '#ef4444' : '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    {...props}
                />
            </div>
            {error && (
                <p style={{
                    marginTop: '6px',
                    fontSize: '13px',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span>⚠️</span> {error}
                </p>
            )}
        </div>
    );
};

export default ModernInput;

