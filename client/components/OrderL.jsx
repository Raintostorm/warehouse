import { useState, useEffect, useMemo } from 'react';
import { orderAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';
import ExportImportButtons from './ExportImportButtons';
import ConfirmationModal from '../src/components/ConfirmationModal';
import CreateBill from './CreateBill';

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
        if (!searchTerm) return orders;
        const term = searchTerm.toLowerCase();
        return orders.filter(o => 
            o.id?.toLowerCase().includes(term) ||
            o.type?.toLowerCase().includes(term) ||
            o.customer_name?.toLowerCase().includes(term) ||
            o.u_id?.toLowerCase().includes(term)
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
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{order.u_id || <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                                            {order.total ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total) : <span style={{ color: '#999' }}>-</span>}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setBillModal({ isOpen: true })}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Icons.Success size={16} /> Bill
                                                </button>
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
        </div>
    );
};

export default OrderL;

