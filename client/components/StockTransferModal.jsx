import { useState, useEffect } from 'react';
import { stockTransferAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';

const StockTransferModal = ({ isOpen, onClose, transferId = null, products, warehouses }) => {
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (transferId) {
                fetchTransfer();
            } else {
                setFormData({
                    productId: '',
                    fromWarehouseId: '',
                    toWarehouseId: '',
                    quantity: '',
                    notes: ''
                });
                setErrors({});
            }
        }
    }, [isOpen, transferId]);

    const fetchTransfer = async () => {
        try {
            setLoading(true);
            const response = await stockTransferAPI.getTransferById(transferId);
            if (response.success) {
                const transfer = response.data;
                setFormData({
                    productId: transfer.product_id || transfer.productId || '',
                    fromWarehouseId: transfer.from_warehouse_id || transfer.fromWarehouseId || '',
                    toWarehouseId: transfer.to_warehouse_id || transfer.toWarehouseId || '',
                    quantity: transfer.quantity || '',
                    notes: transfer.notes || ''
                });
            } else {
                showError('Failed to fetch transfer: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching transfer: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.productId) newErrors.productId = 'Vui lòng chọn sản phẩm';
        if (!formData.fromWarehouseId) newErrors.fromWarehouseId = 'Vui lòng chọn kho nguồn';
        if (!formData.toWarehouseId) newErrors.toWarehouseId = 'Vui lòng chọn kho đích';
        if (formData.fromWarehouseId === formData.toWarehouseId) {
            newErrors.toWarehouseId = 'Kho đích phải khác kho nguồn';
        }
        if (!formData.quantity || formData.quantity <= 0) {
            newErrors.quantity = 'Số lượng phải lớn hơn 0';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const transferData = {
                productId: formData.productId,
                fromWarehouseId: formData.fromWarehouseId,
                toWarehouseId: formData.toWarehouseId,
                quantity: parseInt(formData.quantity),
                notes: formData.notes
            };

            let response;
            if (transferId) {
                response = await stockTransferAPI.updateTransfer(transferId, transferData);
            } else {
                response = await stockTransferAPI.createTransfer(transferData);
            }

            if (response.success) {
                showSuccess(`Transfer ${transferId ? 'updated' : 'created'} successfully!`);
                onClose();
            } else {
                showError(response.message || 'Operation failed');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'var(--bg-primary, #fff)',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                        {transferId ? 'Chỉnh Sửa Chuyển Kho' : 'Tạo Chuyển Kho'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666'
                        }}
                    >
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Product */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Sản Phẩm <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={formData.productId}
                                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                disabled={!!transferId}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: `1px solid ${errors.productId ? '#ef4444' : 'var(--border-color, #e5e7eb)'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: transferId ? '#f3f4f6' : 'white'
                                }}
                            >
                                <option value="">Chọn sản phẩm</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.id})
                                    </option>
                                ))}
                            </select>
                            {errors.productId && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.productId}
                                </div>
                            )}
                        </div>

                        {/* From Warehouse */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Kho Nguồn <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={formData.fromWarehouseId}
                                onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                                disabled={!!transferId}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: `1px solid ${errors.fromWarehouseId ? '#ef4444' : 'var(--border-color, #e5e7eb)'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: transferId ? '#f3f4f6' : 'white'
                                }}
                            >
                                <option value="">Chọn kho nguồn</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} ({w.id})
                                    </option>
                                ))}
                            </select>
                            {errors.fromWarehouseId && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.fromWarehouseId}
                                </div>
                            )}
                        </div>

                        {/* To Warehouse */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Kho Đích <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={formData.toWarehouseId}
                                onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                                disabled={!!transferId}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: `1px solid ${errors.toWarehouseId ? '#ef4444' : 'var(--border-color, #e5e7eb)'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    background: transferId ? '#f3f4f6' : 'white'
                                }}
                            >
                                <option value="">Chọn kho đích</option>
                                {warehouses
                                    .filter(w => w.id !== formData.fromWarehouseId)
                                    .map(w => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} ({w.id})
                                        </option>
                                    ))}
                            </select>
                            {errors.toWarehouseId && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.toWarehouseId}
                                </div>
                            )}
                        </div>

                        {/* Quantity */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Số Lượng <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                min="1"
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: `1px solid ${errors.quantity ? '#ef4444' : 'var(--border-color, #e5e7eb)'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }}
                            />
                            {errors.quantity && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.quantity}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Ghi Chú
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: '1px solid var(--border-color, #e5e7eb)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        marginTop: '24px',
                        paddingTop: '24px',
                        borderTop: '1px solid var(--border-color, #e5e7eb)'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--bg-secondary, #f3f4f6)',
                                color: 'var(--text-primary, #1a1a1a)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                background: loading 
                                    ? '#9ca3af' 
                                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading && <Icons.Loader className="animate-spin" size={16} />}
                            {transferId ? 'Cập Nhật' : 'Tạo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockTransferModal;

