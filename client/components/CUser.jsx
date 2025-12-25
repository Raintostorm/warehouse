import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useRole } from '../src/hooks/useRole';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

const CUser = ({ onUserCreated }) => {
    const { hasRole } = useRole();
    const isAdmin = hasRole('admin');
    const { success: showSuccess, error: showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        fullname: '',
        email: '',
        number: '',
        address: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [generatedId, setGeneratedId] = useState('');

    // Generate user ID when modal opens
    useEffect(() => {
        if (isModalOpen) {
            // Generate a temporary ID for display (backend will generate the actual one)
            const timestamp = Date.now().toString().slice(-6);
            setGeneratedId(`U${timestamp}`);
        }
    }, [isModalOpen]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Don't send ID - let backend generate it automatically
            const { id, ...userDataWithoutId } = formData;
            const response = await userAPI.createUser(userDataWithoutId);

            if (response.success) {
                showSuccess('User created successfully!');
                setFormData({
                    id: '',
                    fullname: '',
                    email: '',
                    number: '',
                    address: '',
                    password: ''
                });
                setGeneratedId('');
                setIsModalOpen(false);
                if (onUserCreated) {
                    onUserCreated();
                }
            } else {
                showError(response.message || 'Failed to create user');
            }
        } catch (err) {
            showError(err.response?.data?.error || err.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setFormData({
            id: '',
            fullname: '',
            email: '',
            number: '',
            address: '',
            password: ''
        });
        setGeneratedId('');
    };

    if (!isAdmin) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)',
                    transition: 'all 0.3s'
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
                <Icons.Add size={20} /> Create New User
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title="Create New User"
                size="medium"
            >
                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                User ID (Auto-generated)
                            </label>
                            <input
                                type="text"
                                value={generatedId || 'Will be generated automatically'}
                                disabled
                                readOnly
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'not-allowed',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <small style={{
                                display: 'block',
                                marginTop: '4px',
                                color: '#64748b',
                                fontSize: '12px'
                            }}>
                                User ID will be automatically generated when you create the user
                            </small>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Full Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                                required
                                placeholder="Enter full name"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Email <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="example@email.com"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Phone Number
                            </label>
                            <input
                                type="text"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                placeholder="0123456789"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter address"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#475569'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: '12px 24px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                            onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                background: loading 
                                    ? '#94a3b8' 
                                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Icons.Loading size={16} /> Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Icons.Success size={16} /> Tạo Người dùng
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default CUser;
