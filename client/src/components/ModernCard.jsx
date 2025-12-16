import { Icons } from '../utils/icons';

const ModernCard = ({ 
    children, 
    title, 
    icon, 
    gradient = 'primary',
    className = '',
    onClick,
    hover = true
}) => {
    const gradients = {
        primary: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
        secondary: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        success: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        warm: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    };

    return (
        <div
            onClick={onClick}
            className={`modern-card ${hover ? 'card-hover' : ''} ${className}`}
            style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                if (hover) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                }
            }}
            onMouseLeave={(e) => {
                if (hover) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }
            }}
        >
            {title && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #f3f4f6'
                }}>
                    {icon && (
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: gradients[gradient] || gradients.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            {icon}
                        </div>
                    )}
                    <h2 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#1f2937',
                        background: gradients[gradient] || gradients.primary,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {title}
                    </h2>
                </div>
            )}
            {children}
        </div>
    );
};

export default ModernCard;

