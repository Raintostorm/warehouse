import { useState } from 'react';
import { productDetailAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { Icons } from '../src/utils/icons';

const CProductDetail = ({ onProductDetailCreated }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const [formData, setFormData] = useState({ pid: '', wid: '', number: '', note: '', updatedAt: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const response = await productDetailAPI.createProductDetail({
                ...formData,
                number: formData.number ? parseInt(formData.number) : null,
                updatedAt: formData.updatedAt || new Date().toISOString().split('T')[0]
            });
            if (response.success) {
                setSuccess(true);
                setFormData({ pid: '', wid: '', number: '', note: '', updatedAt: '' });
                if (onProductDetailCreated) onProductDetailCreated();
            } else {
                setError(response.message || 'Failed to create product detail');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to create product detail');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #dc3545', borderRadius: '8px', backgroundColor: '#fee', margin: '20px 0' }}><h2 style={{ color: '#dc3545' }}>Không có quyền</h2></div>;
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: '20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
                <Icons.Add size={28} color="#007bff" />
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333' }}>Tạo Chi tiết Sản phẩm</h2>
            </div>
            {error && <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33', fontSize: '14px' }}><strong>Lỗi:</strong> {error}</div>}
            {success && <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', color: '#155724', fontSize: '14px' }}><strong>Thành công!</strong> Đã tạo thành công.</div>}
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Mã SP <span style={{ color: '#dc3545' }}>*</span></label><input type="text" name="pid" value={formData.pid} onChange={handleChange} required placeholder="Nhập mã sản phẩm" style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Mã Kho <span style={{ color: '#dc3545' }}>*</span></label><input type="text" name="wid" value={formData.wid} onChange={handleChange} required placeholder="Nhập mã kho" style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Số lượng</label><input type="number" name="number" value={formData.number} onChange={handleChange} placeholder="Nhập số lượng" style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Ngày cập nhật</label><input type="date" name="updatedAt" value={formData.updatedAt} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Ghi chú</label><input type="text" name="note" value={formData.note} onChange={handleChange} placeholder="Nhập ghi chú" style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <button type="button" onClick={() => { setFormData({ pid: '', wid: '', number: '', note: '', updatedAt: '' }); setError(null); setSuccess(false); }} style={{ padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}><Icons.Refresh size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Đặt lại</button>
                    <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: loading ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? <><span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span> Đang tạo...</> : <><Icons.Success size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Tạo</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CProductDetail;

