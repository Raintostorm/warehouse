import { useState, useEffect } from 'react';
import { productDetailAPI, warehouseAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import FileManager from './FileManager';
import Modal from '../src/components/Modal';

const WarehouseView = ({ warehouseId, onClose }) => {
    const { error: showError } = useToast();
    const [warehouse, setWarehouse] = useState(null);
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImages, setShowImages] = useState(false);

    useEffect(() => {
        if (warehouseId) {
            fetchWarehouseData();
        }
    }, [warehouseId]);

    const fetchWarehouseData = async () => {
        try {
            setLoading(true);
            
            // Fetch warehouse info
            const warehouseResponse = await warehouseAPI.getWarehouseById(warehouseId);
            if (warehouseResponse.success) {
                setWarehouse(warehouseResponse.data);
            }

            // Fetch stock in this warehouse
            const stockResponse = await productDetailAPI.getProductDetailsByWarehouseId(warehouseId);
            if (stockResponse.success) {
                setStockItems(stockResponse.data || []);
            }
        } catch (err) {
            showError('Failed to fetch warehouse data: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Modal isOpen={true} onClose={onClose} title="View Warehouse" size="large">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #475569',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#666', fontSize: '16px' }}>Loading...</p>
                </div>
            </Modal>
        );
    }

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={`View Warehouse - ${warehouse?.name || warehouseId}`} size="large">
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#334155' }}>
                        Warehouse Information
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>ID</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{warehouse?.id || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Name</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{warehouse?.name || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Address</div>
                            <div style={{ fontSize: '14px', color: '#334155' }}>{warehouse?.address || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Size</div>
                            <div style={{ fontSize: '14px', color: '#334155' }}>{warehouse?.size ? `${warehouse.size} m²` : '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Type</div>
                            <div style={{ fontSize: '14px', color: '#334155' }}>{warehouse?.type || '-'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#334155' }}>
                            Inventory ({stockItems.length} products)
                        </h3>
                        <button
                            onClick={() => setShowImages(true)}
                            style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Icons.File size={16} />
                            View Images
                        </button>
                    </div>

                    {stockItems.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            color: '#64748b'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                            <p style={{ fontSize: '16px', margin: 0 }}>No products in this warehouse</p>
                        </div>
                    ) : (
                        <div style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden'
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
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Product ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Product Name</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Quantity</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockItems.map((item, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                borderBottom: index < stockItems.length - 1 ? '1px solid #e9ecef' : 'none',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                                                {item.pid || item.product_id || '-'}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                                                {item.product_name || '-'}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                                {item.number || 0}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                                                {item.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>

            {showImages && (
                <Modal
                    isOpen={showImages}
                    onClose={() => setShowImages(false)}
                    title={`Warehouse Images - ${warehouse?.name || warehouseId}`}
                    size="large"
                >
                    <FileManager
                        entityType="warehouse"
                        entityId={warehouseId}
                        uploadType="warehouse_image"
                        onRefresh={fetchWarehouseData}
                        showImagesOnly={true}
                    />
                </Modal>
            )}
        </>
    );
};

export default WarehouseView;

