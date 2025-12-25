import { useState, useEffect, useMemo } from 'react';
import { inventoryAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';

const StockHistory = ({ products, warehouses, onRefresh }) => {
    const { error: showError } = useToast();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        productId: '',
        warehouseId: '',
        transactionType: '',
        startDate: '',
        endDate: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        fetchHistory();
    }, [filters]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.productId) params.productId = filters.productId;
            if (filters.warehouseId) params.warehouseId = filters.warehouseId;
            if (filters.transactionType) params.transactionType = filters.transactionType;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await inventoryAPI.getStockHistory(params);
            if (response.success) {
                setHistory(response.data || []);
            } else {
                showError('Failed to fetch stock history: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching stock history: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const transactionTypeLabels = {
        'IN': { label: 'Nhập Kho', color: '#10b981' },
        'OUT': { label: 'Xuất Kho', color: '#ef4444' },
        'TRANSFER_IN': { label: 'Chuyển Đến', color: '#3b82f6' },
        'TRANSFER_OUT': { label: 'Chuyển Đi', color: '#f59e0b' },
        'ADJUSTMENT': { label: 'Điều Chỉnh', color: '#8b5cf6' }
    };

    const filteredHistory = useMemo(() => {
        return history;
    }, [history]);

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Icons.Loader className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: '12px', color: '#666' }}>Đang tải lịch sử...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px',
                marginBottom: '20px'
            }}>
                <select
                    value={filters.productId}
                    onChange={(e) => {
                        setFilters({ ...filters, productId: e.target.value });
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">Tất cả sản phẩm</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                </select>

                <select
                    value={filters.warehouseId}
                    onChange={(e) => {
                        setFilters({ ...filters, warehouseId: e.target.value });
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">Tất cả kho</option>
                    {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>

                <select
                    value={filters.transactionType}
                    onChange={(e) => {
                        setFilters({ ...filters, transactionType: e.target.value });
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">Tất cả loại</option>
                    {Object.keys(transactionTypeLabels).map(type => (
                        <option key={type} value={type}>{transactionTypeLabels[type].label}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => {
                        setFilters({ ...filters, startDate: e.target.value });
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                    placeholder="Từ ngày"
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                        setFilters({ ...filters, endDate: e.target.value });
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                    placeholder="Đến ngày"
                />
            </div>

            {/* Table */}
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
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Thời Gian</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sản Phẩm</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Kho</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Loại</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Số Lượng</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Trước</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Sau</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ghi Chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedHistory.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ 
                                    padding: '40px', 
                                    textAlign: 'center', 
                                    color: '#999' 
                                }}>
                                    Không có lịch sử
                                </td>
                            </tr>
                        ) : (
                            paginatedHistory.map((item, index) => {
                                const typeInfo = transactionTypeLabels[item.transaction_type] || { 
                                    label: item.transaction_type, 
                                    color: '#666' 
                                };
                                const product = products.find(p => p.id === item.product_id);
                                const warehouse = warehouses.find(w => w.id === item.warehouse_id);

                                return (
                                    <tr 
                                        key={item.id || index}
                                        style={{ 
                                            borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px' }}>
                                            {new Date(item.created_at).toLocaleString('vi-VN')}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {product?.name || item.product_id}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {item.product_id}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {warehouse ? warehouse.name : (item.warehouse_id ? item.warehouse_id : 'Toàn hệ thống')}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                background: `${typeInfo.color}20`,
                                                color: typeInfo.color
                                            }}>
                                                {typeInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ 
                                            padding: '12px', 
                                            textAlign: 'right',
                                            fontWeight: '500',
                                            color: item.quantity > 0 ? '#10b981' : '#ef4444'
                                        }}>
                                            {item.quantity > 0 ? '+' : ''}{item.quantity}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {item.previous_quantity || 0}
                                        </td>
                                        <td style={{ 
                                            padding: '12px', 
                                            textAlign: 'right',
                                            fontWeight: '500'
                                        }}>
                                            {item.new_quantity || 0}
                                        </td>
                                        <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>
                                            {item.notes || '-'}
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
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '20px',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredHistory.length)} / {filteredHistory.length}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid var(--border-color, #e5e7eb)',
                                borderRadius: '6px',
                                background: currentPage === 1 ? '#f3f4f6' : 'white',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Trước
                        </button>
                        <span style={{ 
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '14px'
                        }}>
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid var(--border-color, #e5e7eb)',
                                borderRadius: '6px',
                                background: currentPage === totalPages ? '#f3f4f6' : 'white',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockHistory;

