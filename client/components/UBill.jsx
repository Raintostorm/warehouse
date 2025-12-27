import { useState, useEffect } from 'react';
import { billAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import Modal from '../src/components/Modal';

const UBill = ({ billId, onBillUpdated, onClose }) => {
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [bill, setBill] = useState(null);
    const [billOrders, setBillOrders] = useState([]);
    const [formData, setFormData] = useState({
        total_amount: '',
        status: 'pending'
    });

    useEffect(() => {
        fetchBill();
    }, [billId]);

    const fetchBill = async () => {
        try {
            setLoading(true);
            const [billResponse, ordersResponse] = await Promise.all([
                billAPI.getBillById(billId),
                billAPI.getOrdersByBillId(billId).catch(() => ({ success: false, data: [] }))
            ]);
            
            if (billResponse.success) {
                const billData = billResponse.data;
                
                // Check if bill is paid - if so, show error and close
                if (billData.status === 'paid') {
                    showError('Cannot edit a paid bill. Bill status is "paid".');
                    onClose();
                    return;
                }
                
                setBill(billData);
                setFormData({
                    total_amount: billData.total_amount || billData.totalAmount || '',
                    status: billData.status || 'pending'
                });
                
                // Set orders
                if (ordersResponse.success) {
                    setBillOrders(ordersResponse.data || []);
                } else if (billData.order_id || billData.orderId) {
                    // Fallback to single order_id
                    setBillOrders([{ id: billData.order_id || billData.orderId }]);
                }
            } else {
                showError('Failed to load bill: ' + billResponse.message);
                onClose();
            }
        } catch (err) {
            showError('Failed to load bill: ' + (err.response?.data?.error || err.message));
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
            showError('Total amount must be greater than 0');
            return;
        }

        try {
            setLoading(true);
            const response = await billAPI.updateBill(billId, {
                total_amount: parseFloat(formData.total_amount),
                status: formData.status
            });

            if (response.success) {
                showSuccess('Bill updated successfully!');
                onBillUpdated();
            } else {
                showError(response.message || 'Failed to update bill');
            }
        } catch (err) {
            showError(err.response?.data?.error || err.message || 'Failed to update bill');
        } finally {
            setLoading(false);
        }
    };

    if (!bill) {
        return null;
    }

    const isPaid = bill.status === 'paid';

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Edit Bill${isPaid ? ' (Paid - Read Only)' : ''}`}
            size="medium"
        >
            {isPaid && (
                <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: '#92400e',
                    fontSize: '14px'
                }}>
                    ⚠️ This bill is paid and cannot be edited.
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Bill ID
                    </label>
                    <input
                        type="text"
                        value={bill.id}
                        disabled
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Orders ({billOrders.length})
                    </label>
                    <div style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: '#f3f4f6',
                        minHeight: '40px',
                        maxHeight: '150px',
                        overflowY: 'auto'
                    }}>
                        {billOrders.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {billOrders.map((order, idx) => (
                                    <div key={order.id || order.Id || idx} style={{
                                        padding: '6px 10px',
                                        background: 'white',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        color: '#374151',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        {order.id || order.Id || '-'}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>No orders</span>
                        )}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Total Amount (₫) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.total_amount}
                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                        required
                        disabled={isPaid}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: isPaid ? '#f3f4f6' : 'white',
                            color: isPaid ? '#6b7280' : '#1f2937',
                            cursor: isPaid ? 'not-allowed' : 'text'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                        Status
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        disabled={isPaid}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: isPaid ? '#f3f4f6' : 'white',
                            color: isPaid ? '#6b7280' : '#1f2937',
                            cursor: isPaid ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || isPaid}
                        style={{
                            padding: '10px 20px',
                            background: (loading || isPaid) ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (loading || isPaid) ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: (loading || isPaid) ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Updating...' : isPaid ? 'Cannot Update Paid Bill' : 'Update Bill'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UBill;

