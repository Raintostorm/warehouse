import { useState, useEffect, useMemo } from 'react';
import { billAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';
import ExportImportButtons from './ExportImportButtons';
import ConfirmationModal from '../src/components/ConfirmationModal';
import CreateBill from './CreateBill';
import UBill from './UBill';

const BillL = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingBillId, setEditingBillId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [billModal, setBillModal] = useState({ isOpen: false });
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'paid', 'cancelled'
    const [billOrders, setBillOrders] = useState({}); // { billId: [orders] }
    const [expandedBills, setExpandedBills] = useState(new Set()); // Track which bills are expanded

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await billAPI.getAllBills();
            if (response.success) {
                const billsData = response.data || [];
                setBills(billsData);
                
                // Fetch orders for each bill
                const ordersMap = {};
                for (const bill of billsData) {
                    try {
                        const ordersResponse = await billAPI.getOrdersByBillId(bill.id);
                        if (ordersResponse.success) {
                            ordersMap[bill.id] = ordersResponse.data || [];
                        }
                    } catch {
                        // If bill_orders doesn't exist or error, use order_id as fallback
                        if (bill.order_id || bill.orderId) {
                            ordersMap[bill.id] = [{ id: bill.order_id || bill.orderId }];
                        } else {
                            ordersMap[bill.id] = [];
                        }
                    }
                }
                setBillOrders(ordersMap);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch bills');
        } finally {
            setLoading(false);
        }
    };

    const toggleBillExpansion = (billId) => {
        setExpandedBills(prev => {
            const newSet = new Set(prev);
            if (newSet.has(billId)) {
                newSet.delete(billId);
            } else {
                newSet.add(billId);
            }
            return newSet;
        });
    };

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        const id = confirmModal.id;
        try {
            const response = await billAPI.deleteBill(id);
            if (response.success) {
                fetchBills();
                showSuccess('Bill deleted successfully!');
            } else {
                const errorMsg = response.message || response.error || 'Unknown error';
                showError('Delete error: ' + errorMsg);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete bill';
            showError('Delete bill error: ' + errorMsg);
        }
        setConfirmModal({ isOpen: false, id: null });
    };

    // Categorize bills
    const categorizedBills = useMemo(() => {
        return bills.map(bill => {
            // For now, use bill status directly
            // In a real implementation, you might want to check payments
            return {
                ...bill,
                isPaid: bill.status === 'paid',
                isPending: bill.status === 'pending',
                isCancelled: bill.status === 'cancelled'
            };
        });
    }, [bills]);

    const filteredBills = useMemo(() => {
        let filtered = categorizedBills;

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(bill => bill.status === filterStatus);
        }

        // Filter by search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(bill => {
                const billId = (bill.id || '').toLowerCase();
                const orderId = ((bill.order_id || bill.orderId) || '').toLowerCase();
                
                // Also search in orders from bill_orders
                const orders = billOrders[bill.id] || [];
                const orderIds = orders.map(o => (o.id || o.Id || '').toLowerCase()).join(' ');
                
                return billId.includes(search) || orderId.includes(search) || orderIds.includes(search);
            });
        }

        return filtered;
    }, [categorizedBills, filterStatus, searchTerm, billOrders]);

    const paginatedBills = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBills.slice(startIndex, endIndex);
    }, [filteredBills, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Icons.Loading size={48} />
                <p style={{ marginTop: '20px', color: '#666' }}>Loading bills...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>Error: {error}</p>
                <button
                    onClick={fetchBills}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Bills Management</h1>
                {isAdmin && (
                    <button
                        onClick={() => setBillModal({ isOpen: true })}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        <Icons.Add size={20} />
                        Create Bill
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder="Search by Bill ID or Order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Total: {filteredBills.length}</span>
                </div>
            </div>

            {/* Bills Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Bill ID</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order ID</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Total Amount</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Created At</th>
                                {isAdmin && <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedBills.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        No bills found
                                    </td>
                                </tr>
                            ) : (
                                paginatedBills.map((bill) => (
                                    <tr key={bill.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <td style={{ padding: '16px', color: '#1f2937', fontWeight: '500' }}>{bill.id}</td>
                                        <td style={{ padding: '16px', color: '#6b7280' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {(billOrders[bill.id] || []).length > 0 ? (
                                                    <>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span>{(billOrders[bill.id] || []).length} order(s)</span>
                                                            <button
                                                                onClick={() => toggleBillExpansion(bill.id)}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    background: '#f1f5f9',
                                                                    border: '1px solid #cbd5e1',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '11px',
                                                                    color: '#475569'
                                                                }}
                                                            >
                                                                {expandedBills.has(bill.id) ? 'Hide' : 'Show'}
                                                            </button>
                                                        </div>
                                                        {expandedBills.has(bill.id) && (
                                                            <div style={{ 
                                                                marginTop: '8px', 
                                                                padding: '8px', 
                                                                background: '#f8f9fa', 
                                                                borderRadius: '6px',
                                                                fontSize: '12px'
                                                            }}>
                                                                {(billOrders[bill.id] || []).map((order, idx) => (
                                                                    <div key={order.id || order.Id || idx} style={{ 
                                                                        padding: '4px 0',
                                                                        borderBottom: idx < (billOrders[bill.id] || []).length - 1 ? '1px solid #e5e7eb' : 'none'
                                                                    }}>
                                                                        {order.id || order.Id || '-'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    bill.order_id || bill.orderId || '-'
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#1f2937', fontWeight: '500' }}>
                                            {bill.total_amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bill.total_amount) : '-'}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: bill.status === 'paid' ? '#d1fae5' : bill.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                                                color: bill.status === 'paid' ? '#065f46' : bill.status === 'cancelled' ? '#991b1b' : '#92400e'
                                            }}>
                                                {bill.status || 'pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                                            {bill.created_at ? new Date(bill.created_at).toLocaleString('vi-VN') : '-'}
                                        </td>
                                        {isAdmin && (
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => setEditingBillId(bill.id)}
                                                        disabled={bill.status === 'paid'}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: bill.status === 'paid' ? '#9ca3af' : '#3b82f6',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: bill.status === 'paid' ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            opacity: bill.status === 'paid' ? 0.6 : 1
                                                        }}
                                                        title={bill.status === 'paid' ? 'Cannot edit paid bills' : 'Edit Bill'}
                                                    >
                                                        <Icons.Edit size={14} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(bill.id)}
                                                        disabled={bill.status === 'paid'}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: bill.status === 'paid' ? '#9ca3af' : '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: bill.status === 'paid' ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            opacity: bill.status === 'paid' ? 0.6 : 1
                                                        }}
                                                        title={bill.status === 'paid' ? 'Cannot delete paid bills' : 'Delete Bill'}
                                                    >
                                                        <Icons.Delete size={14} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        totalItems={filteredBills.length}
                    />
                </div>
            )}

            {/* Modals */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Confirm Delete Bill"
                message="Are you sure you want to delete this bill? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
            {billModal.isOpen && (
                <CreateBill
                    onClose={() => {
                        setBillModal({ isOpen: false });
                        fetchBills();
                    }}
                />
            )}
            {editingBillId && (
                <UBill
                    billId={editingBillId}
                    onBillUpdated={() => {
                        fetchBills();
                        setEditingBillId(null);
                    }}
                    onClose={() => setEditingBillId(null)}
                />
            )}
        </div>
    );
};

export default BillL;

