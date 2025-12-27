import { useState, useEffect } from 'react';
import { stockTransferAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import StockTransferModal from './StockTransferModal';
import ConfirmationModal from '../src/components/ConfirmationModal';

const StockTransfers = ({ products, warehouses, onRefresh }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    const { success: showSuccess, error: showError } = useToast();
    
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transferModal, setTransferModal] = useState({ isOpen: false, transferId: null });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, transferId: null });

    useEffect(() => {
        fetchTransfers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            const response = await stockTransferAPI.getAllTransfers();
            if (response.success) {
                setTransfers(response.data || []);
            } else {
                showError('Failed to fetch transfers: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching transfers: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (id) => {
        setConfirmModal({ isOpen: true, action: 'approve', transferId: id });
    };

    const handleCancel = (id) => {
        setConfirmModal({ isOpen: true, action: 'cancel', transferId: id });
    };

    const confirmAction = async () => {
        const { action, transferId } = confirmModal;
        try {
            let response;
            if (action === 'approve') {
                response = await stockTransferAPI.approveTransfer(transferId);
            } else if (action === 'cancel') {
                response = await stockTransferAPI.cancelTransfer(transferId);
            }

            if (response.success) {
                showSuccess(`Transfer ${action === 'approve' ? 'approved' : 'cancelled'} successfully!`);
                fetchTransfers();
                if (onRefresh) onRefresh();
            } else {
                showError(response.message || 'Action failed');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        }
        setConfirmModal({ isOpen: false, action: null, transferId: null });
    };

    const statusColors = {
        'pending': { bg: '#fef3c7', color: '#d97706', label: 'Chờ Duyệt' },
        'in_transit': { bg: '#dbeafe', color: '#2563eb', label: 'Đang Vận Chuyển' },
        'completed': { bg: '#d1fae5', color: '#059669', label: 'Hoàn Thành' },
        'cancelled': { bg: '#fee2e2', color: '#dc2626', label: 'Đã Hủy' }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Icons.Loader className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: '12px', color: '#666' }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                    Danh Sách Chuyển Kho
                </h2>
                {(isAdmin || isManager) && (
                    <button
                        onClick={() => setTransferModal({ isOpen: true, transferId: null })}
                        style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Icons.Plus size={18} />
                        Tạo Chuyển Kho
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                }}>
                    <thead>
                        <tr style={{ 
                            background: 'var(--bg-tertiary, #f9fafb)',
                            borderBottom: '2px solid var(--border-color, #e5e7eb)'
                        }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Mã</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sản Phẩm</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Từ Kho</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Đến Kho</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Số Lượng</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Trạng Thái</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ngày Tạo</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ 
                                    padding: '40px', 
                                    textAlign: 'center', 
                                    color: '#999' 
                                }}>
                                    Không có chuyển kho nào
                                </td>
                            </tr>
                        ) : (
                            transfers.map((transfer) => {
                                const product = products.find(p => p.id === transfer.product_id);
                                const fromWarehouse = warehouses.find(w => w.id === transfer.from_warehouse_id);
                                const toWarehouse = warehouses.find(w => w.id === transfer.to_warehouse_id);
                                const statusInfo = statusColors[transfer.status] || statusColors.pending;

                                return (
                                    <tr 
                                        key={transfer.id}
                                        style={{ 
                                            borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px', fontWeight: '500' }}>
                                            {transfer.id}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {product?.name || transfer.product_id}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {transfer.product_id}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {fromWarehouse?.name || transfer.from_warehouse_id}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {toWarehouse?.name || transfer.to_warehouse_id}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                                            {transfer.quantity?.toLocaleString() || 0}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                background: statusInfo.bg,
                                                color: statusInfo.color
                                            }}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {new Date(transfer.created_at).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {(isAdmin || isManager) && transfer.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(transfer.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(transfer.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                )}
                                                {transfer.status === 'in_transit' && (isAdmin || isManager) && (
                                                    <button
                                                        onClick={() => handleCancel(transfer.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        Hủy
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {transferModal.isOpen && (
                <StockTransferModal
                    isOpen={transferModal.isOpen}
                    onClose={() => {
                        setTransferModal({ isOpen: false, transferId: null });
                        fetchTransfers();
                    }}
                    transferId={transferModal.transferId}
                    products={products}
                    warehouses={warehouses}
                />
            )}

            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, action: null, transferId: null })}
                    onConfirm={confirmAction}
                    title={confirmModal.action === 'approve' ? 'Duyệt Chuyển Kho' : 'Hủy Chuyển Kho'}
                    message={confirmModal.action === 'approve' 
                        ? 'Bạn có chắc chắn muốn duyệt chuyển kho này? Hành động này sẽ cập nhật số lượng tồn kho.'
                        : 'Bạn có chắc chắn muốn hủy chuyển kho này?'
                    }
                />
            )}
        </div>
    );
};

export default StockTransfers;

