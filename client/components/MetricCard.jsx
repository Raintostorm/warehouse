import { Icons } from '../src/utils/icons';

const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend = null, 
    trendLabel = null,
    color = '#3b82f6',
    formatValue = (v) => v
}) => {
    const gradient = `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;

    return (
        <div style={{
            padding: '24px',
            background: gradient,
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '12px'
            }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    {title}
                </div>
                {Icon && (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Icon size={20} color="white" />
                    </div>
                )}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                {formatValue(value)}
            </div>
            {trend !== null && trendLabel && (
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% {trendLabel}
                </div>
            )}
        </div>
    );
};

export default MetricCard;

