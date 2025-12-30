import { useState, useEffect } from 'react';
import { productAPI, productDetailAPI, warehouseAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import { BUTTON_COLORS } from '../src/utils/buttonColors';
import FileManager from './FileManager';
import Modal from '../src/components/Modal';

const ProductView = ({ productId, onClose }) => {
    const { error: showError } = useToast();
    const [product, setProduct] = useState(null);
    const [warehouseDistribution, setWarehouseDistribution] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImages, setShowImages] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchProductData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const fetchProductData = async () => {
        try {
            setLoading(true);
            
            // Fetch product info
            const productResponse = await productAPI.getProductById(productId);
            if (productResponse.success) {
                setProduct(productResponse.data);
            }

            // Fetch product details (warehouses + quantities)
            const detailsResponse = await productDetailAPI.getProductDetailsByProductId(productId);
            const productDetails = detailsResponse.success ? (detailsResponse.data || []) : [];

            // Fetch all warehouses (for names)
            const warehousesResponse = await warehouseAPI.getAllWarehouses();
            const warehouses = warehousesResponse.success ? (warehousesResponse.data || []) : [];

            // Create warehouse map for quick lookup
            const warehouseMap = warehouses.reduce((acc, w) => {
                acc[w.id || w.Id] = w.name || w.Name;
                return acc;
            }, {});

            // Merge productDetails with warehouse names
            const distribution = productDetails.map(pd => {
                const warehouseId = pd.wid || pd.warehouse_id || pd.warehouseId || pd.Wid;
                return {
                    warehouseId: warehouseId,
                    warehouseName: warehouseMap[warehouseId] || 'Unknown Warehouse',
                    quantity: pd.number || pd.Number || 0,
                    note: pd.note || pd.Note || null
                };
            });

            setWarehouseDistribution(distribution);
        } catch (err) {
            showError('Failed to fetch product data: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const totalQuantity = warehouseDistribution.reduce((sum, item) => sum + item.quantity, 0);

    if (loading) {
        return (
            <Modal isOpen={true} onClose={onClose} title="View Product" size="large">
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
            <Modal isOpen={true} onClose={onClose} title={`View Product - ${product?.name || productId}`} size="large">
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#334155' }}>
                        Product Information
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
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{product?.id || product?.Id || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Name</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{product?.name || product?.Name || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Type</div>
                            <div style={{ fontSize: '14px', color: '#334155' }}>{product?.type || product?.Type || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Unit</div>
                            <div style={{ fontSize: '14px', color: '#334155' }}>{product?.unit || product?.Unit || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Price</div>
                            <div style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                                {product?.price || product?.Price 
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || product.Price)
                                    : '-'
                                }
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Supplier ID</div>
                            <div style={{ fontSize: '14px', color: '#334155' }}>{product?.supplier_id || product?.supplierId || product?.SupplierId || '-'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#334155' }}>
                            Warehouse Distribution ({warehouseDistribution.length} {warehouseDistribution.length === 1 ? 'warehouse' : 'warehouses'})
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{
                                padding: '8px 16px',
                                backgroundColor: '#e0f2fe',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#0369a1'
                            }}>
                                Total: {totalQuantity.toLocaleString()}
                            </div>
                            <button
                                onClick={() => setShowImages(true)}
                                style={{
                                    padding: '8px 16px',
                                    background: BUTTON_COLORS.images,
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
                    </div>

                    {warehouseDistribution.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            color: '#64748b'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                            <p style={{ fontSize: '16px', margin: 0 }}>This product is not in any warehouse</p>
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
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Warehouse ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Warehouse Name</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Quantity</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouseDistribution.map((item, index) => (
                                        <tr
                                            key={item.warehouseId || index}
                                            style={{
                                                borderBottom: index < warehouseDistribution.length - 1 ? '1px solid #e9ecef' : 'none',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                                                {item.warehouseId || '-'}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                                                {item.warehouseName}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                                {item.quantity.toLocaleString()}
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
                    title={`Product Images - ${product?.name || productId}`}
                    size="large"
                >
                    <FileManager
                        entityType="product"
                        entityId={productId}
                        uploadType="product_image"
                        onRefresh={fetchProductData}
                        showImagesOnly={true}
                    />
                </Modal>
            )}
        </>
    );
};

export default ProductView;

