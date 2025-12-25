import { useState, useEffect } from 'react';
import { orderAPI, billAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

const CreateBill = ({ onClose }) => {
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [allOrderDetails, setAllOrderDetails] = useState([]); // All products from selected orders
    const [selectedProducts, setSelectedProducts] = useState([]); // Selected product IDs with order info
    const [loadingData, setLoadingData] = useState(false);
    const [showPDFConfirm, setShowPDFConfirm] = useState(false);

    // Load orders when modal opens
    useEffect(() => {
        if (orders.length === 0) {
            fetchOrders();
        }
    }, []);


    const fetchOrders = async () => {
        try {
            setLoadingOrders(true);
            const ordersResponse = await orderAPI.getAllOrders();
            const billsResponse = await billAPI.getAllBills();
            
            if (ordersResponse.success && billsResponse.success) {
                const allOrders = ordersResponse.data || [];
                const allBills = billsResponse.data || [];
                
                // Filter out:
                // 1. gateway_payment orders (these are temporary orders created for payments, not real orders)
                // 2. Orders that already have bills
                const ordersWithoutBills = allOrders.filter(order => {
                    const orderId = order.id || order.Id;
                    const orderType = order.type || order.Type;
                    
                    // Exclude gateway_payment orders
                    if (orderType === 'gateway_payment') {
                        return false;
                    }
                    
                    // Exclude orders that already have bills
                    return !allBills.some(bill => (bill.order_id || bill.orderId) === orderId);
                });
                
                // Sort by created_at DESC (most recent first)
                ordersWithoutBills.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.CreatedAt || 0);
                    const dateB = new Date(b.created_at || b.CreatedAt || 0);
                    return dateB - dateA;
                });
                
                setOrders(ordersWithoutBills);
            }
        } catch (err) {
            showError('Failed to load orders: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoadingOrders(false);
        }
    };


    const handleToggleOrder = (orderId) => {
        setSelectedOrderIds(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId);
            } else {
                return [...prev, orderId];
            }
        });
    };

    const handleSelectAllOrders = () => {
        if (selectedOrderIds.length === orders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(orders.map(o => o.id || o.Id));
        }
    };


    const handleGenerateBill = () => {
        if (selectedOrderIds.length === 0) {
            showError('Vui lòng chọn ít nhất một đơn hàng');
            return;
        }
        // Show confirmation modal to ask if user wants PDF
        setShowPDFConfirm(true);
    };

    const handleConfirmCreateBill = async (createPDF) => {
        setShowPDFConfirm(false);
        
        try {
            setLoading(true);

            if (createPDF) {
                // Generate bill với PDF từ tất cả selected orders
                const response = await orderAPI.generateBill(selectedOrderIds);

                // Create blob and download
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `bill-${selectedOrderIds.join('-')}-${Date.now()}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                showSuccess('Tạo hóa đơn PDF thành công!');
            } else {
                // Chỉ tạo bill records (không tạo PDF)
                const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id || o.Id));
                
                for (const order of selectedOrders) {
                    const orderId = order.id || order.Id;
                    try {
                        await billAPI.createBill({
                            orderId: orderId,
                            totalAmount: order.total || 0,
                            status: 'pending'
                        });
                    } catch (err) {
                        // Nếu bill đã tồn tại, bỏ qua và tiếp tục với order tiếp theo
                        if (err.response?.data?.error?.includes('already exists')) {
                            continue;
                        }
                        throw err;
                    }
                }

                showSuccess(`Đã tạo ${selectedOrders.length} hóa đơn thành công!`);
            }

            // Clear selected orders
            setSelectedOrderIds([]);
            
            // Refresh orders list to update filtered list (wait for it to complete)
            await fetchOrders();
            
            // Close modal after refresh completes
            if (onClose) {
                onClose();
            }
        } catch (err) {
            showError('Không thể tạo hóa đơn: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return orders
            .filter(o => selectedOrderIds.includes(o.id || o.Id))
            .reduce((sum, order) => sum + (order.total || 0), 0);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create Invoice" size="large">
            <div style={{ padding: '20px 0' }}>
                {/* Order Selection */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
                            Select Orders ({selectedOrderIds.length}/{orders.length})
                        </h3>
                        <button
                            type="button"
                            onClick={handleSelectAllOrders}
                            style={{
                                padding: '8px 16px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {selectedOrderIds.length === orders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>

                    {loadingOrders ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            Loading orders...
                        </div>
                    ) : (
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}>
                            {orders.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                    Không có đơn hàng nào
                                </div>
                            ) : (
                                <div style={{ padding: '8px' }}>
                                    {orders.map((order) => {
                                        const orderId = order.id || order.Id;
                                        const isSelected = selectedOrderIds.includes(orderId);
                                        return (
                                            <div
                                                key={orderId}
                                                onClick={() => handleToggleOrder(orderId)}
                                                style={{
                                                    padding: '12px',
                                                    borderBottom: '1px solid #e5e7eb',
                                                    backgroundColor: isSelected ? '#f0f9ff' : 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleOrder(orderId)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                                                        {orderId}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        {order.customer_name || order.customerName || 'N/A'} • {order.date ? new Date(order.date).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                                                    {order.total ? new Intl.NumberFormat('vi-VN').format(order.total) + ' đ' : 'N/A'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Total */}
                {selectedOrderIds.length > 0 && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#334155' }}>Tổng cộng:</span>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#475569' }}>
                            {new Intl.NumberFormat('vi-VN').format(calculateTotal())} đ
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                        onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleGenerateBill}
                        disabled={loading || selectedOrderIds.length === 0}
                        style={{
                            padding: '12px 24px',
                            background: loading || selectedOrderIds.length === 0
                                ? '#94a3b8'
                                : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading || selectedOrderIds.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? (
                            <>
                                <Icons.Loading size={16} /> Creating...
                            </>
                        ) : (
                            <>
                                <Icons.Success size={16} /> Create Invoice
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* PDF Confirmation Modal */}
            {showPDFConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }} onClick={() => setShowPDFConfirm(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        minWidth: '400px',
                        maxWidth: '500px',
                        zIndex: 10001
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#334155' }}>
                            Tạo hóa đơn PDF?
                        </h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                            Bạn có muốn tạo file PDF cho hóa đơn không? Nếu không, hệ thống sẽ chỉ tạo bản ghi hóa đơn trong cơ sở dữ liệu.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowPDFConfirm(false);
                                    handleConfirmCreateBill(false);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Không, chỉ tạo bản ghi
                            </button>
                            <button
                                onClick={() => {
                                    setShowPDFConfirm(false);
                                    handleConfirmCreateBill(true);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Có, tạo PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CreateBill;
