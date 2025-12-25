import { useState, useEffect, useMemo } from 'react';
import { orderAPI, billAPI, paymentAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';
import ExportImportButtons from './ExportImportButtons';
import ConfirmationModal from '../src/components/ConfirmationModal';
import CreateBill from './CreateBill';
import UOrder from './UOrder';

const OrderL = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [billModal, setBillModal] = useState({ isOpen: false });
    const [showBillsModal, setShowBillsModal] = useState({ isOpen: false, orderId: null, bills: [], paidBills: [], unpaidBills: [] });
    const [showPaidBills, setShowPaidBills] = useState(true);
    const [showUnpaidBills, setShowUnpaidBills] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await orderAPI.getAllOrders();
            if (response.success) {
                setOrders(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const handleShowBills = async (orderId) => {
        try {
            let bills = [];
            if (orderId) {
                // Show bills for specific order
                const response = await billAPI.getBillsByOrderId(orderId);
                if (response.success) {
                    bills = response.data || [];
                } else {
                    showError('Failed to fetch bills: ' + response.message);
                    return;
                }
            } else {
                // Show all bills
                const response = await billAPI.getAllBills();
                if (response.success) {
                    bills = response.data || [];
                } else {
                    showError('Failed to fetch bills: ' + response.message);
                    return;
                }
            }

            // Fetch all payments to check bill payment status
            const paymentsResponse = await paymentAPI.getAllPayments();
            const allPayments = paymentsResponse.success ? (paymentsResponse.data || []) : [];

            // Categorize bills into paid and unpaid
            const paidBills = [];
            const unpaidBills = [];

            for (const bill of bills) {
                // Find payments by bill_id first, then fallback to order_id if bill_id is null
                let billPayments = allPayments.filter(p => 
                    (p.bill_id === bill.id || p.billId === bill.id) && 
                    (p.bill_id || p.billId) // Only if bill_id exists
                );
                
                // If no payments found by bill_id, try to find by order_id
                if (billPayments.length === 0) {
                    const billOrderId = bill.order_id || bill.orderId;
                    billPayments = allPayments.filter(p => 
                        (p.order_id === billOrderId || p.orderId === billOrderId)
                    );
                }
                
                const totalPaid = billPayments
                    .filter(p => {
                        const status = p.payment_status || p.paymentStatus;
                        return status === 'completed';
                    })
                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
                const billTotal = parseFloat(bill.total_amount || bill.totalAmount || 0);
                const isPaid = billTotal > 0 && totalPaid >= billTotal;

                // Debug logging
                console.log('Bill payment check:', {
                    billId: bill.id,
                    orderId: bill.order_id || bill.orderId,
                    billTotal,
                    totalPaid,
                    isPaid,
                    billStatus: bill.status,
                    paymentsFound: billPayments.length,
                    payments: billPayments.map(p => ({ 
                        id: p.id, 
                        amount: p.amount, 
                        status: p.payment_status || p.paymentStatus, 
                        bill_id: p.bill_id || p.billId,
                        order_id: p.order_id || p.orderId
                    }))
                });

                if (isPaid || bill.status === 'paid') {
                    paidBills.push(bill);
                } else if (bill.status !== 'cancelled') {
                    unpaidBills.push(bill);
                }
            }

            setShowBillsModal({ 
                isOpen: true, 
                orderId: orderId || 'All Orders', 
                bills: bills,
                paidBills: paidBills,
                unpaidBills: unpaidBills
            });
            // Reset toggle states when opening modal
            setShowPaidBills(true);
            setShowUnpaidBills(true);
        } catch (err) {
            showError('Failed to fetch bills: ' + (err.response?.data?.error || err.message));
        }
    };

    const confirmDelete = async () => {
        const id = confirmModal.id;
        try {
            const response = await orderAPI.deleteOrder(id);
            if (response.success) {
                fetchOrders();
                showSuccess('Order deleted successfully!');
            } else {
                showError('Delete error: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Delete order error: ' + (err.response?.data?.error || err.message));
        }
        setConfirmModal({ isOpen: false, id: null });
    };

    const filteredOrders = useMemo(() => {
        // Filter out gateway_payment orders (these are temporary orders created for bills/payments)
        // These should only appear in "Show Bills", not in the orders list
        const validOrders = orders.filter(o => o.type !== 'gateway_payment');
        
        if (!searchTerm) return validOrders;
        const term = searchTerm.toLowerCase();
        return validOrders.filter(o =>
            o.id?.toLowerCase().includes(term) ||
            o.type?.toLowerCase().includes(term) ||
            o.customer_name?.toLowerCase().includes(term) ||
            (o.user_id || o.userId || o.u_id || o.uId)?.toLowerCase().includes(term)
        );
    }, [orders, searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                margin: '20px 0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #475569',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Loading data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                margin: '20px 0'
            }}>
                <strong>Lỗi:</strong> {error}
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                border: '1px solid #64748b',
                borderRadius: '8px',
                backgroundColor: '#fee',
                margin: '20px'
            }}>
                <h2 style={{ color: '#64748b' }}>No access permission</h2>
                <p>Only admin users can manage orders.</p>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            margin: '20px 0'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: '600',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Icons.Order size={28} color="#475569" /> Order Management
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Total: <strong>{filteredOrders.length}</strong> orders
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => setBillModal({ isOpen: true })}
                        style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Icons.Success size={18} /> Create Bill
                    </button>
                    <button
                        onClick={() => {
                            // Show bills for all orders - open modal with all bills
                            handleShowBills(null);
                        }}
                        style={{
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Icons.File size={18} /> Show Bills
                    </button>
                </div>
                <button
                    onClick={fetchOrders}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Icons.Refresh size={18} /> Refresh
                </button>
                <ExportImportButtons
                    tableName="orders"
                    tableLabel="Orders"
                    onImportSuccess={fetchOrders}
                />
            </div>

            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ flex: '1', minWidth: '250px' }}>
                    <input
                        type="text"
                        placeholder="Search by ID, type, customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </select>
            </div>

            {filteredOrders.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '16px', margin: 0 }}>
                        {searchTerm ? 'No results found' : 'No orders yet'}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{
                        overflowX: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            backgroundColor: 'white'
                        }}>
                            <thead>
                                <tr style={{
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '2px solid #dee2e6'
                                }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>ID</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Loại</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Ngày</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Khách hàng</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>User ID</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Tổng tiền</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((order) => (
                                    <tr
                                        key={order.id}
                                        style={{
                                            borderBottom: '1px solid #e9ecef',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px', fontWeight: '500' }}>{order.id}</td>
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px' }}>{order.type || <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{order.date ? new Date(order.date).toLocaleDateString('vi-VN') : <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{order.customer_name || <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                                            {order.user_id || order.userId || order.u_id || order.uId || <span style={{ color: '#999' }}>-</span>}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                                            {order.total ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total) : <span style={{ color: '#999' }}>-</span>}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setEditingId(order.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                        color: '#000',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    <Icons.Edit size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    <Icons.Delete size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this order?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
            {billModal.isOpen && (
                <CreateBill
                    onClose={() => setBillModal({ isOpen: false })}
                />
            )}
            {editingId && (
                <UOrder
                    orderId={editingId}
                    onOrderUpdated={() => {
                        fetchOrders();
                        setEditingId(null);
                    }}
                    onClose={() => setEditingId(null)}
                />
            )}

            {/* Show Bills Modal */}
            {showBillsModal.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}
                onClick={() => setShowBillsModal({ isOpen: false, orderId: null, bills: [] })}
                >
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333' }}>
                                Bills for Order: {showBillsModal.orderId}
                            </h2>
                            <button
                                onClick={() => setShowBillsModal({ isOpen: false, orderId: null, bills: [], paidBills: [], unpaidBills: [] })}
                                style={{
                                    padding: '8px 16px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Close
                            </button>
                        </div>

                        {showBillsModal.bills.length === 0 ? (
                            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                No bills found{showBillsModal.orderId !== 'All Orders' ? ' for this order' : ''}.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Toggle Buttons */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                    {showBillsModal.unpaidBills.length > 0 && (
                                        <button
                                            onClick={() => setShowUnpaidBills(!showUnpaidBills)}
                                            style={{
                                                padding: '8px 16px',
                                                background: showUnpaidBills ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#e5e7eb',
                                                color: showUnpaidBills ? 'white' : '#6b7280',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '4px', 
                                                backgroundColor: showUnpaidBills ? 'rgba(255,255,255,0.3)' : '#d1d5db', 
                                                color: showUnpaidBills ? 'white' : '#6b7280',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {showBillsModal.unpaidBills.length}
                                            </span>
                                            Bills Chưa Thanh Toán
                                        </button>
                                    )}
                                    {showBillsModal.paidBills.length > 0 && (
                                        <button
                                            onClick={() => setShowPaidBills(!showPaidBills)}
                                            style={{
                                                padding: '8px 16px',
                                                background: showPaidBills ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#e5e7eb',
                                                color: showPaidBills ? 'white' : '#6b7280',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '4px', 
                                                backgroundColor: showPaidBills ? 'rgba(255,255,255,0.3)' : '#d1d5db', 
                                                color: showPaidBills ? 'white' : '#6b7280',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {showBillsModal.paidBills.length}
                                            </span>
                                            Bills Đã Thanh Toán
                                        </button>
                                    )}
                                </div>

                                {/* Unpaid Bills Section */}
                                {showUnpaidBills && showBillsModal.unpaidBills.length > 0 && (
                                    <div>
                                        <h3 style={{ 
                                            margin: '0 0 12px 0', 
                                            fontSize: '18px', 
                                            fontWeight: '600', 
                                            color: '#92400e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                backgroundColor: '#fef3c7', 
                                                color: '#92400e',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {showBillsModal.unpaidBills.length}
                                            </span>
                                            Bills Chưa Thanh Toán
                                        </h3>
                                        <div style={{
                                            overflowX: 'auto',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                backgroundColor: 'white'
                                            }}>
                                                <thead>
                                                    <tr style={{
                                                        backgroundColor: '#f8f9fa',
                                                        borderBottom: '2px solid #dee2e6'
                                                    }}>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Bill ID</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Order ID</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Total Amount</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Status</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Created At</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {showBillsModal.unpaidBills.map((bill) => (
                                                        <tr
                                                            key={bill.id}
                                                            style={{
                                                                borderBottom: '1px solid #e9ecef'
                                                            }}
                                                        >
                                                            <td style={{ padding: '12px 16px', color: '#333', fontSize: '14px', fontWeight: '500' }}>{bill.id}</td>
                                                            <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>{bill.order_id || bill.orderId || '-'}</td>
                                                            <td style={{ padding: '12px 16px', color: '#333', fontSize: '14px' }}>
                                                                {bill.total_amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bill.total_amount) : '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: '#fef3c7',
                                                                    color: '#92400e'
                                                                }}>
                                                                    {bill.status || 'pending'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>
                                                                {bill.created_at ? new Date(bill.created_at).toLocaleString('vi-VN') : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Paid Bills Section */}
                                {showPaidBills && showBillsModal.paidBills.length > 0 && (
                                    <div>
                                        <h3 style={{ 
                                            margin: '0 0 12px 0', 
                                            fontSize: '18px', 
                                            fontWeight: '600', 
                                            color: '#065f46',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                backgroundColor: '#d1fae5', 
                                                color: '#065f46',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {showBillsModal.paidBills.length}
                                            </span>
                                            Bills Đã Thanh Toán
                                        </h3>
                                        <div style={{
                                            overflowX: 'auto',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                backgroundColor: 'white'
                                            }}>
                                                <thead>
                                                    <tr style={{
                                                        backgroundColor: '#f8f9fa',
                                                        borderBottom: '2px solid #dee2e6'
                                                    }}>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Bill ID</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Order ID</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Total Amount</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Status</th>
                                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Created At</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {showBillsModal.paidBills.map((bill) => (
                                                        <tr
                                                            key={bill.id}
                                                            style={{
                                                                borderBottom: '1px solid #e9ecef'
                                                            }}
                                                        >
                                                            <td style={{ padding: '12px 16px', color: '#333', fontSize: '14px', fontWeight: '500' }}>{bill.id}</td>
                                                            <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>{bill.order_id || bill.orderId || '-'}</td>
                                                            <td style={{ padding: '12px 16px', color: '#333', fontSize: '14px' }}>
                                                                {bill.total_amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bill.total_amount) : '-'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: '#d1fae5',
                                                                    color: '#065f46'
                                                                }}>
                                                                    paid
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#666', fontSize: '14px' }}>
                                                                {bill.created_at ? new Date(bill.created_at).toLocaleString('vi-VN') : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderL;

