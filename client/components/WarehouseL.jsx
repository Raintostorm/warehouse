import { useState, useEffect, useMemo } from 'react';
import { warehouseAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';
import ExportImportButtons from './ExportImportButtons';
import ConfirmationModal from '../src/components/ConfirmationModal';
import WarehouseView from './WarehouseView';
import UWarehouse from './UWarehouse';

const WarehouseL = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingId, setViewingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await warehouseAPI.getAllWarehouses();
            if (response.success) {
                setWarehouses(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch warehouses');
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
            const response = await warehouseAPI.deleteWarehouse(id);
            if (response.success) {
                fetchWarehouses();
                showSuccess('Warehouse deleted successfully!');
            } else {
                showError('Delete error: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Delete warehouse error: ' + (err.response?.data?.error || err.message));
        }
        setConfirmModal({ isOpen: false, id: null });
    };

    const filteredWarehouses = useMemo(() => {
        if (!searchTerm) return warehouses;
        const term = searchTerm.toLowerCase();
        return warehouses.filter(w => 
            w.id?.toLowerCase().includes(term) ||
            w.name?.toLowerCase().includes(term) ||
            w.address?.toLowerCase().includes(term) ||
            w.type?.toLowerCase().includes(term)
        );
    }, [warehouses, searchTerm]);

    const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);

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
                <p>Only admin users can manage warehouses.</p>
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
                        <Icons.Warehouse size={28} color="#475569" /> Warehouse Management
                    </h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Total: <strong>{filteredWarehouses.length}</strong> warehouses
                    </p>
                </div>
                <button
                    onClick={fetchWarehouses}
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
                    tableName="warehouses" 
                    tableLabel="Warehouses"
                    onImportSuccess={fetchWarehouses}
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
                        placeholder="Search by ID, name, address, type..."
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

            {filteredWarehouses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '16px', margin: 0 }}>
                        {searchTerm ? 'No results found' : 'No warehouses yet'}
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
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Warehouse Name</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Địa chỉ</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Kích thước</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Loại</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Ngày bắt đầu</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((warehouse) => (
                                    <tr
                                        key={warehouse.id}
                                        style={{
                                            borderBottom: '1px solid #e9ecef',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px', fontWeight: '500' }}>{warehouse.id}</td>
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px' }}>{warehouse.name}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{warehouse.address || <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{warehouse.size ? `${warehouse.size} m²` : <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{warehouse.type || <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{warehouse.started_date ? new Date(warehouse.started_date).toLocaleDateString('vi-VN') : <span style={{ color: '#999' }}>-</span>}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setViewingId(warehouse.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                                                    title="View warehouse inventory and images"
                                                >
                                                    <Icons.Search size={16} />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(warehouse.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                                        color: '#000',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    title="Edit warehouse properties"
                                                >
                                                    <Icons.Edit size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(warehouse.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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
                                                    <Icons.Delete size={16} />
                                                    Xóa
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
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa kho này?"
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
            />

            {viewingId && (
                <WarehouseView
                    warehouseId={viewingId}
                    onClose={() => setViewingId(null)}
                />
            )}

            {editingId && (
                <UWarehouse
                    warehouseId={editingId}
                    onWarehouseUpdated={() => {
                        fetchWarehouses();
                        setEditingId(null);
                    }}
                    onClose={() => setEditingId(null)}
                />
            )}
        </div>
    );
};

export default WarehouseL;

