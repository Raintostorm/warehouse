import { useState } from 'react';
import { productAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';
import FileManager from './FileManager';

const CProduct = ({ onProductCreated }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: '',
        unit: '',
        number: '',
        price: '',
        supplierId: ''
    });
    const [loading, setLoading] = useState(false);
    const [fileManagerModal, setFileManagerModal] = useState({ isOpen: false, productId: null });

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
            const response = await productAPI.createProduct({
                ...formData,
                number: formData.number ? parseInt(formData.number) : null,
                price: formData.price ? parseFloat(formData.price) : null
            });

            if (response.success) {
                showSuccess('Product created successfully!');
                const productId = response.data?.id || formData.id;
                setFormData({
                    id: '',
                    name: '',
                    type: '',
                    unit: '',
                    number: '',
                    price: '',
                    supplierId: ''
                });
                setIsModalOpen(false);
                // Open FileManager modal to upload images
                if (productId) {
                    setFileManagerModal({ isOpen: true, productId });
                }
                if (onProductCreated) {
                    onProductCreated();
                }
            } else {
                showError(response.message || 'Failed to create product');
            }
        } catch (err) {
            showError(err.response?.data?.error || err.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setFormData({
            id: '',
            name: '',
            type: '',
            unit: '',
            number: '',
            price: '',
            supplierId: ''
        });
    };

    if (!isAdmin) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)',
                    transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(71, 85, 105, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(71, 85, 105, 0.3)';
                }}
            >
                <Icons.Add size={20} /> Create New Product
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title="Create New Product"
                size="large"
            >
                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                ID <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="id"
                                value={formData.id}
                                onChange={handleChange}
                                required
                                placeholder="Enter product ID"
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
                                Product Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter product name"
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
                                Loại
                            </label>
                            <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                placeholder="Enter product type"
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
                                Unit
                            </label>
                            <input
                                type="text"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                placeholder="Enter unit (kg, liter, piece...)"
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
                                Quantity
                            </label>
                            <input
                                type="number"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                placeholder="Enter quantity"
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
                                Price
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Enter price"
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
                                Supplier ID
                            </label>
                            <input
                                type="text"
                                name="supplierId"
                                value={formData.supplierId}
                                onChange={handleChange}
                                placeholder="Enter supplier ID"
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
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                background: loading
                                    ? '#94a3b8'
                                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
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
                                    <Icons.Success size={16} /> Create Product
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {fileManagerModal.isOpen && (
                <Modal
                    isOpen={fileManagerModal.isOpen}
                    onClose={() => setFileManagerModal({ isOpen: false, productId: null })}
                    title={`Manage Images - Product ${fileManagerModal.productId}`}
                    size="xlarge"
                >
                    <FileManager
                        entityType="product"
                        entityId={fileManagerModal.productId}
                    />
                </Modal>
            )}
        </>
    );
};

export default CProduct;
