import { useEffect, useState } from 'react';
import { useTheme } from '../src/contexts/ThemeContext';
import { useToast } from '../src/contexts/ToastContext';
import { paymentAPI } from '../services/api';
import Icons from '../src/utils/icons';
import LoadingSpinner from '../src/components/LoadingSpinner';

const PaymentCallback = () => {
    const { isDark } = useTheme();
    const { success: showSuccess, error: showError } = useToast();
    const [status, setStatus] = useState('loading'); // loading, success, failed
    const [paymentData, setPaymentData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('paymentId');
        const gateway = urlParams.get('gateway');
        const message = urlParams.get('message');

        // Check if this is a success or failure callback
        if (paymentId) {
            // Success callback
            fetchPaymentDetails(paymentId);
            setStatus('success');
            showSuccess(`Payment completed successfully via ${gateway?.toUpperCase() || 'gateway'}`);
        } else if (message) {
            // Failure callback
            setStatus('failed');
            setErrorMessage(decodeURIComponent(message));
            showError(`Payment failed: ${decodeURIComponent(message)}`);
        } else {
            // No paymentId and no message - this shouldn't happen if server redirects correctly
            // But if it does, show a generic error
            setStatus('failed');
            setErrorMessage('Payment callback received but no payment information available');
            console.warn('PaymentCallback: No paymentId or message in URL params', { urlParams: Array.from(urlParams.entries()) });
        }
    }, []);

    const fetchPaymentDetails = async (paymentId) => {
        try {
            const response = await paymentAPI.getPaymentById(paymentId);
            if (response.success) {
                setPaymentData(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch payment details:', err);
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

    const bgGradient = isDark
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)';
    const cardBg = isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const textPrimary = isDark ? '#f1f5f9' : '#1f2937';
    const textSecondary = isDark ? '#cbd5e1' : '#6b7280';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    if (status === 'loading') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: bgGradient
            }}>
                <LoadingSpinner text="Processing payment..." />
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px',
            background: bgGradient
        }}>
            <div style={{
                background: cardBg,
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: isDark
                    ? '0 32px 64px -12px rgba(0, 0, 0, 0.6)'
                    : '0 32px 64px -12px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${borderColor}`,
                textAlign: 'center'
            }}>
                {status === 'success' ? (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)'
                        }}>
                            <Icons.Success size={40} color="white" />
                        </div>
                        <h2 style={{
                            margin: '0 0 16px 0',
                            fontSize: '28px',
                            fontWeight: '700',
                            color: textPrimary
                        }}>
                            Payment Successful!
                        </h2>
                        <p style={{
                            margin: '0 0 32px 0',
                            color: textSecondary,
                            fontSize: '16px'
                        }}>
                            Your payment has been processed successfully.
                        </p>
                        {paymentData && (
                            <div style={{
                                background: isDark ? '#1e293b' : '#f8f9fa',
                                borderRadius: '12px',
                                padding: '24px',
                                marginBottom: '24px',
                                textAlign: 'left'
                            }}>
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: textPrimary
                                }}>
                                    Payment Details
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: textSecondary }}>Payment ID:</span>
                                        <span style={{ color: textPrimary, fontWeight: '600' }}>{paymentData.id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: textSecondary }}>Order ID:</span>
                                        <span style={{ color: textPrimary, fontWeight: '600' }}>{paymentData.order_id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: textSecondary }}>Amount:</span>
                                        <span style={{ color: textPrimary, fontWeight: '600' }}>{formatCurrency(paymentData.amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: textSecondary }}>Method:</span>
                                        <span style={{ color: textPrimary, fontWeight: '600', textTransform: 'capitalize' }}>{paymentData.payment_method}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: textSecondary }}>Date:</span>
                                        <span style={{ color: textPrimary, fontWeight: '600' }}>{formatDate(paymentData.payment_date)}</span>
                                    </div>
                                    {paymentData.transaction_id && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: textSecondary }}>Transaction ID:</span>
                                            <span style={{ color: textPrimary, fontWeight: '600' }}>{paymentData.transaction_id}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            border: `1px solid ${isDark ? '#3b82f6' : '#60a5fa'}`,
                            marginBottom: '24px',
                            fontSize: '13px',
                            color: isDark ? '#93c5fd' : '#1e40af'
                        }}>
                            ⚠️ Sandbox Mode - This is a test payment
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
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
                            Back to Dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)'
                        }}>
                            <Icons.Close size={40} color="white" />
                        </div>
                        <h2 style={{
                            margin: '0 0 16px 0',
                            fontSize: '28px',
                            fontWeight: '700',
                            color: textPrimary
                        }}>
                            Payment Failed
                        </h2>
                        <p style={{
                            margin: '0 0 32px 0',
                            color: textSecondary,
                            fontSize: '16px'
                        }}>
                            {errorMessage || 'Your payment could not be processed. Please try again.'}
                        </p>
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.05)',
                            border: `1px solid ${isDark ? '#ef4444' : '#fecaca'}`,
                            marginBottom: '24px',
                            fontSize: '13px',
                            color: isDark ? '#fca5a5' : '#991b1b'
                        }}>
                            ⚠️ Sandbox Mode - This is a test payment
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => window.location.href = '/'}
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
                                Back to Dashboard
                            </button>
                            <button
                                onClick={() => window.location.href = '/?tab=payments'}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
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
                                Try Again
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
