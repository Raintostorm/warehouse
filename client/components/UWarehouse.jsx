import { useState, useEffect } from 'react';
import { warehouseAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

const UWarehouse = ({ warehouseId, onWarehouseUpdated, onClose }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        address: '',
        size: '',
        type: '',
        started_date: '',
        end_date: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (warehouseId) {
            fetchWarehouse();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [warehouseId]);

    const fetchWarehouse = async () => {
        try {
            setLoadingData(true);
            const response = await warehouseAPI.getWarehouseById(warehouseId);
            if (response.success) {
                const warehouse = response.data;
                setFormData({
                    id: warehouse.id || warehouse.Id || '',
                    name: warehouse.name || warehouse.Name || '',
                    address: warehouse.address || warehouse.Address || '',
                    size: warehouse.size || warehouse.Size || '',
                    type: warehouse.type || warehouse.Type || '',
                    started_date: warehouse.started_date || warehouse.startedDate || warehouse.StartedDate || '',
                    end_date: warehouse.end_date || warehouse.endDate || warehouse.EndDate || ''
                });
            } else {
                showError('Failed to fetch warehouse: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Failed to fetch warehouse: ' + (err.response?.data?.error || err.message || 'Unknown error'));
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await warehouseAPI.updateWarehouse(warehouseId, {
                name: formData.name,
                address: formData.address,
                size: formData.size ? parseFloat(formData.size) : null,
                type: formData.type,
                started_date: formData.started_date || null,
                end_date: formData.end_date || null
            });

            if (response.success) {
                showSuccess('Warehouse updated successfully!');
                if (onWarehouseUpdated) {
                    onWarehouseUpdated();
                }
                if (onClose) {
                    onClose();
                }
            } else {
                showError('Update error: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Update warehouse error: ' + (err.response?.data?.error || err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Edit Warehouse"
            size="large"
        >
            {loadingData ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #475569',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#666', fontSize: '16px' }}>Loading...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                ID
                            </label>
                            <input
                                type="text"
                                value={formData.id}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Warehouse Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter warehouse name"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter warehouse address"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Size (m²)
                            </label>
                            <input
                                type="number"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="Enter warehouse size"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Type
                            </label>
                            <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                placeholder="Enter warehouse type"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Started Date
                            </label>
                            <input
                                type="date"
                                name="started_date"
                                value={formData.started_date ? formData.started_date.split('T')[0] : ''}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                    </div>

                    <div style={{
                        padding: '16px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500', marginBottom: '4px' }}>
                            ⚠️ Note
                        </div>
                        <div style={{ fontSize: '13px', color: '#78350f' }}>
                            Products and stock quantities in this warehouse cannot be edited here. Use import/sale orders to manage inventory.
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
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
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {loading ? 'Updating...' : 'Update Warehouse'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default UWarehouse;

