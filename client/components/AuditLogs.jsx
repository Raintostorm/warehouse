import { useState, useEffect, useMemo } from 'react';
import { auditLogAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';

const AuditLogs = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters
    const [tableName, setTableName] = useState('');
    const [action, setAction] = useState('');
    const [actor, setActor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    useEffect(() => {
        if (isAdmin) {
            fetchLogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, tableName, action, actor, startDate, endDate, currentPage, itemsPerPage]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {
                tableName: tableName || undefined,
                action: action || undefined,
                actor: actor || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage
            };
            const response = await auditLogAPI.getAuditLogs(filters);
            if (response.success) {
                setLogs(response.data);
            } else {
                setError(response.message || 'Failed to load audit logs');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE':
                return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' };
            case 'UPDATE':
                return { bg: '#fef3c7', border: '#fde68a', text: '#92400e' };
            case 'DELETE':
                return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
            default:
                return { bg: '#f3f4f6', border: '#e5e7eb', text: '#374151' };
        }
    };

    const filteredLogs = useMemo(() => {
        return logs;
    }, [logs]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    if (!isAdmin) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#fee',
                border: '1px solid #64748b',
                borderRadius: '8px',
                margin: '20px',
                textAlign: 'center'
            }}>
                <h2 style={{ color: '#64748b' }}>Không có quyền truy cập</h2>
                <p>Chỉ có quyền admin mới có thể xem audit logs.</p>
            </div>
        );
    }

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
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Đang tải audit logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#fee',
                border: '1px solid #64748b',
                borderRadius: '8px',
                margin: '20px 0',
                textAlign: 'center'
            }}>
                <p style={{ color: '#64748b', margin: 0 }}>{error}</p>
                <button
                    onClick={fetchLogs}
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
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            margin: '20px 0',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '2px solid #e5e7eb'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                        }}>
                            <Icons.Security size={22} color="white" />
                        </div>
                        Audit Logs
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Lịch sử thay đổi hệ thống
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
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
                    <Icons.Refresh size={18} /> Làm mới
                </button>
            </div>

            {/* Filters */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Bảng
                    </label>
                    <select
                        value={tableName}
                        onChange={(e) => {
                            setTableName(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">Tất cả</option>
                        <option value="users">Users</option>
                        <option value="products">Products</option>
                        <option value="orders">Orders</option>
                        <option value="warehouses">Warehouses</option>
                        <option value="suppliers">Suppliers</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Hành động
                    </label>
                    <select
                        value={action}
                        onChange={(e) => {
                            setAction(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">Tất cả</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Người thực hiện
                    </label>
                    <input
                        type="text"
                        value={actor}
                        onChange={(e) => {
                            setActor(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Email hoặc ID"
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: 'white'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: 'white'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: 'white'
                        }}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div style={{
                overflowX: 'auto',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: 'white'
                }}>
                    <thead>
                        <tr style={{
                            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Thời gian</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Bảng</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Hành động</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Record ID</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Người thực hiện</th>
                            <th style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                fontWeight: '600',
                                color: '#374151',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: '#64748b',
                                    fontSize: '14px'
                                }}>
                                    Không có audit logs nào
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((log) => {
                                const actionColor = getActionColor(log.action);
                                return (
                                    <tr
                                        key={log.id}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f9fafb';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151' }}>
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151', fontWeight: '600' }}>
                                            {log.table_name}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: actionColor.bg,
                                                color: actionColor.text,
                                                border: `1px solid ${actionColor.border}`,
                                                display: 'inline-block'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>
                                            {log.record_id}
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#374151' }}>
                                            {log.actor || 'N/A'}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <button
                                                onClick={() => {
                                                    const details = {
                                                        'Changed Fields': log.changed_fields?.join(', ') || 'N/A',
                                                        'Old Data': log.old_data ? JSON.stringify(log.old_data, null, 2) : 'N/A',
                                                        'New Data': log.new_data ? JSON.stringify(log.new_data, null, 2) : 'N/A',
                                                        'IP Address': log.ip_address || 'N/A'
                                                    };
                                                    alert(Object.entries(details).map(([key, value]) => `${key}:\n${value}`).join('\n\n'));
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
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
    );
};

export default AuditLogs;

