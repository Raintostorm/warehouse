import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { orderAPI, productAPI, orderDetailAPI, warehouseAPI, supplierAPI, productDetailAPI } from '../services/api';
import api from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useAuth } from '../src/contexts/useAuth';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

// Custom Product Select Dropdown with Search and Scroll
const ProductSelectDropdown = ({ value, products, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Filter products
    const filteredProducts = products.filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const name = (p.name || p.Name || '').toLowerCase();
        const id = (p.id || p.Id || '').toLowerCase();
        const type = (p.type || p.Type || '').toLowerCase();
        return name.includes(search) || id.includes(search) || type.includes(search);
    });

    const selectedProduct = products.find(p => (p.id || p.Id) === value);

    // Calculate dropdown position when opening
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
            // Update position on scroll or resize
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
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
            // Also close on scroll
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
            {/* Search Input */}
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

            {/* Product List with Scroll */}
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

const COrder = ({ onOrderCreated }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allProducts, setAllProducts] = useState([]); // All products (unfiltered)
    const [allWarehouses, setAllWarehouses] = useState([]); // All warehouses (unfiltered)
    const [products, setProducts] = useState([]); // Filtered products
    const [warehouses, setWarehouses] = useState([]); // Filtered warehouses
    const [suppliers, setSuppliers] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // [{ productId, quantity, warehouseId }]
    const [formData, setFormData] = useState({
        id: '',
        type: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        customerName: '',
        supplierId: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingOrderId, setLoadingOrderId] = useState(false);
    const [stockInfo, setStockInfo] = useState({}); // { productId_warehouseId: { available, requested } }
    const [productDetailsCache, setProductDetailsCache] = useState({}); // Cache product details for filtering

    // Load products, warehouses, suppliers and order ID when modal opens
    useEffect(() => {
        if (isModalOpen) {
            fetchProducts();
            fetchWarehouses();
            fetchSuppliers();
            fetchNextOrderId(formData.type);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalOpen]);

    // Update filtered products and warehouses when selections change
    useEffect(() => {
        updateFilteredLists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedItems, allProducts, allWarehouses, productDetailsCache]);

    // Fetch next order ID from backend
    const fetchNextOrderId = async (orderType = '') => {
        try {
            setLoadingOrderId(true);
            // Get all orders to find the next ID
            const response = await orderAPI.getAllOrders();
            if (response.success) {
                const orders = response.data || [];
                const type = (orderType || '').toLowerCase();
                
                // Determine prefix based on order type
                let prefix = 'ORD';
                if (type === 'sale') {
                    prefix = 'SA';
                } else if (type === 'import') {
                    prefix = 'IM';
                } else if (type === 'export') {
                    prefix = 'EX';
                }

                // Find max order ID with matching prefix
                const orderIds = orders
                    .map(o => o.id || o.Id)
                    .filter(id => id && id.startsWith(prefix))
                    .map(id => {
                        const match = id.match(new RegExp(`${prefix}(\\d+)`));
                        return match ? parseInt(match[1], 10) : 0;
                    });

                const maxId = orderIds.length > 0 ? Math.max(...orderIds) : 0;
                const nextId = maxId + 1;
                const nextOrderId = `${prefix}${nextId.toString().padStart(6, '0')}`;

                setFormData(prev => ({
                    ...prev,
                    id: nextOrderId
                }));
            }
        } catch (err) {
            console.error('Error fetching next order ID:', err);
            // Fallback: use timestamp-based ID
            const type = (orderType || '').toLowerCase();
            let prefix = 'ORD';
            if (type === 'sale') {
                prefix = 'SA';
            } else if (type === 'import') {
                prefix = 'IM';
            } else if (type === 'export') {
                prefix = 'EX';
            }
            const fallbackId = `${prefix}${Date.now().toString().slice(-6)}`;
            setFormData(prev => ({
                ...prev,
                id: fallbackId
            }));
        } finally {
            setLoadingOrderId(false);
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

    const fetchSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            const response = await supplierAPI.getAllSuppliers();
            if (response.success) {
                const suppliersList = response.data || [];
                setSuppliers(suppliersList);
            } else {
                console.error('Failed to fetch suppliers:', response);
                showError('Failed to load suppliers list');
            }
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            showError('Failed to load suppliers list: ' + (err.message || 'Unknown error'));
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const handleChange = (e) => {
        const newFormData = {
            ...formData,
            [e.target.name]: e.target.value
        };
        setFormData(newFormData);
        
        // If type changes, regenerate order ID
        if (e.target.name === 'type') {
            fetchNextOrderId(e.target.value);
            // Reset type-specific fields
            setFormData(prev => ({
                ...prev,
                type: e.target.value,
                customerName: e.target.value.toLowerCase() === 'sale' ? prev.customerName : '',
                supplierId: e.target.value.toLowerCase() === 'import' ? prev.supplierId : ''
            }));
        }
    };

    const handleAddProduct = () => {
        setSelectedItems([...selectedItems, { productId: '', quantity: 1, warehouseId: '' }]);
    };

    const handleRemoveProduct = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const updateStockInfo = async (item) => {
        if (!item.productId || !item.warehouseId) {
            return;
        }

        try {
            // Fetch stock info from product-details API
            const response = await productDetailAPI.getProductDetailsByProductId(item.productId);
            if (response.success) {
                const productDetails = response.data || [];
                const detail = productDetails.find(pd => 
                    (pd.wid || pd.warehouse_id || pd.warehouseId) === item.warehouseId
                );
                const available = detail ? (detail.number || 0) : 0;
                
                setStockInfo(prev => ({
                    ...prev,
                    [`${item.productId}_${item.warehouseId}`]: {
                        available,
                        requested: item.quantity || 0
                    }
                }));
            }
        } catch (err) {
            console.error('Error fetching stock info:', err);
        }
    };

    const handleProductChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index] = {
            ...updated[index],
            [field]: field === 'quantity' ? parseInt(value) || 0 : value
        };
        setSelectedItems(updated);

        // Update stock info when product or warehouse changes
        if (field === 'productId' || field === 'warehouseId') {
            updateStockInfo(updated[index]);
        }
    };

    // Calculate total from selected products
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

        const orderType = (formData.type || '').toLowerCase();

        // Validate order type requirements
        if (orderType === 'sale') {
            if (!formData.customerName || formData.customerName.trim() === '') {
                showError('Customer name is required for sale orders');
                return;
            }
        } else if (orderType === 'import') {
            if (!formData.supplierId || formData.supplierId.trim() === '') {
                showError('Supplier is required for import orders');
                return;
            }
        }

        // Validation
        if (selectedItems.length === 0) {
            showError('Please select at least one product');
            return;
        }

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
                ? 'Please select products and enter valid quantities for all items'
                : 'Please select products, warehouses, and enter valid quantities for all items';
            showError(errorMsg);
            return;
        }

        // For sale orders: validate stock before creating order
        if (orderType === 'sale') {
            try {
                // For Sale orders, validate total stock across all warehouses (no specific warehouse needed)
                const orderDetailsForValidation = selectedItems.map(item => ({
                    productId: item.productId,
                    number: item.quantity
                    // No warehouseId needed - we check total stock across all warehouses
                }));

                const validationResponse = await api.post('/orders/validate-stock-total', {
                    orderDetails: orderDetailsForValidation
                });

                if (!validationResponse.data.success || !validationResponse.data.data.isValid) {
                    const errors = validationResponse.data.data.summary?.errors || [];
                    const errorMessage = errors.length > 0
                        ? `Insufficient stock:\n${errors.map(e => `- ${e.product}: Available ${e.available}, Requested ${e.requested}`).join('\n')}`
                        : 'Insufficient stock for one or more products';
                    showError(errorMessage);
                    return;
                }
            } catch (err) {
                console.error('Error validating stock:', err);
                // Continue anyway - backend will also validate
            }
        }

        setLoading(true);

        try {
            const total = calculateTotal();
            const userId = user?.id || user?.Id || '';

            // Create order first (backend will auto-generate ID if not provided)
            const orderData = {
                ...(formData.id && { id: formData.id }), // Only include id if it exists
                type: orderType, // Use lowercase
                date: formData.date,
                uId: userId,
                total: total
            };

            // Add type-specific fields
            if (orderType === 'sale') {
                orderData.customerName = formData.customerName;
            } else if (orderType === 'import') {
                orderData.supplierId = formData.supplierId;
            }

            const orderResponse = await orderAPI.createOrder(orderData);

            // Get the actual order ID from response (in case backend generated it)
            const createdOrderId = orderResponse.data?.id || orderResponse.data?.Id || formData.id;

            if (!orderResponse.success) {
                throw new Error(orderResponse.message || 'Failed to create order');
            }

            // Create order details for each selected product with warehouse
            const orderDetailsPromises = selectedItems.map(item => {
                // For Sale orders, don't specify warehouse - backend will find one with stock
                // For Import/Export orders, use the selected warehouse
                const warehouseId = orderType === 'sale' 
                    ? null // Backend will automatically find warehouse with stock
                    : item.warehouseId;
                
                const orderDetailData = {
                    oid: createdOrderId, // Use the actual order ID from response
                    pid: item.productId,
                    number: item.quantity,
                    note: ''
                };
                
                // Only include warehouse fields if warehouseId is provided
                if (warehouseId) {
                    orderDetailData.wid = warehouseId;
                    orderDetailData.warehouse_id = warehouseId;
                }
                
                return orderDetailAPI.createOrderDetail(orderDetailData);
            });

            await Promise.all(orderDetailsPromises);

            showSuccess('Order created successfully!');
            // Reset form but keep modal open for next order
            setFormData({
                id: '', // Will be auto-filled when modal reopens
                type: '',
                date: new Date().toISOString().split('T')[0],
                customerName: '',
                supplierId: ''
            });
            setSelectedItems([]);
            setStockInfo({});
            setIsModalOpen(false);
            if (onOrderCreated) {
                onOrderCreated();
            }
        } catch (err) {
            console.error('Error creating order:', err);
            showError(err.response?.data?.error || err.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
            setFormData({
                id: '',
                type: '',
                date: new Date().toISOString().split('T')[0],
                customerName: '',
                supplierId: ''
            });
            setSelectedItems([]);
            setStockInfo({});
    };


    if (!isAdmin) return null;

    const total = calculateTotal();

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
                <Icons.Add size={20} /> Create New Order
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title="Create New Order"
                size="large"
            >
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
                                ID <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="id"
                                value={loadingOrderId ? 'Loading...' : formData.id}
                                disabled
                                required
                                placeholder="Auto-generated"
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
                                Type <span style={{ color: '#ef4444' }}>*</span>
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
                                <option value="">Select type</option>
                                <option value="sale">Sale</option>
                                <option value="import">Import</option>
                                <option value="export">Export</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                Date <span style={{ color: '#ef4444' }}>*</span>
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
                        {(formData.type || '').toLowerCase() === 'sale' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                    Customer Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    placeholder="Enter customer name"
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
                        )}
                        {(formData.type || '').toLowerCase() === 'import' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                                    Supplier <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleChange}
                                    required
                                    disabled={loadingSuppliers}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        backgroundColor: loadingSuppliers ? '#f1f5f9' : 'white'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#475569'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                >
                                    <option value="">{loadingSuppliers ? 'Loading...' : 'Select supplier'}</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id || supplier.Id} value={supplier.id || supplier.Id}>
                                            {supplier.name || supplier.Name || supplier.id || supplier.Id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
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
                                    Total Amount
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
                                Products ({selectedItems.length})
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
                                <Icons.Add size={16} /> Add Product
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
                                No products yet. Click "Add Product" to start.
                            </div>
                        ) : (
                            <div style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                maxHeight: '200px', // Giảm chiều cao hơn nữa để tiết kiệm không gian
                                overflowY: 'auto', // Thêm scrollbar khi cần
                                overflowX: 'hidden',
                                scrollbarWidth: 'thin', // Thinner scrollbar
                                scrollbarColor: '#cbd5e1 #f1f5f9' // Custom scrollbar colors
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
                                                    placeholder={loadingProducts ? "Loading..." : products.length === 0 ? "No products" : "Select product"}
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
                                                    <option value="">{loadingWarehouses ? 'Loading...' : 'Warehouse'}</option>
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
                                                onChange={(e) => {
                                                    handleProductChange(index, 'quantity', e.target.value);
                                                    // Update stock info when quantity changes
                                                    if (item.productId && item.warehouseId) {
                                                        const updated = [...selectedItems];
                                                        updated[index] = { ...updated[index], quantity: parseInt(e.target.value) || 0 };
                                                        updateStockInfo(updated[index]);
                                                    }
                                                }}
                                                placeholder="Qty"
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
                                                fontSize: '11px',
                                                color: item.productId && item.warehouseId && stockInfo[`${item.productId}_${item.warehouseId}`] 
                                                    ? (stockInfo[`${item.productId}_${item.warehouseId}`].available >= (item.quantity || 0) ? '#10b981' : '#ef4444')
                                                    : '#64748b'
                                            }}>
                                                {item.productId && item.warehouseId && stockInfo[`${item.productId}_${item.warehouseId}`] 
                                                    ? `Stock: ${stockInfo[`${item.productId}_${item.warehouseId}`].available}`
                                                    : ''
                                                }
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
                        position: 'sticky', // Sticky footer để luôn visible
                        bottom: 0,
                        backgroundColor: 'white', // Background để không bị transparent
                        zIndex: 10,
                        paddingBottom: '8px'
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
                                    <Icons.Loading size={16} /> Creating...
                                </>
                            ) : (
                                <>
                                    <Icons.Success size={16} /> Create Order
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default COrder;
