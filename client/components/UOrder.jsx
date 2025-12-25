import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { orderAPI, productAPI, orderDetailAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useAuth } from '../src/contexts/useAuth';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

// Reuse ProductSelectDropdown from COrder
const ProductSelectDropdown = ({ value, products, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const filteredProducts = products.filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const name = (p.name || p.Name || '').toLowerCase();
        const id = (p.id || p.Id || '').toLowerCase();
        const type = (p.type || p.Type || '').toLowerCase();
        return name.includes(search) || id.includes(search) || type.includes(search);
    });

    const selectedProduct = products.find(p => (p.id || p.Id) === value);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const updatePosition = () => {
                const rect = triggerRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                });
            };
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleClickOutside, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleClickOutside, true);
        };
    }, [isOpen]);

    const dropdownContent = isOpen && (
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                backgroundColor: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 10001,
                maxHeight: '300px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ position: 'relative' }}>
                    <Icons.Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#475569'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        autoFocus
                    />
                </div>
            </div>

            <div style={{
                maxHeight: '250px',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {filteredProducts.length === 0 ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '14px'
                    }}>
                        {searchTerm ? 'No products found' : 'No products'}
                    </div>
                ) : (
                    filteredProducts.map(p => {
                        const productId = p.id || p.Id;
                        const isSelected = value === productId;

                        return (
                            <div
                                key={productId}
                                onClick={() => {
                                    onSelect(productId);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? '#f0f9ff' : 'white',
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'white';
                                    }
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: isSelected ? '600' : '500',
                                            fontSize: '14px',
                                            color: '#334155',
                                            marginBottom: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {p.name || p.Name}
                                            {isSelected && (
                                                <span style={{
                                                    color: '#059669',
                                                    fontSize: '12px'
                                                }}>✓</span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#64748b'
                                        }}>
                                            ID: {productId} • {p.type || p.Type || 'N/A'} • {p.unit || p.Unit || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{
                                        textAlign: 'right',
                                        fontWeight: '600',
                                        color: '#475569',
                                        fontSize: '14px',
                                        marginLeft: '12px'
                                    }}>
                                        {new Intl.NumberFormat('vi-VN').format(p.price || p.Price || 0)} đ
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <>
            <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        backgroundColor: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '40px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#475569'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                    <span style={{ color: value ? '#334155' : '#94a3b8', flex: 1, textAlign: 'left' }}>
                        {selectedProduct
                            ? `${selectedProduct.name || selectedProduct.Name} - ${new Intl.NumberFormat('vi-VN').format(selectedProduct.price || selectedProduct.Price || 0)} đ`
                            : placeholder
                        }
                    </span>
                    <span style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: '#94a3b8',
                        fontSize: '12px'
                    }}>▼</span>
                </div>
            </div>
            {isOpen && createPortal(dropdownContent, document.body)}
        </>
    );
};

const UOrder = ({ orderId, onOrderUpdated, onClose }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useToast();
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // [{ productId, quantity }]
    const [formData, setFormData] = useState({
        id: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        customerName: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);

    // Load order data and products when component mounts
    useEffect(() => {
        if (orderId) {
            loadOrderData();
            fetchProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const loadOrderData = async () => {
        try {
            setLoadingOrder(true);
            // Load order info
            const orderResponse = await orderAPI.getOrderById(orderId);
            if (orderResponse.success) {
                const order = orderResponse.data;
                setFormData({
                    id: order.id || order.Id || '',
                    type: order.type || '',
                    date: order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    customerName: order.customer_name || order.customerName || ''
                });
            }

            // Load order details (products)
            const detailsResponse = await orderDetailAPI.getOrderDetailsByOrderId(orderId);
            if (detailsResponse.success && detailsResponse.data) {
                const items = detailsResponse.data.map(od => ({
                    productId: od.product_id || od.pid || od.productId,
                    quantity: od.number || 0
                }));
                setSelectedItems(items);
            }
        } catch (err) {
            console.error('Error loading order data:', err);
            showError('Failed to load order data: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoadingOrder(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await productAPI.getAllProducts();
            if (response.success) {
                const productsList = response.data || [];
                setProducts(productsList);
            } else {
                console.error('Failed to fetch products:', response);
                showError('Failed to load products list');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            showError('Failed to load products list: ' + (err.message || 'Unknown error'));
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddProduct = () => {
        setSelectedItems([...selectedItems, { productId: '', quantity: 1 }]);
    };

    const handleRemoveProduct = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const handleProductChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index] = {
            ...updated[index],
            [field]: field === 'quantity' ? parseInt(value) || 0 : value
        };
        setSelectedItems(updated);
    };

    const calculateTotal = () => {
        return selectedItems.reduce((sum, item) => {
            if (!item.productId) return sum;
            const product = products.find(p => (p.id || p.Id) === item.productId);
            if (!product) return sum;
            const price = product.price || product.Price || 0;
            const quantity = item.quantity || 0;
            return sum + (price * quantity);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (selectedItems.length === 0) {
            showError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        const hasInvalidItems = selectedItems.some(item => !item.productId || !item.quantity || item.quantity <= 0);
        if (hasInvalidItems) {
            showError('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ cho tất cả các mục');
            return;
        }

        setLoading(true);

        try {
            const total = calculateTotal();
            const userId = user?.id || user?.Id || '';

            // Update order
            const orderResponse = await orderAPI.updateOrder(orderId, {
                type: formData.type,
                date: formData.date,
                uId: userId,
                customerName: formData.customerName,
                total: total
            });

            if (!orderResponse.success) {
                throw new Error(orderResponse.message || 'Failed to update order');
            }

            // Get current order details
            const currentDetailsResponse = await orderDetailAPI.getOrderDetailsByOrderId(orderId);
            const currentDetails = currentDetailsResponse.success ? (currentDetailsResponse.data || []) : [];

            // Delete old order details that are not in new list
            const currentProductIds = currentDetails.map(od => od.product_id || od.pid || od.productId);
            const newProductIds = selectedItems.map(item => item.productId).filter(Boolean);
            const toDelete = currentProductIds.filter(id => !newProductIds.includes(id));

            for (const productId of toDelete) {
                try {
                    await orderDetailAPI.deleteOrderDetail(orderId, productId);
                } catch (err) {
                    console.error(`Error deleting order detail ${orderId}/${productId}:`, err);
                }
            }

            // Update or create order details
            for (const item of selectedItems) {
                if (!item.productId) continue;

                const existingDetail = currentDetails.find(
                    od => (od.product_id || od.pid || od.productId) === item.productId
                );

                if (existingDetail) {
                    // Update existing
                    await orderDetailAPI.updateOrderDetail(orderId, item.productId, {
                        number: item.quantity,
                        note: ''
                    });
                } else {
                    // Create new
                    await orderDetailAPI.createOrderDetail({
                        oid: orderId,
                        pid: item.productId,
                        number: item.quantity,
                        note: ''
                    });
                }
            }

            showSuccess('Cập nhật đơn hàng thành công!');
            if (onOrderUpdated) {
                onOrderUpdated();
            }
            if (onClose) {
                onClose();
            }
        } catch (err) {
            console.error('Error updating order:', err);
            showError(err.response?.data?.error || err.message || 'Failed to update order');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return null;

    const total = calculateTotal();

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Chỉnh sửa đơn hàng"
            size="large"
        >
            {loadingOrder ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    Đang tải dữ liệu...
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Basic Order Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '12px',
                        marginBottom: '16px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
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
                                    cursor: 'not-allowed',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Loại <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            >
                                <option value="">Chọn loại</option>
                                <option value="Sale">Sale</option>
                                <option value="Sell">Export</option>
                                <option value="Import">Import</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Ngày <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
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
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Tên khách hàng
                            </label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                placeholder="Nhập tên khách hàng"
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
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                User ID
                            </label>
                            <input
                                type="text"
                                value={user?.id || user?.Id || 'Auto-filled from logged in account'}
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
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Tổng tiền
                            </label>
                            <input
                                type="text"
                                value={new Intl.NumberFormat('vi-VN').format(total) + ' đ'}
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
                                    cursor: 'not-allowed',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                    </div>

                    {/* Products Selection */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
                                Sản phẩm ({selectedItems.length})
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Icons.Add size={16} /> Thêm sản phẩm
                            </button>
                        </div>

                        {selectedItems.length === 0 ? (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                color: '#999'
                            }}>
                                Chưa có sản phẩm nào. Click "Thêm sản phẩm" để bắt đầu.
                            </div>
                        ) : (
                            <div style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#cbd5e1 #f1f5f9'
                            }}>
                                {selectedItems.map((item, index) => {
                                    const product = products.find(p => (p.id || p.Id) === item.productId);
                                    const itemTotal = product ? ((product.price || product.Price || 0) * (item.quantity || 0)) : 0;

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                padding: '8px 10px',
                                                borderBottom: index < selectedItems.length - 1 ? '1px solid #e5e7eb' : 'none',
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                                                gap: '6px',
                                                alignItems: 'center',
                                                minHeight: '50px'
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <ProductSelectDropdown
                                                    value={item.productId}
                                                    products={products || []}
                                                    onSelect={(productId) => handleProductChange(index, 'productId', productId)}
                                                    placeholder={loadingProducts ? "Đang tải..." : products.length === 0 ? "Không có sản phẩm" : "Chọn sản phẩm"}
                                                />
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                                placeholder="SL"
                                                required
                                                style={{
                                                    padding: '8px 10px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    outline: 'none'
                                                }}
                                            />
                                            <div style={{
                                                padding: '8px 6px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                                color: '#475569',
                                                fontSize: '13px'
                                            }}>
                                                {new Intl.NumberFormat('vi-VN').format(itemTotal)} đ
                                            </div>
                                            <div style={{
                                                padding: '8px 6px',
                                                fontSize: '12px',
                                                color: '#64748b'
                                            }}>
                                                {product ? (product.unit || product.Unit || '') : ''}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProduct(index)}
                                                style={{
                                                    padding: '6px',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: '32px',
                                                    height: '32px'
                                                }}
                                            >
                                                <Icons.Delete size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        marginTop: '12px',
                        position: 'sticky',
                        bottom: 0,
                        backgroundColor: 'white',
                        zIndex: 10,
                        paddingBottom: '8px'
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
                            type="submit"
                            disabled={loading || selectedItems.length === 0}
                            style={{
                                padding: '12px 24px',
                                background: loading || selectedItems.length === 0
                                    ? '#94a3b8'
                                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading || selectedItems.length === 0 ? 'not-allowed' : 'pointer',
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
                                    <Icons.Loading size={16} /> Đang cập nhật...
                                </>
                            ) : (
                                <>
                                    <Icons.Success size={16} /> Cập nhật đơn hàng
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default UOrder;
