import { useTheme } from '../contexts/ThemeContext';

/**
 * LoadingSpinner Component
 * Reusable loading spinner with theme support
 */
const LoadingSpinner = ({
    size = 50,
    color,
    text,
    fullScreen = false,
    style = {}
}) => {
    const { isDark } = useTheme();

    const spinnerColor = color || '#475569';
    const textColor = isDark ? '#cbd5e1' : '#6b7280';
    const bgColor = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';

    const spinnerStyle = {
        width: `${size}px`,
        height: `${size}px`,
        border: `4px solid ${isDark ? '#334155' : '#f3f3f3'}`,
        borderTop: `4px solid ${spinnerColor}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto',
        ...style
    };

    const containerStyle = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: bgColor,
        zIndex: 9999,
        backdropFilter: 'blur(10px)'
    } : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
            {text && (
                <p style={{
                    margin: '16px 0 0 0',
                    color: textColor,
                    fontSize: '16px',
                    textAlign: 'center'
                }}>
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
