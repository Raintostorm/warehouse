import { Icons } from '../utils/icons';

const ModernTable = ({ 
    headers, 
    data, 
    renderRow, 
    emptyMessage = 'Chưa có dữ liệu',
    loading = false,
    onRowClick
}) => {
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '80px 20px',
                background: 'white',
                borderRadius: '16px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #f3f4f6',
                        borderTop: '4px solid #667eea',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 24px'
                    }}></div>
                    <p style={{ color: '#6b7280', fontSize: '16px', margin: 0, fontWeight: '500' }}>
                        Đang tải dữ liệu...
                    </p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'white',
                borderRadius: '16px',
                border: '2px dashed #e5e7eb'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icons.Search size={40} color="#9ca3af" />
                </div>
                <p style={{
                    fontSize: '18px',
                    color: '#6b7280',
                    margin: 0,
                    fontWeight: '500'
                }}>
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white'
                }}>
                    <thead>
                        <tr style={{
                            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    style={{
                                        padding: '16px 20px',
                                        textAlign: header.align || 'left',
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {header.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick && onRowClick(item)}
                                style={{
                                    borderBottom: '1px solid #f3f4f6',
                                    transition: 'all 0.2s',
                                    cursor: onRowClick ? 'pointer' : 'default'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                    if (onRowClick) {
                                        e.currentTarget.style.transform = 'scale(1.01)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    if (onRowClick) {
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}
                            >
                                {renderRow(item, rowIndex)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModernTable;

