import { useState } from 'react';
import { authAPI } from '../../services/api';
import { Icons } from '../utils/icons';
import Modal from './Modal';
import ModernInput from './ModernInput';
import ModernButton from './ModernButton';

/**
 * ForgotPasswordModal Component - Single Responsibility: Handle forgot password flow
 * Open/Closed: Can be extended with additional validation or features
 */
const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        try {
            const data = await authAPI.forgotPassword(email);
            if (data.success) {
                setInfo('Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư Gmail.');
                setEmail('');
                if (onSuccess) {
                    onSuccess();
                }
                // Auto close after 3 seconds
                setTimeout(() => {
                    handleClose();
                }, 3000);
            } else {
                setError(data.error || 'Không thể gửi email đặt lại mật khẩu');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err.response?.data?.error || err.message || 'Không thể gửi email đặt lại mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setError('');
        setInfo('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Quên Mật Khẩu"
            size="small"
        >
            <form onSubmit={handleSubmit}>
                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: '16px 20px',
                        marginBottom: '24px',
                        backgroundColor: '#fef2f2',
                        border: '2px solid #fecaca',
                        borderRadius: '16px',
                        color: '#dc2626',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        animation: 'slideIn 0.3s ease-out',
                        boxShadow: '0 4px 12px -4px rgba(220, 38, 38, 0.2)'
                    }}>
                        <Icons.Warning size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ lineHeight: '1.5' }}>{error}</span>
                    </div>
                )}

                {/* Info Message */}
                {info && (
                    <div style={{
                        padding: '16px 20px',
                        marginBottom: '24px',
                        backgroundColor: '#ecfdf5',
                        border: '2px solid #bbf7d0',
                        borderRadius: '16px',
                        color: '#166534',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        animation: 'slideIn 0.3s ease-out',
                        boxShadow: '0 4px 12px -4px rgba(22, 101, 52, 0.2)'
                    }}>
                        <Icons.Info size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ lineHeight: '1.5' }}>{info}</span>
                    </div>
                )}

                <ModernInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                    autoComplete="email"
                    icon={<Icons.Email size={20} />}
                    error={error && error.includes('email') ? error : null}
                />

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: '24px'
                }}>
                    <ModernButton
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                    >
                        Hủy
                    </ModernButton>
                    <ModernButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        icon={<Icons.Email size={20} />}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi Link Đặt Lại'}
                    </ModernButton>
                </div>
            </form>
        </Modal>
    );
};

export default ForgotPasswordModal;

