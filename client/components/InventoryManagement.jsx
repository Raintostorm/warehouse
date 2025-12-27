import { useState, useEffect } from 'react';
import { inventoryAPI, productAPI, warehouseAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import StockHistory from './StockHistory';
import StockTransfers from './StockTransfers';
import LowStockAlerts from './LowStockAlerts';
import StockAdjustmentModal from './StockAdjustmentModal';
import StockTransferModal from './StockTransferModal';

const InventoryManagement = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    const { error: showError } = useToast();
    
    const [activeTab, setActiveTab] = useState('summary');
    const [stockSummary, setStockSummary] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adjustmentModal, setAdjustmentModal] = useState({ isOpen: false, productId: null, warehouseId: null });
    const [transferModal, setTransferModal] = useState({ isOpen: false });

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch products and warehouses in parallel
            const [productsRes, warehousesRes] = await Promise.all([
                productAPI.getAllProducts(),
                warehouseAPI.getAllWarehouses()
            ]);

            if (productsRes.success) {
                setProducts(productsRes.data || []);
            }
            if (warehousesRes.success) {
                setWarehouses(warehousesRes.data || []);
            }

            // Fetch stock summary for all products
            await fetchStockSummary();
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch data');
            showError('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStockSummary = async () => {
        try {
            const summary = [];
            const productsRes = await productAPI.getAllProducts();
            if (productsRes.success && productsRes.data) {
                for (const product of productsRes.data) {
                    try {
                        const stockRes = await inventoryAPI.getStockSummary(product.id);
                        if (stockRes.success && stockRes.data) {
                            summary.push({
                                ...stockRes.data,
                                productName: product.name,
                                productType: product.type
                            });
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch stock for product ${product.id}:`, err);
                    }
                }
            }
            setStockSummary(summary);
        } catch (err) {
            console.error('Failed to fetch stock summary:', err);
        }
    };

    const handleAdjustStock = (productId, warehouseId = null) => {
        setAdjustmentModal({ isOpen: true, productId, warehouseId });
    };

    const handleCreateTransfer = () => {
        setTransferModal({ isOpen: true });
    };

    const handleAdjustmentClose = () => {
        setAdjustmentModal({ isOpen: false, productId: null, warehouseId: null });
        fetchStockSummary();
    };

    const handleTransferClose = () => {
        setTransferModal({ isOpen: false });
    };

    const tabs = [
        { id: 'summary', label: 'Tổng Quan Kho', icon: Icons.Package },
        { id: 'history', label: 'Lịch Sử', icon: Icons.Clock },
        { id: 'transfers', label: 'Chuyển Kho', icon: Icons.ArrowRightLeft },
        { id: 'alerts', label: 'Cảnh Báo', icon: Icons.AlertTriangle }
    ];

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
                fontSize: '16px',
                color: '#666'
            }}>
                <Icons.Loader className="animate-spin" style={{ marginRight: '10px' }} />
                Đang tải dữ liệu...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px', 
                background: '#fee', 
                color: '#c33', 
                borderRadius: '8px',
                margin: '20px'
            }}>
                <strong>Lỗi:</strong> {error}
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <h1 style={{ 
                    fontSize: '28px', 
                    fontWeight: '600', 
                    margin: 0,
                    color: 'var(--text-primary, #1a1a1a)'
                }}>
                    Quản Lý Kho Hàng
                </h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {(isAdmin || isManager) && (
                        <>
                            <button
                                onClick={handleCreateTransfer}
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
                                    gap: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Icons.ArrowRightLeft size={18} />
                                Chuyển Kho
                            </button>
                            <button
                                onClick={fetchStockSummary}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Icons.RefreshCw size={18} />
                                Làm Mới
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '24px',
                borderBottom: '2px solid var(--border-color, #e5e7eb)',
                flexWrap: 'wrap'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === tab.id 
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                                : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary, #666)',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.id ? '600' : '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            marginBottom: '-2px'
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ 
                background: 'var(--bg-secondary, #fff)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {activeTab === 'summary' && (
                    <StockSummaryView 
                        stockSummary={stockSummary}
                        warehouses={warehouses}
                        onAdjustStock={handleAdjustStock}
                        isAdmin={isAdmin}
                        isManager={isManager}
                    />
                )}
                {activeTab === 'history' && (
                    <StockHistory 
                        products={products}
                        warehouses={warehouses}
                        onRefresh={fetchStockSummary}
                    />
                )}
                {activeTab === 'transfers' && (
                    <StockTransfers 
                        products={products}
                        warehouses={warehouses}
                        onRefresh={fetchStockSummary}
                    />
                )}
                {activeTab === 'alerts' && (
                    <LowStockAlerts 
                        products={products}
                        warehouses={warehouses}
                        onRefresh={fetchStockSummary}
                    />
                )}
            </div>

            {/* Modals */}
            {adjustmentModal.isOpen && (
                <StockAdjustmentModal
                    isOpen={adjustmentModal.isOpen}
                    onClose={handleAdjustmentClose}
                    productId={adjustmentModal.productId}
                    warehouseId={adjustmentModal.warehouseId}
                    products={products}
                    warehouses={warehouses}
                />
            )}

            {transferModal.isOpen && (
                <StockTransferModal
                    isOpen={transferModal.isOpen}
                    onClose={handleTransferClose}
                    products={products}
                    warehouses={warehouses}
                />
            )}
        </div>
    );
};

// Stock Summary View Component
const StockSummaryView = ({ stockSummary, warehouses, onAdjustStock, isAdmin, isManager }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterWarehouse, setFilterWarehouse] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const filteredSummary = stockSummary.filter(item => {
        const matchesSearch = !searchTerm || 
            item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.productId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesWarehouse = !filterWarehouse || item.warehouseId === filterWarehouse;
        return matchesSearch && matchesWarehouse;
    });

    const totalPages = Math.ceil(filteredSummary.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSummary = filteredSummary.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            {/* Filters */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        flex: '1',
                        minWidth: '200px'
                    }}
                />
                <select
                    value={filterWarehouse}
                    onChange={(e) => {
                        setFilterWarehouse(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        padding: '10px 16px',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        minWidth: '200px'
                    }}
                >
                    <option value="">Tất cả kho</option>
                    {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                </select>
            </div>

            {/* Summary Stats */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Tổng Sản Phẩm</div>
                    <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {new Set(stockSummary.map(s => s.productId)).size}
                    </div>
                </div>
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Tổng Tồn Kho</div>
                    <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {stockSummary.reduce((sum, s) => sum + (s.totalStock || 0), 0).toLocaleString()}
                    </div>
                </div>
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Giá Trị Tồn Kho</div>
                    <div style={{ fontSize: '28px', fontWeight: '600' }}>
                        {stockSummary.reduce((sum, s) => sum + (s.totalValue || 0), 0).toLocaleString('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                        })}
                    </div>
                </div>
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
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Sản Phẩm</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Kho</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Tồn Kho</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Giá Trị</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSummary.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ 
                                    padding: '40px', 
                                    textAlign: 'center', 
                                    color: '#999' 
                                }}>
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            paginatedSummary.map((item, index) => (
                                <tr 
                                    key={`${item.productId}-${item.warehouseId || 'global'}-${index}`}
                                    style={{ 
                                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{item.productName || item.productId}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{item.productId}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {item.warehouseId 
                                            ? warehouses.find(w => w.id === item.warehouseId)?.name || item.warehouseId
                                            : <span style={{ color: '#999', fontStyle: 'italic' }}>Toàn hệ thống</span>
                                        }
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                                        {(item.totalStock || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                                        {(item.totalValue || 0).toLocaleString('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        })}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {(isAdmin || isManager) && (
                                            <button
                                                onClick={() => onAdjustStock(item.productId, item.warehouseId)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Điều Chỉnh
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
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
                        Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSummary.length)} / {filteredSummary.length}
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

export default InventoryManagement;

