import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { orderAPI, productAPI, orderDetailAPI, warehouseAPI, productDetailAPI, paymentAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useAuth } from '../src/contexts/useAuth';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

// Reuse ProductSelectDropdown from COrder
const ProductSelectDropdown = ({ value, products, onSelect, placeholder, disabled = false }) => {
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
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    style={{
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        backgroundColor: disabled ? '#f1f5f9' : 'white',
                        color: disabled ? '#64748b' : '#334155',
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
    const [allProducts, setAllProducts] = useState([]); // All products (unfiltered)
    const [allWarehouses, setAllWarehouses] = useState([]); // All warehouses (unfiltered)
    const [products, setProducts] = useState([]); // Filtered products
    const [warehouses, setWarehouses] = useState([]); // Filtered warehouses
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // [{ productId, quantity, warehouseId }]
    const [formData, setFormData] = useState({
        id: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        customerName: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [productDetailsCache, setProductDetailsCache] = useState({}); // Cache product details for filtering
    const [isFullyPaid, setIsFullyPaid] = useState(false); // Check if sale order is fully paid

    // Load order data and products when component mounts
    useEffect(() => {
        if (orderId) {
            loadOrderData();
            fetchProducts();
            fetchWarehouses();
            checkPaymentStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    // Update filtered products and warehouses when selections change
    useEffect(() => {
        updateFilteredLists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItems, allProducts, allWarehouses, productDetailsCache, formData.type]);

    const checkPaymentStatus = async () => {
        try {
            const orderResponse = await orderAPI.getOrderById(orderId);
            if (orderResponse.success) {
                const order = orderResponse.data;
                const orderType = (order.type || '').toLowerCase();
                // Only check payment status for sale orders
                if (orderType === 'sale' || orderType === 'sell') {
                    const paymentResponse = await paymentAPI.getOrderPaymentSummary(orderId);
                    if (paymentResponse.success && paymentResponse.data) {
                        setIsFullyPaid(paymentResponse.data.isFullyPaid || false);
                    }
                }
            }
        } catch (err) {
            // Ignore errors, default to not fully paid
            console.warn('Error checking payment status:', err);
            setIsFullyPaid(false);
        }
    };

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
                    quantity: od.number || 0,
                    warehouseId: od.warehouse_id || od.wid || od.warehouseId || ''
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
                setAllProducts(productsList);
                setProducts(productsList);

                // Pre-fetch product details for all products to enable filtering
                await fetchProductDetailsForProducts(productsList);
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

    const fetchWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const response = await warehouseAPI.getAllWarehouses();
            if (response.success) {
                const warehousesList = response.data || [];
                setAllWarehouses(warehousesList);
                setWarehouses(warehousesList);
            } else {
                console.error('Failed to fetch warehouses:', response);
                showError('Failed to load warehouses list');
            }
        } catch (err) {
            console.error('Error fetching warehouses:', err);
            showError('Failed to load warehouses list: ' + (err.message || 'Unknown error'));
        } finally {
            setLoadingWarehouses(false);
        }
    };

    // Fetch product details for products to enable warehouse filtering
    const fetchProductDetailsForProducts = async (productsList) => {
        try {
            const cache = {};
            for (const product of productsList) {
                const productId = product.id || product.Id;
                if (productId) {
                    try {
                        const response = await productDetailAPI.getProductDetailsByProductId(productId);
                        if (response.success && response.data) {
                            cache[productId] = response.data;
                        }
                    } catch (err) {
                        console.error(`Error fetching details for product ${productId}:`, err);
                    }
                }
            }
            setProductDetailsCache(cache);
        } catch (err) {
            console.error('Error fetching product details:', err);
        }
    };

    // Update filtered products and warehouses based on selections
    const updateFilteredLists = () => {
        const orderType = (formData.type || '').toLowerCase();

        // If Sale, don't filter by warehouse (warehouse field will be hidden)
        if (orderType === 'sale') {
            setProducts(allProducts);
            setWarehouses(allWarehouses);
            return;
        }

        // Get all selected product IDs and warehouse IDs from all items
        const selectedProductIds = selectedItems
            .map(item => item.productId)
            .filter(Boolean);
        const selectedWarehouseIds = selectedItems
            .map(item => item.warehouseId)
            .filter(Boolean);

        // Check if we have any items with products but no warehouse (products selected first)
        const hasProductsWithoutWarehouse = selectedItems.some(item =>
            item.productId && !item.warehouseId
        );
        // Check if we have any items with warehouse but no product (warehouse selected first)
        const hasWarehouseWithoutProduct = selectedItems.some(item =>
            item.warehouseId && !item.productId
        );

        // If products are selected first (without warehouse), filter warehouses to only those that have those products
        if (hasProductsWithoutWarehouse && !hasWarehouseWithoutProduct) {
            const availableWarehouseIds = new Set();
            selectedProductIds.forEach(productId => {
                const details = productDetailsCache[productId] || [];
                details.forEach(detail => {
                    const wid = detail.wid || detail.warehouse_id || detail.warehouseId;
                    if (wid) {
                        availableWarehouseIds.add(wid);
                    }
                });
            });
            const filteredWarehouses = allWarehouses.filter(w =>
                availableWarehouseIds.has(w.id || w.Id)
            );
            setWarehouses(filteredWarehouses.length > 0 ? filteredWarehouses : allWarehouses);
            setProducts(allProducts); // Show all products
        }
        // If warehouse is selected first (without product), filter products to only those in that warehouse
        else if (hasWarehouseWithoutProduct && !hasProductsWithoutWarehouse) {
            const availableProductIds = new Set();
            selectedWarehouseIds.forEach(warehouseId => {
                // Find products that have this warehouse in their details
                Object.keys(productDetailsCache).forEach(productId => {
                    const details = productDetailsCache[productId] || [];
                    const hasInWarehouse = details.some(detail => {
                        const wid = detail.wid || detail.warehouse_id || detail.warehouseId;
                        return wid === warehouseId;
                    });
                    if (hasInWarehouse) {
                        availableProductIds.add(productId);
                    }
                });
            });
            const filteredProducts = allProducts.filter(p =>
                availableProductIds.has(p.id || p.Id)
            );
            setProducts(filteredProducts.length > 0 ? filteredProducts : allProducts);
            setWarehouses(allWarehouses); // Show all warehouses
        }
        // If both are selected or neither, show all
        else {
            setProducts(allProducts);
            setWarehouses(allWarehouses);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddProduct = () => {
        setSelectedItems([...selectedItems, { productId: '', quantity: 1, warehouseId: '' }]);
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

        // Prevent editing if fully paid
        if (isFullyPaid) {
            showError('Không thể chỉnh sửa đơn hàng đã thanh toán. Chỉ có thể xem chi tiết.');
            return;
        }

        // Validation
        if (selectedItems.length === 0) {
            showError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        const orderType = (formData.type || '').toLowerCase();
        const hasInvalidItems = selectedItems.some(item => {
            const basicInvalid = !item.productId || !item.quantity || item.quantity <= 0;
            // Only require warehouse if not Sale
            if (orderType === 'sale') {
                return basicInvalid;
            }
            return basicInvalid || !item.warehouseId;
        });
        if (hasInvalidItems) {
            const errorMsg = orderType === 'sale'
                ? 'Vui lòng chọn sản phẩm và nhập số lượng hợp lệ cho tất cả các mục'
                : 'Vui lòng chọn sản phẩm, kho hàng và nhập số lượng hợp lệ cho tất cả các mục';
            showError(errorMsg);
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
            // Need to match both productId and warehouseId
            const currentDetailsMap = new Map();
            currentDetails.forEach(od => {
                const pid = od.product_id || od.pid || od.productId;
                const wid = od.warehouse_id || od.wid || od.warehouseId || '';
                const key = `${pid}_${wid}`;
                currentDetailsMap.set(key, { pid, wid });
            });

            const newDetailsMap = new Map();
            selectedItems.forEach(item => {
                if (!item.productId) return;
                const wid = item.warehouseId || (allWarehouses.length > 0 ? allWarehouses[0].id || allWarehouses[0].Id : '');
                const key = `${item.productId}_${wid}`;
                newDetailsMap.set(key, { pid: item.productId, wid });
            });

            // Find details to delete
            for (const [key, { pid, wid }] of currentDetailsMap) {
                if (!newDetailsMap.has(key)) {
                    try {
                        await orderDetailAPI.deleteOrderDetail(orderId, pid, wid);
                    } catch (err) {
                        console.error(`Error deleting order detail ${orderId}/${pid}/${wid}:`, err);
                    }
                }
            }

            // Update or create order details
            for (const item of selectedItems) {
                if (!item.productId) continue;

                const warehouseId = item.warehouseId || (allWarehouses.length > 0 ? allWarehouses[0].id || allWarehouses[0].Id : '');
                const existingDetail = currentDetails.find(
                    od => (od.product_id || od.pid || od.productId) === item.productId &&
                        (od.warehouse_id || od.wid || od.warehouseId) === warehouseId
                );

                if (existingDetail) {
                    // Update existing
                    await orderDetailAPI.updateOrderDetail(orderId, item.productId, warehouseId, {
                        number: item.quantity,
                        note: ''
                    });
                } else {
                    // Create new
                    await orderDetailAPI.createOrderDetail({
                        oid: orderId,
                        pid: item.productId,
                        wid: warehouseId,
                        warehouse_id: warehouseId,
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
            title={isFullyPaid ? "Chi tiết đơn hàng (Đã thanh toán)" : "Chỉnh sửa đơn hàng"}
            size="large"
        >
            {loadingOrder ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    Đang tải dữ liệu...
                </div>
            ) : (
                <>
                    {isFullyPaid && (
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            color: '#92400e',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            ⚠️ Đơn hàng này đã được thanh toán đầy đủ. Bạn chỉ có thể xem chi tiết, không thể chỉnh sửa hoặc xóa.
                        </div>
                    )}
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
                                    disabled={isFullyPaid}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s',
                                        cursor: isFullyPaid ? 'not-allowed' : 'pointer',
                                        backgroundColor: isFullyPaid ? '#f1f5f9' : 'white',
                                        color: isFullyPaid ? '#64748b' : '#334155'
                                    }}
                                    onFocus={(e) => !isFullyPaid && (e.target.style.borderColor = '#475569')}
                                    onBlur={(e) => !isFullyPaid && (e.target.style.borderColor = '#cbd5e1')}
                                >
                                    <option value="">Chọn loại</option>
                                    <option value="sale">Sale</option>
                                    <option value="export">Export</option>
                                    <option value="import">Import</option>
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
                                    disabled={isFullyPaid}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s',
                                        backgroundColor: isFullyPaid ? '#f1f5f9' : 'white',
                                        color: isFullyPaid ? '#64748b' : '#334155',
                                        cursor: isFullyPaid ? 'not-allowed' : 'text'
                                    }}
                                    onFocus={(e) => !isFullyPaid && (e.target.style.borderColor = '#475569')}
                                    onBlur={(e) => !isFullyPaid && (e.target.style.borderColor = '#cbd5e1')}
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
                                    disabled={isFullyPaid}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s',
                                        backgroundColor: isFullyPaid ? '#f1f5f9' : 'white',
                                        color: isFullyPaid ? '#64748b' : '#334155',
                                        cursor: isFullyPaid ? 'not-allowed' : 'text'
                                    }}
                                    onFocus={(e) => !isFullyPaid && (e.target.style.borderColor = '#475569')}
                                    onBlur={(e) => !isFullyPaid && (e.target.style.borderColor = '#cbd5e1')}
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
                            {((formData.type || '').toLowerCase() !== 'import') && (
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
                            )}
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
                                    disabled={isFullyPaid}
                                    style={{
                                        padding: '8px 16px',
                                        background: isFullyPaid ? '#f1f5f9' : '#f1f5f9',
                                        color: isFullyPaid ? '#94a3b8' : '#475569',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        cursor: isFullyPaid ? 'not-allowed' : 'pointer',
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
                                                    gridTemplateColumns: (formData.type || '').toLowerCase() === 'sale'
                                                        ? '2fr 1fr 1fr 1fr auto'
                                                        : '2fr 1fr 1fr 1fr 1fr auto',
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
                                                        disabled={isFullyPaid}
                                                    />
                                                </div>
                                                {((formData.type || '').toLowerCase() !== 'sale') && (
                                                    <select
                                                        value={item.warehouseId || ''}
                                                        onChange={(e) => handleProductChange(index, 'warehouseId', e.target.value)}
                                                        required
                                                        disabled={loadingWarehouses}
                                                        style={{
                                                            padding: '8px 10px',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: '6px',
                                                            fontSize: '13px',
                                                            outline: 'none',
                                                            cursor: 'pointer',
                                                            backgroundColor: loadingWarehouses ? '#f1f5f9' : 'white'
                                                        }}
                                                    >
                                                        <option value="">{loadingWarehouses ? 'Đang tải...' : 'Kho hàng'}</option>
                                                        {warehouses.map(warehouse => (
                                                            <option key={warehouse.id || warehouse.Id} value={warehouse.id || warehouse.Id}>
                                                                {warehouse.name || warehouse.Name || warehouse.id || warehouse.Id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
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
                                                    disabled={isFullyPaid}
                                                    style={{
                                                        padding: '6px',
                                                        background: isFullyPaid ? '#f1f5f9' : '#fee2e2',
                                                        color: isFullyPaid ? '#94a3b8' : '#dc2626',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: isFullyPaid ? 'not-allowed' : 'pointer',
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
                                disabled={loading || selectedItems.length === 0 || isFullyPaid}
                                style={{
                                    padding: '12px 24px',
                                    background: loading || selectedItems.length === 0 || isFullyPaid
                                        ? '#94a3b8'
                                        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: loading || selectedItems.length === 0 || isFullyPaid ? 'not-allowed' : 'pointer',
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
                </>
            )}
        </Modal>
    );
};

export default UOrder;
