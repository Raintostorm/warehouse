import { Icons } from '../src/utils/icons';

const BulkActions = ({ 
    selectedCount, 
    onBulkDelete, 
    onSelectAll, 
    onDeselectAll,
    isAllSelected,
    totalItems,
    isAdmin = false
}) => {
    if (!isAdmin || selectedCount === 0) return null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #fbbf24',
            boxShadow: '0 2px 4px rgba(251, 191, 36, 0.2)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1
            }}>
                <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#92400e'
                }}>
                    Đã chọn: <strong>{selectedCount}</strong> mục
                </span>
                <button
                    onClick={isAllSelected ? onDeselectAll : onSelectAll}
                    style={{
                        padding: '6px 12px',
                        background: 'white',
                        color: '#92400e',
                        border: '1px solid #fbbf24',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fef3c7';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                    }}
                >
                    {isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${totalItems})`}
                </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={onBulkDelete}
                    style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                    }}
                >
                    <Icons.Delete size={16} /> Xóa đã chọn
                </button>
            </div>
        </div>
    );
};

export default BulkActions;

