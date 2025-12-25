import { useState, useEffect } from 'react';
import { lowStockAlertAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import ConfirmationModal from '../src/components/ConfirmationModal';

const LowStockAlerts = ({ products, warehouses, onRefresh }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    const { success: showSuccess, error: showError } = useToast();
    
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResolved, setShowResolved] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, alertId: null });

    useEffect(() => {
        fetchAlerts();
    }, [showResolved]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = showResolved 
                ? await lowStockAlertAPI.getAllAlerts()
                : await lowStockAlertAPI.getActiveAlerts();
            
            if (response.success) {
                setAlerts(response.data || []);
            } else {
                showError('Failed to fetch alerts: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching alerts: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = (alertId) => {
        setConfirmModal({ isOpen: true, alertId });
    };

    const confirmResolve = async () => {
        const { alertId } = confirmModal;
        try {
            const response = await lowStockAlertAPI.resolveAlert(alertId);
            if (response.success) {
                showSuccess('Alert resolved successfully!');
                fetchAlerts();
                if (onRefresh) onRefresh();
            } else {
                showError(response.message || 'Failed to resolve alert');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        }
        setConfirmModal({ isOpen: false, alertId: null });
    };

    const alertLevelColors = {
        'warning': { bg: '#fef3c7', color: '#d97706', icon: Icons.AlertTriangle, label: 'Cảnh Báo' },
        'critical': { bg: '#fee2e2', color: '#dc2626', icon: Icons.AlertCircle, label: 'Nghiêm Trọng' },
        'out_of_stock': { bg: '#fecaca', color: '#991b1b', icon: Icons.XCircle, label: 'Hết Hàng' },
        'resolved': { bg: '#d1fae5', color: '#059669', icon: Icons.CheckCircle, label: 'Đã Xử Lý' }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Icons.Loader className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: '12px', color: '#666' }}>Đang tải cảnh báo...</div>
            </div>
        );
    }

    const activeAlerts = alerts.filter(a => !a.is_resolved);
    const resolvedAlerts = alerts.filter(a => a.is_resolved);

    return (
        <div>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                    Cảnh Báo Tồn Kho Thấp
                </h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}>
                        <input
                            type="checkbox"
                            checked={showResolved}
                            onChange={(e) => setShowResolved(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Hiển thị đã xử lý
                    </label>
                    <button
                        onClick={fetchAlerts}
                        style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                        <Icons.RefreshCw size={16} />
                        Làm Mới
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Cảnh Báo Hoạt Động</div>
                    <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {activeAlerts.length}
                    </div>
                </div>
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Đã Xử Lý</div>
                    <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {resolvedAlerts.length}
                    </div>
                </div>
            </div>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        marginBottom: '16px',
                        color: '#dc2626'
                    }}>
                        Cảnh Báo Hoạt Động ({activeAlerts.length})
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ 
                                    background: 'var(--bg-tertiary, #f9fafb)',
                                    borderBottom: '2px solid var(--border-color, #e5e7eb)'
                                }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sản Phẩm</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Kho</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Tồn Kho</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Ngưỡng</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Mức Độ</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ngày Tạo</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeAlerts.map((alert) => {
                                    const product = products.find(p => p.id === alert.product_id);
                                    const warehouse = warehouses.find(w => w.id === alert.warehouse_id);
                                    const levelInfo = alertLevelColors[alert.alert_level] || alertLevelColors.warning;

                                    return (
                                        <tr 
                                            key={alert.id}
                                            style={{ 
                                                borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '12px' }}>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>
                                                        {product?.name || alert.product_id}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {alert.product_id}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {warehouse ? warehouse.name : (alert.warehouse_id ? alert.warehouse_id : 'Toàn hệ thống')}
                                            </td>
                                            <td style={{ 
                                                padding: '12px', 
                                                textAlign: 'right',
                                                fontWeight: '600',
                                                color: alert.current_quantity === 0 ? '#dc2626' : '#d97706'
                                            }}>
                                                {alert.current_quantity || 0}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                {alert.threshold || 0}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    background: levelInfo.bg,
                                                    color: levelInfo.color,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <levelInfo.icon size={14} />
                                                    {levelInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {new Date(alert.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {(isAdmin || isManager) && (
                                                    <button
                                                        onClick={() => handleResolve(alert.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        Xử Lý
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Resolved Alerts */}
            {showResolved && resolvedAlerts.length > 0 && (
                <div>
                    <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        marginBottom: '16px',
                        color: '#059669'
                    }}>
                        Đã Xử Lý ({resolvedAlerts.length})
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ 
                                    background: 'var(--bg-tertiary, #f9fafb)',
                                    borderBottom: '2px solid var(--border-color, #e5e7eb)'
                                }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sản Phẩm</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Kho</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Tồn Kho</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Ngưỡng</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ngày Xử Lý</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Người Xử Lý</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resolvedAlerts.map((alert) => {
                                    const product = products.find(p => p.id === alert.product_id);
                                    const warehouse = warehouses.find(w => w.id === alert.warehouse_id);

                                    return (
                                        <tr 
                                            key={alert.id}
                                            style={{ 
                                                borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                                opacity: 0.7
                                            }}
                                        >
                                            <td style={{ padding: '12px' }}>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>
                                                        {product?.name || alert.product_id}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                        {alert.product_id}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {warehouse ? warehouse.name : (alert.warehouse_id ? alert.warehouse_id : 'Toàn hệ thống')}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                {alert.current_quantity || 0}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                {alert.threshold || 0}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString('vi-VN') : '-'}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {alert.resolved_by || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {alerts.length === 0 && (
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#999',
                    fontSize: '16px'
                }}>
                    {showResolved ? 'Không có cảnh báo nào' : 'Không có cảnh báo hoạt động'}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, alertId: null })}
                    onConfirm={confirmResolve}
                    title="Xử Lý Cảnh Báo"
                    message="Bạn có chắc chắn muốn đánh dấu cảnh báo này là đã xử lý?"
                />
            )}
        </div>
    );
};

export default LowStockAlerts;

