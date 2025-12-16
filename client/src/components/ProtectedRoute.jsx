import { useAuth } from '../contexts/useAuth';
import { useRole } from '../hooks/useRole';

/**
 * Component để bảo vệ routes theo role
 * @param {ReactNode} children - Component con cần được bảo vệ
 * @param {string|string[]} allowedRoles - Role hoặc mảng roles được phép truy cập
 * @param {ReactNode} fallback - Component hiển thị khi không có quyền (optional)
 */
const ProtectedRoute = ({ children, allowedRoles, fallback = null }) => {
    const { isAuthenticated, loading } = useAuth();
    const { hasAnyRole } = useRole();

    // Đang loading
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>Đang tải...</p>
            </div>
        );
    }

    // Chưa đăng nhập
    if (!isAuthenticated()) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '50px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                margin: '20px'
            }}>
                <h3>Yêu cầu đăng nhập</h3>
                <p>Bạn cần đăng nhập để truy cập trang này.</p>
            </div>
        );
    }

    // Kiểm tra role nếu có allowedRoles
    if (allowedRoles) {
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!hasAnyRole(rolesArray)) {
            return fallback || (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '50px',
                    border: '1px solid #dc3545',
                    borderRadius: '8px',
                    margin: '20px',
                    backgroundColor: '#fee'
                }}>
                    <h3 style={{ color: '#dc3545' }}>Không có quyền truy cập</h3>
                    <p>Bạn không có quyền truy cập trang này.</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Yêu cầu role: {rolesArray.join(', ')}
                    </p>
                </div>
            );
        }
    }

    // Có quyền, hiển thị children
    return children;
};

export default ProtectedRoute;

