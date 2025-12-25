import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';

const StockAdjustmentModal = ({ isOpen, onClose, productId, warehouseId, products, warehouses }) => {
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingStock, setFetchingStock] = useState(false);
    const [currentStock, setCurrentStock] = useState(null);
    const [formData, setFormData] = useState({
        newQuantity: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && productId) {
            fetchCurrentStock();
            setFormData({ newQuantity: '', notes: '' });
            setErrors({});
        }
    }, [isOpen, productId, warehouseId]);

    const fetchCurrentStock = async () => {
        try {
            setFetchingStock(true);
            const response = await inventoryAPI.getCurrentStock(productId, warehouseId);
            if (response.success) {
                setCurrentStock(response.data?.currentStock || 0);
                setFormData(prev => ({ ...prev, newQuantity: response.data?.currentStock || 0 }));
            } else {
                showError('Failed to fetch current stock: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching stock: ' + (err.response?.data?.error || err.message));
        } finally {
            setFetchingStock(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (formData.newQuantity === '' || formData.newQuantity === null || formData.newQuantity === undefined) {
            newErrors.newQuantity = 'Vui lòng nhập số lượng mới';
        } else if (parseInt(formData.newQuantity) < 0) {
            newErrors.newQuantity = 'Số lượng không được âm';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const adjustmentData = {
                warehouseId: warehouseId || null,
                newQuantity: parseInt(formData.newQuantity),
                notes: formData.notes || 'Manual stock adjustment'
            };

            const response = await inventoryAPI.adjustStock(productId, adjustmentData);
            if (response.success) {
                showSuccess('Stock adjusted successfully!');
                onClose();
            } else {
                showError(response.message || 'Adjustment failed');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const product = products.find(p => p.id === productId);
    const warehouse = warehouses.find(w => w.id === warehouseId);

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
                maxWidth: '500px',
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
                        Điều Chỉnh Tồn Kho
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

                {/* Product Info */}
                <div style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary, #f9fafb)',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Sản Phẩm: </span>
                        <span style={{ fontWeight: '500' }}>{product?.name || productId}</span>
                    </div>
                    {warehouse && (
                        <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>Kho: </span>
                            <span style={{ fontWeight: '500' }}>{warehouse.name}</span>
                        </div>
                    )}
                    {!warehouse && (
                        <div>
                            <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                Toàn hệ thống
                            </span>
                        </div>
                    )}
                    {fetchingStock ? (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Loader className="animate-spin" size={16} />
                            <span style={{ fontSize: '12px', color: '#666' }}>Đang tải...</span>
                        </div>
                    ) : currentStock !== null && (
                        <div style={{ marginTop: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>Tồn kho hiện tại: </span>
                            <span style={{ fontWeight: '600', fontSize: '16px', color: '#3b82f6' }}>
                                {currentStock.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* New Quantity */}
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Số Lượng Mới <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.newQuantity}
                                onChange={(e) => setFormData({ ...formData, newQuantity: e.target.value })}
                                min="0"
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: `1px solid ${errors.newQuantity ? '#ef4444' : 'var(--border-color, #e5e7eb)'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }}
                            />
                            {errors.newQuantity && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.newQuantity}
                                </div>
                            )}
                            {currentStock !== null && formData.newQuantity && !errors.newQuantity && (
                                <div style={{ 
                                    fontSize: '12px', 
                                    marginTop: '4px',
                                    color: parseInt(formData.newQuantity) > currentStock ? '#10b981' : 
                                           parseInt(formData.newQuantity) < currentStock ? '#f59e0b' : '#666'
                                }}>
                                    {parseInt(formData.newQuantity) > currentStock 
                                        ? `Tăng: +${(parseInt(formData.newQuantity) - currentStock).toLocaleString()}`
                                        : parseInt(formData.newQuantity) < currentStock
                                        ? `Giảm: ${(parseInt(formData.newQuantity) - currentStock).toLocaleString()}`
                                        : 'Không thay đổi'
                                    }
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
                                placeholder="Lý do điều chỉnh..."
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
                            disabled={loading || fetchingStock}
                            style={{
                                padding: '10px 20px',
                                background: loading || fetchingStock
                                    ? '#9ca3af'
                                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading || fetchingStock ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {(loading || fetchingStock) && <Icons.Loader className="animate-spin" size={16} />}
                            Cập Nhật
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;

