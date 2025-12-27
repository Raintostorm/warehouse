import { useState, useEffect } from 'react';
import { supplierImportHistoryAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

const SupplierImportHistory = ({ supplierId, supplierName, onClose }) => {
    const { error: showError } = useToast();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (supplierId) {
            fetchHistory();
        }
    }, [supplierId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await supplierImportHistoryAPI.getHistoryBySupplier(supplierId);
            if (response.success) {
                setHistory(response.data || []);
            } else {
                showError('Failed to load import history');
            }
        } catch (err) {
            showError('Failed to load import history: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Lịch sử nhập hàng - ${supplierName || 'Supplier'}`}
            size="large"
        >
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    Đang tải...
                </div>
            ) : history.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    <Icons.Info size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Chưa có lịch sử nhập hàng</p>
                </div>
            ) : (
                <div style={{
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'white'
                    }}>
                        <thead style={{
                            position: 'sticky',
                            top: 0,
                            backgroundColor: '#f8f9fa',
                            zIndex: 10
                        }}>
                            <tr style={{
                                borderBottom: '2px solid #dee2e6'
                            }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Ngày nhập</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Sản phẩm</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Kho</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Số lượng</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Đơn hàng</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    style={{
                                        borderBottom: '1px solid #e9ecef',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>
                                        {formatDate(item.import_date || item.importDate)}
                                    </td>
                                    <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{item.product_name || item.productName || item.product_id || item.productId}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>ID: {item.product_id || item.productId}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>
                                        {item.warehouse_name || item.warehouseName || item.warehouse_id || item.warehouseId}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                                        {new Intl.NumberFormat('vi-VN').format(item.quantity || 0)}
                                    </td>
                                    <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>
                                        {item.order_id || item.orderId}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>
                                        {item.notes || <span style={{ color: '#999' }}>-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
};

export default SupplierImportHistory;

