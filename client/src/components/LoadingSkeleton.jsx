import { useTheme } from '../contexts/ThemeContext';

/**
 * LoadingSkeleton Component
 * Reusable skeleton loader for content placeholders
 */
const LoadingSkeleton = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    count = 1,
    style = {}
}) => {
    const { isDark } = useTheme();

    const skeletonBg = isDark
        ? 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)'
        : 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)';

    const skeletonStyle = {
        width,
        height,
        borderRadius,
        background: skeletonBg,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style
    };

    if (count === 1) {
        return <div style={skeletonStyle} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} style={skeletonStyle} />
            ))}
        </div>
    );
};

/**
 * CardSkeleton Component
 * Skeleton loader for card components
 */
export const CardSkeleton = ({ count = 1 }) => {
    const { isDark } = useTheme();

    const cardBg = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    const cardStyle = {
        background: cardBg,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${borderColor}`,
        boxShadow: isDark
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };

    if (count === 1) {
        return (
            <div style={cardStyle}>
                <LoadingSkeleton width="60%" height="24px" borderRadius="8px" style={{ marginBottom: '16px' }} />
                <LoadingSkeleton width="100%" height="16px" borderRadius="6px" style={{ marginBottom: '8px' }} />
                <LoadingSkeleton width="80%" height="16px" borderRadius="6px" />
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} style={cardStyle}>
                    <LoadingSkeleton width="60%" height="24px" borderRadius="8px" style={{ marginBottom: '16px' }} />
                    <LoadingSkeleton width="100%" height="16px" borderRadius="6px" style={{ marginBottom: '8px' }} />
                    <LoadingSkeleton width="80%" height="16px" borderRadius="6px" />
                </div>
            ))}
        </div>
    );
};

/**
 * TableSkeleton Component
 * Skeleton loader for table components
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    const { isDark } = useTheme();

    const tableBg = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    return (
        <div style={{
            background: tableBg,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${borderColor}`,
            overflow: 'hidden'
        }}>
            {/* Header skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${borderColor}` }}>
                {Array.from({ length: columns }).map((_, index) => (
                    <LoadingSkeleton key={index} width="80%" height="20px" borderRadius="6px" />
                ))}
            </div>
            {/* Rows skeleton */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px', marginBottom: '12px' }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <LoadingSkeleton key={colIndex} width="90%" height="16px" borderRadius="6px" />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;
