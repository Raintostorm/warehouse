import { useState, useEffect, useMemo } from 'react';
import { productDetailAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { Icons } from '../src/utils/icons';
import Pagination from '../src/components/Pagination';

const ProductDetailL = () => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const [productDetails, setProductDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProductDetails();
    }, []);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await productDetailAPI.getAllProductDetails();
            if (response.success) {
                setProductDetails(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch product details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pid, wid) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chi tiết sản phẩm này?')) return;
        try {
            const response = await productDetailAPI.deleteProductDetail(pid, wid);
            if (response.success) {
                fetchProductDetails();
                alert('Xóa thành công!');
            }
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.error || err.message));
        }
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return productDetails;
        const term = searchTerm.toLowerCase();
        return productDetails.filter(pd => 
            pd.pid?.toLowerCase().includes(term) ||
            pd.wid?.toLowerCase().includes(term) ||
            pd.note?.toLowerCase().includes(term)
        );
    }, [productDetails, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33', margin: '20px 0' }}><strong>Lỗi:</strong> {error}</div>;
    }

    if (!isAdmin) {
        return <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #dc3545', borderRadius: '8px', backgroundColor: '#fee', margin: '20px' }}><h2 style={{ color: '#dc3545' }}>Không có quyền truy cập</h2></div>;
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icons.Order size={28} color="#007bff" /> Chi tiết Sản phẩm
                </h1>
                <button onClick={fetchProductDetails} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Refresh size={18} /> Làm mới
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1', minWidth: '250px' }}>
                    <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                </div>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}>
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                </select>
            </div>

            {filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                    <p style={{ fontSize: '16px', margin: 0 }}>{searchTerm ? 'Không tìm thấy kết quả nào' : 'Chưa có dữ liệu'}</p>
                </div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Mã SP</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Mã Kho</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Số lượng</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Ghi chú</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Cập nhật</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((pd) => (
                                    <tr key={`${pd.pid}-${pd.wid}`} style={{ borderBottom: '1px solid #e9ecef', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px', fontWeight: '500' }}>{pd.pid}</td>
                                        <td style={{ padding: '14px 16px', color: '#333', fontSize: '14px', fontWeight: '500' }}>{pd.wid}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{pd.number ?? '-'}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{pd.note || '-'}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{pd.updated_at ? new Date(pd.updated_at).toLocaleDateString('vi-VN') : '-'}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleDelete(pd.pid, pd.wid)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                                                    <Icons.Delete size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </>
            )}
        </div>
    );
};

export default ProductDetailL;

