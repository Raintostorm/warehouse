import { useState } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import Modal from '../src/components/Modal';

const ChangePassword = () => {
    const { success: showSuccess, error: showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.newPassword.length < 6) {
            showError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            showError('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        setLoading(true);

        try {
            const response = await userAPI.changePassword(
                formData.oldPassword,
                formData.newPassword
            );
            if (response.success) {
                showSuccess('Đổi mật khẩu thành công!');
                setFormData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setIsModalOpen(false);
            } else {
                showError(response.message || 'Không thể đổi mật khẩu');
            }
        } catch (err) {
            showError(err.response?.data?.error || err.message || 'Không thể đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setFormData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    return (
        <>
            <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                margin: '20px 0',
                border: '1px solid rgba(255, 255, 255, 0.18)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '28px',
                    paddingBottom: '20px',
                    borderBottom: '2px solid #f3f4f6'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                        }}>
                            <Icons.Password size={32} color="white" />
                        </div>
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '26px',
                                fontWeight: '700',
                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                Đổi mật khẩu
                            </h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                            </p>
                        </div>
                    </div>
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
                        <Icons.Edit size={18} /> Đổi mật khẩu
                    </button>
                </div>

                <div style={{
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#64748b',
                        lineHeight: '1.6'
                    }}>
                        Để đảm bảo an toàn, vui lòng sử dụng mật khẩu mạnh có ít nhất 6 ký tự và kết hợp chữ cái, số.
                    </p>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title="Đổi mật khẩu"
                size="small"
            >
                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
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
                                Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.old ? 'text' : 'password'}
                                    name="oldPassword"
                                    value={formData.oldPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập mật khẩu hiện tại"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        paddingRight: '48px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#475569'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        color: '#64748b'
                                    }}
                                >
                                    {showPasswords.old ? <Icons.Close size={18} /> : <Icons.Password size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        paddingRight: '48px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#475569'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        color: '#64748b'
                                    }}
                                >
                                    {showPasswords.new ? <Icons.Close size={18} /> : <Icons.Password size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: '#334155',
                                fontSize: '14px'
                            }}>
                                Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập lại mật khẩu mới"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        paddingRight: '48px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#475569'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        color: '#64748b'
                                    }}
                                >
                                    {showPasswords.confirm ? <Icons.Close size={18} /> : <Icons.Password size={18} />}
                                </button>
                            </div>
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
                                    <Icons.Loading size={16} /> Đang đổi...
                                </>
                            ) : (
                                <>
                                    <Icons.Success size={16} /> Đổi mật khẩu
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default ChangePassword;

