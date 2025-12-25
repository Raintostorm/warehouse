import { useState, useEffect } from 'react';
import { paymentAPI, billAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { Icons } from '../src/utils/icons';
import LoadingSpinner from '../src/components/LoadingSpinner';
import ConfirmationModal from '../src/components/ConfirmationModal';
import Pagination from '../src/components/Pagination';

const Payments = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const { isDark } = useTheme();
    const [payments, setPayments] = useState([]);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBillId, setSelectedBillId] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, data: null });
    const [gatewayStatus, setGatewayStatus] = useState({});
    const [processingGateway, setProcessingGateway] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Payment form state
    const [paymentForm, setPaymentForm] = useState({
        orderId: '',
        amount: '',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        transactionId: '',
        notes: ''
    });

    useEffect(() => {
        fetchPayments();
        fetchGatewayStatus();
        if (isAdmin) {
            fetchUnpaidBills();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const fetchGatewayStatus = async () => {
        try {
            const response = await paymentAPI.getGatewayStatus();
            if (response.success) {
                setGatewayStatus(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch gateway status:', err);
        }
    };

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await paymentAPI.getAllPayments();
            if (response.success) {
                setPayments(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.userMessage || err.message || 'Failed to fetch payments');
            showError(err.userMessage || err.message || 'Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnpaidBills = async () => {
        try {
            const response = await billAPI.getUnpaidBills();
            if (response.success) {
                setBills(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch unpaid bills:', err);
        }
    };

    const handleCreatePayment = () => {
        // Nếu có selectedBillId, tự động set bill và amount
        const selectedBill = selectedBillId ? bills.find(b => b.id === selectedBillId) : null;
        setPaymentForm({
            billId: selectedBillId || '',
            orderId: selectedBill ? (selectedBill.order_id || '') : '',
            amount: selectedBill ? (selectedBill.total_amount || 0).toString() : '',
            paymentMethod: 'cash',
            paymentStatus: 'completed', // Cash mặc định là completed
            transactionId: '',
            notes: ''
        });
        setEditingPayment(null);
        setShowPaymentModal(true);
    };

    const handleEditPayment = (payment) => {
        setPaymentForm({
            billId: payment.bill_id || payment.billId || '', // Include billId
            orderId: payment.order_id,
            amount: payment.amount,
            paymentMethod: payment.payment_method,
            paymentStatus: payment.payment_status,
            transactionId: payment.transaction_id || '',
            notes: payment.notes || ''
        });
        setEditingPayment(payment);
        setShowPaymentModal(true);
    };

    const handleDeletePayment = (id) => {
        setConfirmModal({
            isOpen: true,
            action: 'delete',
            data: { id }
        });
    };

    const confirmDelete = async () => {
        const { id } = confirmModal.data;
        try {
            const response = await paymentAPI.deletePayment(id);
            if (response.success) {
                fetchPayments();
                if (isAdmin) {
                    fetchUnpaidBills(); // Refresh unpaid bills list after deletion
                }
                showSuccess('Payment deleted successfully!');
            } else {
                showError(response.message || 'Failed to delete payment');
            }
        } catch (err) {
            showError(err.userMessage || err.message || 'Failed to delete payment');
        }
        setConfirmModal({ isOpen: false, action: null, data: null });
    };

    const handleGatewayPayment = async (gateway) => {
        if (!paymentForm.orderId || !paymentForm.amount) {
            showError('Please fill in Order ID and Amount first');
            return;
        }

        try {
            setProcessingGateway(true);
            const response = await paymentAPI.initiateGatewayPayment(
                paymentForm.orderId,
                parseFloat(paymentForm.amount),
                gateway,
                `Thanh toan don hang ${paymentForm.orderId}`
            );

            if (response.success && response.data.paymentUrl) {
                // Redirect to payment gateway
                window.location.href = response.data.paymentUrl;
            } else {
                showError(response.message || 'Failed to initiate gateway payment');
                setProcessingGateway(false);
            }
        } catch (err) {
            showError(err.userMessage || err.message || 'Failed to initiate gateway payment');
            setProcessingGateway(false);
        }
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        // Validation
        if (!paymentForm.orderId || !paymentForm.amount) {
            showError('Vui lòng chọn đơn hàng và nhập số tiền');
            return;
        }

        // Check if it's a gateway payment method
        const gatewayMethods = ['vnpay', 'momo', 'zalopay'];
        if (!editingPayment && gatewayMethods.includes(paymentForm.paymentMethod)) {
            // Handle gateway payment - redirect to sandbox
            await handleGatewayPayment(paymentForm.paymentMethod);
            return;
        }

        try {
            // Nếu là Cash, tự động set status = completed và payment_date = now
            const isCash = paymentForm.paymentMethod === 'cash';
            const finalStatus = isCash ? 'completed' : paymentForm.paymentStatus;
            const paymentDate = (isCash || finalStatus === 'completed') ? new Date().toISOString() : null;

            if (editingPayment) {
                const response = await paymentAPI.updatePayment(editingPayment.id, {
                    billId: paymentForm.billId || null, // Include billId if available
                    orderId: paymentForm.orderId,
                    amount: parseFloat(paymentForm.amount),
                    paymentMethod: paymentForm.paymentMethod,
                    paymentStatus: finalStatus,
                    transactionId: paymentForm.transactionId || null,
                    notes: paymentForm.notes || null,
                    paymentDate: paymentDate
                });
                if (response.success) {
                    showSuccess('Cập nhật thanh toán thành công!');
                    fetchPayments();
                    if (isAdmin) {
                        fetchUnpaidBills(); // Refresh unpaid bills list
                    }
                    setShowPaymentModal(false);
                } else {
                    showError(response.message || 'Không thể cập nhật thanh toán');
                }
            } else {
                const response = await paymentAPI.createPayment({
                    billId: paymentForm.billId || null, // Include billId if available
                    orderId: paymentForm.orderId,
                    amount: parseFloat(paymentForm.amount),
                    paymentMethod: paymentForm.paymentMethod,
                    paymentStatus: finalStatus,
                    transactionId: paymentForm.transactionId || null,
                    notes: paymentForm.notes || null,
                    paymentDate: paymentDate
                });
                if (response.success) {
                    showSuccess(isCash ? 'Thanh toán tiền mặt đã được ghi nhận!' : 'Tạo thanh toán thành công!');
                    fetchPayments();
                    if (isAdmin) {
                        fetchUnpaidBills(); // Refresh unpaid bills list
                    }
                    setShowPaymentModal(false);
                    setSelectedOrderId('');
                    // Reset form
                    setPaymentForm({
                        billId: '',
                        orderId: '',
                        amount: '',
                        paymentMethod: 'cash',
                        paymentStatus: 'pending',
                        transactionId: '',
                        notes: ''
                    });
                } else {
                    showError(response.message || 'Không thể tạo thanh toán');
                }
            }
        } catch (err) {
            showError(err.userMessage || err.message || 'Không thể lưu thanh toán');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return isDark ? '#10b981' : '#059669';
            case 'pending':
                return isDark ? '#f59e0b' : '#d97706';
            case 'failed':
                return isDark ? '#ef4444' : '#dc2626';
            case 'refunded':
                return isDark ? '#8b5cf6' : '#7c3aed';
            default:
                return isDark ? '#64748b' : '#6b7280';
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'completed':
                return isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)';
            case 'pending':
                return isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.1)';
            case 'failed':
                return isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.1)';
            case 'refunded':
                return isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)';
            default:
                return isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(107, 114, 128, 0.1)';
        }
    };

    // Filter payments
    const filteredPayments = payments.filter(payment => {
        // Filter by selectedBillId if set
        if (selectedBillId && payment.bill_id !== selectedBillId) {
            return false;
        }
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            payment.id?.toLowerCase().includes(term) ||
            payment.bill_id?.toLowerCase().includes(term) ||
            payment.order_id?.toLowerCase().includes(term) ||
            payment.payment_method?.toLowerCase().includes(term) ||
            payment.payment_status?.toLowerCase().includes(term) ||
            payment.transaction_id?.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const currentPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Theme colors
    const bgGradient = isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)';
    const cardBg = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const textPrimary = isDark ? '#f1f5f9' : '#1f2937';
    const textSecondary = isDark ? '#cbd5e1' : '#6b7280';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    if (loading) {
        return <LoadingSpinner text="Loading payments..." />;
    }

    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
                border: `1px solid ${isDark ? '#991b1b' : '#fecaca'}`,
                borderRadius: '8px',
                margin: '20px 0',
                textAlign: 'center'
            }}>
                <p style={{ color: isDark ? '#fecaca' : '#991b1b', margin: 0 }}>{error}</p>
                <button
                    onClick={fetchPayments}
                    style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <div style={{
                background: bgGradient,
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: isDark
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                margin: '20px 0',
                border: `1px solid ${borderColor}`,
                animation: 'fadeIn 0.5s ease-out'
            }}>
                {/* Header */}
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
                            fontWeight: '700',
                            color: textPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                            }}>
                                <Icons.File size={24} color="white" />
                            </div>
                            Payment Management
                        </h1>
                        <p style={{ margin: '8px 0 0 0', color: textSecondary, fontSize: '14px' }}>
                            Total: <strong>{filteredPayments.length}</strong> payments
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleCreatePayment}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
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
                            <Icons.Add size={18} /> New Payment
                        </button>
                    )}
                </div>

                {/* Search */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <div style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: textSecondary,
                            zIndex: 1
                        }}>
                            <Icons.Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by ID, order ID, method, status..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                border: `2px solid ${borderColor}`,
                                borderRadius: '12px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.3s',
                                backgroundColor: cardBg,
                                color: textPrimary,
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#475569';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(71, 85, 105, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = borderColor;
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Order Filter (Admin only) */}
                {isAdmin && (
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: textSecondary,
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            Filter by Bill:
                        </label>
                        <select
                            value={selectedBillId}
                            onChange={(e) => setSelectedBillId(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                border: `2px solid ${borderColor}`,
                                borderRadius: '12px',
                                fontSize: '15px',
                                backgroundColor: cardBg,
                                color: textPrimary,
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '200px'
                            }}
                        >
                            <option value="">All Bills</option>
                            {bills.map(bill => (
                                <option key={bill.id} value={bill.id}>
                                    {bill.id} - Order: {bill.order_id} ({formatCurrency(bill.total_amount || 0)})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Payments Table */}
                <div style={{
                    overflowX: 'auto',
                    borderRadius: '16px',
                    border: `1px solid ${borderColor}`,
                    background: cardBg,
                    boxShadow: isDark
                        ? '0 1px 3px rgba(0, 0, 0, 0.3)'
                        : '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: cardBg
                    }}>
                        <thead>
                            <tr style={{
                                background: isDark
                                    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                                    : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                borderBottom: `2px solid ${borderColor}`
                            }}>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: textPrimary,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Payment ID</th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: textPrimary,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Order ID</th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: textPrimary,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Amount</th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: textPrimary,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Method</th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: textPrimary,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Status</th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: textPrimary,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Date</th>
                                {isAdmin && (
                                    <th style={{
                                        padding: '16px 20px',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        color: textPrimary,
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {currentPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 7 : 6} style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: textSecondary
                                    }}>
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                currentPayments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        style={{
                                            borderBottom: `1px solid ${borderColor}`,
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f8f9fa';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <td style={{
                                            padding: '16px 20px',
                                            color: textPrimary,
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>{payment.id}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: textPrimary,
                                            fontSize: '14px'
                                        }}>{payment.order_id}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: textPrimary,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textAlign: 'right'
                                        }}>{formatCurrency(payment.amount)}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: textSecondary,
                                            fontSize: '14px',
                                            textTransform: 'capitalize'
                                        }}>{payment.payment_method}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: getStatusBg(payment.payment_status),
                                                color: getStatusColor(payment.payment_status),
                                                textTransform: 'capitalize'
                                            }}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: textSecondary,
                                            fontSize: '14px'
                                        }}>{formatDate(payment.payment_date)}</td>
                                        {isAdmin && (
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    justifyContent: 'center',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <button
                                                        onClick={() => handleEditPayment(payment)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'all 0.3s',
                                                            boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(71, 85, 105, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(71, 85, 105, 0.2)';
                                                        }}
                                                    >
                                                        <Icons.Edit size={16} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'all 0.3s',
                                                            boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(71, 85, 105, 0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(71, 85, 105, 0.2)';
                                                        }}
                                                    >
                                                        <Icons.Delete size={16} /> Delete
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}
                    onClick={() => setShowPaymentModal(false)}
                >
                    <div style={{
                        background: cardBg,
                        borderRadius: '20px',
                        padding: '32px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: isDark
                            ? '0 32px 64px -12px rgba(0, 0, 0, 0.6)'
                            : '0 32px 64px -12px rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${borderColor}`
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{
                            margin: '0 0 24px 0',
                            fontSize: '24px',
                            fontWeight: '700',
                            color: textPrimary
                        }}>
                            {editingPayment ? 'Chỉnh sửa thanh toán' : 'Tạo thanh toán mới'}
                        </h2>
                        <form onSubmit={handleSubmitPayment}>
                            {isAdmin && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: textSecondary,
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Đơn hàng (Bill) *
                                    </label>
                                    <select
                                        value={paymentForm.billId}
                                        onChange={(e) => {
                                            const selectedBill = bills.find(b => b.id === e.target.value);
                                            setPaymentForm({
                                                ...paymentForm,
                                                billId: e.target.value,
                                                orderId: selectedBill ? (selectedBill.order_id || '') : '',
                                                // Tự động lấy amount từ bill total
                                                amount: selectedBill ? (selectedBill.total_amount || 0).toString() : ''
                                            });
                                        }}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: `2px solid ${borderColor}`,
                                            borderRadius: '12px',
                                            fontSize: '15px',
                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                            color: textPrimary,
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Chọn hóa đơn</option>
                                        {bills.map(bill => (
                                            <option key={bill.id} value={bill.id}>
                                                {bill.id} - Order: {bill.order_id} ({formatCurrency(bill.total_amount || 0)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: textSecondary,
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    Số tiền (VND) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    required
                                    placeholder="Tự động lấy từ đơn hàng"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        color: textPrimary,
                                        outline: 'none'
                                    }}
                                />
                                {paymentForm.billId && (() => {
                                    const selectedBill = bills.find(b => b.id === paymentForm.billId);
                                    return selectedBill ? (
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '13px',
                                            color: textSecondary
                                        }}>
                                            Tổng hóa đơn: <strong>{formatCurrency(selectedBill.total_amount || 0)}</strong>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: textSecondary,
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    Phương thức thanh toán *
                                </label>
                                <select
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => {
                                        const method = e.target.value;
                                        setPaymentForm({
                                            ...paymentForm,
                                            paymentMethod: method,
                                            // Nếu là Cash, tự động set status = completed
                                            paymentStatus: method === 'cash' ? 'completed' : paymentForm.paymentStatus
                                        });
                                    }}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        color: textPrimary,
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="cash">Tiền mặt (Cash)</option>
                                    <option value="vnpay">VNPay (Sandbox)</option>
                                    <option value="momo">MoMo (Sandbox)</option>
                                    <option value="zalopay">ZaloPay (Sandbox)</option>
                                    <option value="bank_transfer">Chuyển khoản</option>
                                    <option value="credit_card">Thẻ tín dụng</option>
                                    <option value="other">Khác</option>
                                </select>
                                {/* Show gateway status */}
                                {['vnpay', 'momo', 'zalopay'].includes(paymentForm.paymentMethod) && (() => {
                                    const gateway = gatewayStatus?.[paymentForm.paymentMethod];
                                    const isEnabled = gateway?.enabled ?? false;
                                    const isSandbox = gateway?.sandbox ?? true;

                                    return (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            backgroundColor: isEnabled
                                                ? (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)')
                                                : (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)'),
                                            border: `1px solid ${isEnabled
                                                ? (isDark ? '#10b981' : '#059669')
                                                : (isDark ? '#ef4444' : '#dc2626')}`,
                                            fontSize: '13px',
                                            color: isEnabled
                                                ? (isDark ? '#10b981' : '#059669')
                                                : (isDark ? '#ef4444' : '#dc2626')
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '600' }}>
                                                    {isEnabled ? '✓' : '✗'}
                                                </span>
                                                <span>
                                                    {isEnabled
                                                        ? `${paymentForm.paymentMethod.toUpperCase()} Sandbox Mode - Ready`
                                                        : `${paymentForm.paymentMethod.toUpperCase()} Sandbox Mode - Not Configured`}
                                                </span>
                                            </div>
                                            {isSandbox && (
                                                <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.8 }}>
                                                    ⚠️ Sandbox mode - Test payments only
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                            {/* Payment Status - chỉ hiển thị cho Cash và các method khác (không phải gateway) */}
                            {!['vnpay', 'momo', 'zalopay'].includes(paymentForm.paymentMethod) && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: textSecondary,
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Trạng thái thanh toán *
                                    </label>
                                    <select
                                        value={paymentForm.paymentStatus}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
                                        required
                                        disabled={paymentForm.paymentMethod === 'cash'} // Disable nếu là Cash (tự động completed)
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: `2px solid ${borderColor}`,
                                            borderRadius: '12px',
                                            fontSize: '15px',
                                            backgroundColor: paymentForm.paymentMethod === 'cash'
                                                ? (isDark ? '#1e293b' : '#f1f5f9')
                                                : (isDark ? '#1e293b' : '#ffffff'),
                                            color: textPrimary,
                                            outline: 'none',
                                            cursor: paymentForm.paymentMethod === 'cash' ? 'not-allowed' : 'pointer',
                                            opacity: paymentForm.paymentMethod === 'cash' ? 0.7 : 1
                                        }}
                                    >
                                        <option value="pending">Đang chờ</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="failed">Thất bại</option>
                                        <option value="refunded">Đã hoàn tiền</option>
                                    </select>
                                    {paymentForm.paymentMethod === 'cash' && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                                            border: `1px solid ${isDark ? '#10b981' : '#059669'}`,
                                            fontSize: '13px',
                                            color: isDark ? '#10b981' : '#059669'
                                        }}>
                                            ✓ Tiền mặt: Tự động đánh dấu là "Hoàn thành" khi tạo payment
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Show gateway payment info */}
                            {!editingPayment && ['vnpay', 'momo', 'zalopay'].includes(paymentForm.paymentMethod) && (
                                <div style={{
                                    marginBottom: '20px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                                    border: `1px solid ${isDark ? '#3b82f6' : '#60a5fa'}`,
                                    fontSize: '13px',
                                    color: isDark ? '#93c5fd' : '#1e40af'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                        ℹ️ Thông tin thanh toán qua Gateway
                                    </div>
                                    <div>
                                        Khi bạn submit, bạn sẽ được chuyển đến trang thanh toán {paymentForm.paymentMethod.toUpperCase()} sandbox.
                                        Sau khi hoàn tất thanh toán, bạn sẽ được chuyển hướng về tự động.
                                    </div>
                                </div>
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: textSecondary,
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    Mã giao dịch
                                </label>
                                <input
                                    type="text"
                                    value={paymentForm.transactionId}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                                    placeholder="Mã giao dịch (tùy chọn)"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        color: textPrimary,
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: textSecondary,
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    Ghi chú
                                </label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    placeholder="Ghi chú (tùy chọn)"
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                        color: textPrimary,
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'transparent',
                                        color: textPrimary,
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isDark ? '#334155' : '#f1f5f9';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingGateway}
                                    style={{
                                        padding: '12px 24px',
                                        background: processingGateway
                                            ? (isDark ? '#475569' : '#94a3b8')
                                            : (paymentForm.paymentMethod === 'cash'
                                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                                : ['vnpay', 'momo', 'zalopay'].includes(paymentForm.paymentMethod)
                                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)'),
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: processingGateway ? 'not-allowed' : 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: processingGateway ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!processingGateway) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!processingGateway) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                        }
                                    }}
                                >
                                    {processingGateway ? (
                                        <>
                                            <Icons.Loading size={18} /> Đang xử lý...
                                        </>
                                    ) : paymentForm.paymentMethod === 'cash' ? (
                                        <>
                                            <Icons.Success size={18} /> Xác nhận thanh toán tiền mặt
                                        </>
                                    ) : ['vnpay', 'momo', 'zalopay'].includes(paymentForm.paymentMethod) ? (
                                        <>
                                            <Icons.File size={18} /> Thanh toán qua {paymentForm.paymentMethod.toUpperCase()}
                                        </>
                                    ) : (
                                        <>
                                            <Icons.Success size={18} /> {editingPayment ? 'Cập nhật' : 'Tạo'} thanh toán
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, action: null, data: null })}
                onConfirm={confirmDelete}
                title="Delete Payment"
                message="Are you sure you want to delete this payment? This action cannot be undone."
            />
        </>
    );
};

export default Payments;
