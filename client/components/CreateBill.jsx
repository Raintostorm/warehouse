import { useState, useEffect } from 'react';
import { orderAPI, orderDetailAPI, productAPI } from '../services/api';
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

    // Load orders when modal opens
    useEffect(() => {
        if (orders.length === 0) {
            fetchOrders();
        }
    }, []);

    // Load order details when selected orders change
    useEffect(() => {
        if (selectedOrderIds.length > 0) {
            fetchOrderDetails();
        } else {
            setAllOrderDetails([]);
            setSelectedProducts([]);
        }
    }, [selectedOrderIds]);

    const fetchOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await orderAPI.getAllOrders();
            if (response.success) {
                setOrders(response.data || []);
            }
        } catch (err) {
            showError('Failed to load orders: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            setLoadingData(true);
            const allDetails = [];

            // Fetch order details for each selected order
            for (const orderId of selectedOrderIds) {
                try {
                    const detailsResponse = await orderDetailAPI.getOrderDetailsByOrderId(orderId);
                    if (detailsResponse.success && detailsResponse.data) {
                        // Add order info to each detail
                        const order = orders.find(o => (o.id || o.Id) === orderId);
                        const detailsWithOrder = detailsResponse.data.map(od => ({
                            ...od,
                            orderId: orderId,
                            orderInfo: order,
                            pid: od.pid || od.product_id // Normalize
                        }));
                        allDetails.push(...detailsWithOrder);
                    }
                } catch (err) {
                    console.error(`Error fetching details for order ${orderId}:`, err);
                }
            }

            // Fetch product info for each detail
            const detailsWithProducts = await Promise.all(
                allDetails.map(async (od) => {
                    const productId = od.pid || od.product_id;
                    try {
                        const productResponse = await productAPI.getProductById(productId);
                        return {
                            ...od,
                            product: productResponse.success ? productResponse.data : null
                        };
                    } catch (err) {
                        return {
                            ...od,
                            product: null
                        };
                    }
                })
            );

            setAllOrderDetails(detailsWithProducts);
            // Select all by default
            setSelectedProducts(detailsWithProducts.map(od => `${od.orderId}_${od.pid}`));
        } catch (err) {
            showError('Failed to load order details: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoadingData(false);
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

    const handleToggleProduct = (orderId, productId) => {
        const key = `${orderId}_${productId}`;
        setSelectedProducts(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleSelectAllProducts = () => {
        if (selectedProducts.length === allOrderDetails.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(allOrderDetails.map(od => `${od.orderId}_${od.pid}`));
        }
    };

    const handleGenerateBill = async () => {
        if (selectedOrderIds.length === 0) {
            showError('Please select at least one order');
            return;
        }

        if (selectedProducts.length === 0) {
            showError('Please select at least one product');
            return;
        }

        try {
            setLoading(true);
            
            // Group selected products by order
            const productsByOrder = {};
            selectedProducts.forEach(key => {
                const [orderId, productId] = key.split('_');
                if (!productsByOrder[orderId]) {
                    productsByOrder[orderId] = [];
                }
                productsByOrder[orderId].push(productId);
            });

            // For now, generate bill from first order with all selected products
            // TODO: Update backend to support multiple orders
            const firstOrderId = selectedOrderIds[0];
            const productIds = productsByOrder[firstOrderId] || [];

            const response = await orderAPI.generateBill(firstOrderId, productIds);
            
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

            showSuccess('Invoice created successfully!');
            if (onClose) {
                onClose();
            }
        } catch (err) {
            showError('Failed to create invoice: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return allOrderDetails
            .filter(od => selectedProducts.includes(`${od.orderId}_${od.pid}`))
            .reduce((sum, od) => {
                const product = od.product;
                const price = product ? (product.price || product.Price || 0) : 0;
                const quantity = od.number || 0;
                return sum + (price * quantity);
            }, 0);
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
                            {selectedOrderIds.length === orders.length ? 'Deselect All' : 'Select All'}
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
                                    No orders available
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

                {/* Product Selection */}
                {selectedOrderIds.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
                                Select Products ({selectedProducts.length}/{allOrderDetails.length})
                            </h3>
                            {allOrderDetails.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAllProducts}
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
                                    {selectedProducts.length === allOrderDetails.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>

                        {loadingData ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                Loading products...
                            </div>
                        ) : (
                            <div style={{
                                maxHeight: '400px',
                                overflowY: 'auto',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}>
                                {allOrderDetails.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        Không có sản phẩm nào trong các đơn hàng đã chọn
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                                            <tr>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', width: '40px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.length === allOrderDetails.length && allOrderDetails.length > 0}
                                                        onChange={handleSelectAllProducts}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Order</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Product</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', width: '100px' }}>Quantity</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', width: '120px' }}>Unit Price</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', width: '140px' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allOrderDetails.map((od, index) => {
                                                const product = od.product;
                                                const key = `${od.orderId}_${od.pid}`;
                                                const isSelected = selectedProducts.includes(key);
                                                const price = product ? (product.price || product.Price || 0) : 0;
                                                const quantity = od.number || 0;
                                                const subtotal = price * quantity;

                                                return (
                                                    <tr
                                                        key={key}
                                                        style={{
                                                            borderBottom: '1px solid #e5e7eb',
                                                            backgroundColor: isSelected ? '#f0f9ff' : 'white',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleToggleProduct(od.orderId, od.pid)}
                                                    >
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleToggleProduct(od.orderId, od.pid)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                                                            {od.orderId}
                                                        </td>
                                                        <td style={{ padding: '12px', fontSize: '14px' }}>
                                                            {product ? (product.name || product.Name) : `Product ${od.pid}`}
                                                            {product && (product.unit || product.Unit) && (
                                                                <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                                                                    ({product.unit || product.Unit})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                                                            {quantity}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                                                            {new Intl.NumberFormat('vi-VN').format(price)} đ
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                                                            {new Intl.NumberFormat('vi-VN').format(subtotal)} đ
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                        disabled={loading || selectedOrderIds.length === 0 || selectedProducts.length === 0}
                        style={{
                            padding: '12px 24px',
                            background: loading || selectedOrderIds.length === 0 || selectedProducts.length === 0
                                ? '#94a3b8'
                                : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading || selectedOrderIds.length === 0 || selectedProducts.length === 0 ? 'not-allowed' : 'pointer',
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
                                <Icons.Success size={16} /> Create Invoice PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateBill;
