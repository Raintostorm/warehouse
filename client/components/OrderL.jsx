import { useState, useEffect, useMemo } from 'react';
import { orderAPI, supplierAPI, billAPI, paymentAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';
import ExportImportButtons from './ExportImportButtons';
import ConfirmationModal from '../src/components/ConfirmationModal';
import UOrder from './UOrder';

const OrderL = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState(''); // Filter by order type
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchOrders();
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await supplierAPI.getAllSuppliers();
            if (response.success) {
                setSuppliers(response.data || []);
            }
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

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

    // Unused function - kept for future use
    // const handleShowBills = async (orderId) => {
    //     try {
    //         let bills = [];
    //         if (orderId) {
    //             // Show bills for specific order
    //             const response = await billAPI.getBillsByOrderId(orderId);
    //             if (response.success) {
    //                 bills = response.data || [];
    //             } else {
    //                 showError('Failed to fetch bills: ' + response.message);
    //                 return;
    //             }
    //         } else {
    //             // Show all bills
    //             const response = await billAPI.getAllBills();
    //             if (response.success) {
    //                 bills = response.data || [];
    //             } else {
    //                 showError('Failed to fetch bills: ' + response.message);
    //                 return;
    //             }
    //         }

    //         // Fetch all payments to check bill payment status
    //         const paymentsResponse = await paymentAPI.getAllPayments();
    //         const allPayments = paymentsResponse.success ? (paymentsResponse.data || []) : [];

    //         // Categorize bills into paid and unpaid
    //         const paidBills = [];
    //         const unpaidBills = [];

    //         for (const bill of bills) {
    //             // Find payments by bill_id first, then fallback to order_id if bill_id is null
    //             let billPayments = allPayments.filter(p => 
    //                 (p.bill_id === bill.id || p.billId === bill.id) && 
    //                 (p.bill_id || p.billId) // Only if bill_id exists
    //             );
                
    //             // If no payments found by bill_id, try to find by order_id
    //             if (billPayments.length === 0) {
    //                 const billOrderId = bill.order_id || bill.orderId;
    //                 billPayments = allPayments.filter(p => 
    //                     (p.order_id === billOrderId || p.orderId === billOrderId)
    //                 );
    //             }
                
    //             const totalPaid = billPayments
    //                 .filter(p => {
    //                     const status = p.payment_status || p.paymentStatus;
    //                     return status === 'completed';
    //                 })
    //                 .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
    //             const billTotal = parseFloat(bill.total_amount || bill.totalAmount || 0);
    //             const isPaid = billTotal > 0 && totalPaid >= billTotal;

    //             // Debug logging
    //             console.log('Bill payment check:', {
    //                 billId: bill.id,
    //                 orderId: bill.order_id || bill.orderId,
    //                 billTotal,
    //                 totalPaid,
    //                 isPaid,
    //                 billStatus: bill.status,
    //                 paymentsFound: billPayments.length,
    //                 payments: billPayments.map(p => ({ 
    //                     id: p.id, 
    //                     amount: p.amount, 
    //                     status: p.payment_status || p.paymentStatus, 
    //                     bill_id: p.bill_id || p.billId,
    //                     order_id: p.order_id || p.orderId
    //                 }))
    //             });

    //             if (isPaid || bill.status === 'paid') {
    //                 paidBills.push(bill);
    //             } else if (bill.status !== 'cancelled') {
    //                 unpaidBills.push(bill);
    //             }
    //         }

    //         setShowBillsModal({ 
    //             isOpen: true, 
    //             orderId: orderId || 'All Orders', 
    //             bills: bills,
    //             paidBills: paidBills,
    //             unpaidBills: unpaidBills
    //         });
    //         // Reset toggle states when opening modal
    //         setShowPaidBills(true);
    //         setShowUnpaidBills(true);
    //     } catch (err) {
    //         showError('Failed to fetch bills: ' + (err.response?.data?.error || err.message));
    //     }
    // };

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
        let validOrders = orders.filter(o => o.type !== 'gateway_payment');
        
        // Filter by order type
        if (filterType) {
            validOrders = validOrders.filter(o => 
                (o.type || '').toLowerCase() === filterType.toLowerCase()
            );
        }
        
        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            validOrders = validOrders.filter(o =>
                o.id?.toLowerCase().includes(term) ||
                o.type?.toLowerCase().includes(term) ||
                o.customer_name?.toLowerCase().includes(term) ||
                o.supplier_id?.toLowerCase().includes(term) ||
                (o.user_id || o.userId || o.u_id || o.uId)?.toLowerCase().includes(term)
            );
        }
        
        return validOrders;
    }, [orders, searchTerm, filterType]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType]);

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
                        placeholder="Search by ID, type, customer, supplier..."
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
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '12px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">All Types</option>
                    <option value="sale">Sale</option>
                    <option value="import">Import</option>
                </select>
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
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
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
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Type</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Date</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Customer/Supplier</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>User ID</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Total</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Actions</th>
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
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: (order.type || '').toLowerCase() === 'sale' ? '#dbeafe' : (order.type || '').toLowerCase() === 'import' ? '#dcfce7' : '#f3f4f6',
                                                color: (order.type || '').toLowerCase() === 'sale' ? '#1e40af' : (order.type || '').toLowerCase() === 'import' ? '#166534' : '#6b7280'
                                            }}>
                                                {(order.type || '').toUpperCase() || '-'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{order.date ? new Date(order.date).toLocaleDateString('vi-VN') : <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>
                                            {(order.type || '').toLowerCase() === 'sale' ? (
                                                <span>{order.customer_name || <span style={{ color: '#999' }}>-</span>}</span>
                                            ) : (order.type || '').toLowerCase() === 'import' ? (
                                                <span>
                                                    {(() => {
                                                        const supplier = suppliers.find(s => (s.id || s.Id) === (order.supplier_id || order.supplierId));
                                                        return supplier ? (supplier.name || supplier.Name || order.supplier_id || order.supplierId) : (order.supplier_id || order.supplierId || <span style={{ color: '#999' }}>-</span>);
                                                    })()}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#999' }}>-</span>
                                            )}
                                        </td>
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

        </div>
    );
};

export default OrderL;

