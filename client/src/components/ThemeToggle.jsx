import { useTheme } from '../contexts/ThemeContext';
import { Icons } from '../utils/icons';

const ThemeToggle = () => {
    const { theme: _theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                border: 'none',
                background: isDark 
                    ? 'linear-gradient(135deg, #475569 0%, #334155 100%)' 
                    : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                color: isDark ? '#fbbf24' : '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isDark 
                    ? '0 4px 12px -4px rgba(0, 0, 0, 0.4)' 
                    : '0 4px 12px -4px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 6px 16px -4px rgba(0, 0, 0, 0.5)'
                    : '0 6px 16px -4px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 4px 12px -4px rgba(0, 0, 0, 0.4)'
                    : '0 4px 12px -4px rgba(0, 0, 0, 0.1)';
            }}
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
            {isDark ? (
                <Icons.Sun size={24} />
            ) : (
                <Icons.Moon size={24} />
            )}
        </button>
    );
};

export default ThemeToggle;

