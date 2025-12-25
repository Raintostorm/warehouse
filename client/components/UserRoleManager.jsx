import { useState, useEffect } from 'react';
import { userRoleAPI, roleAPI } from '../services/api';
import Modal from '../src/components/Modal';
import ModernButton from '../src/components/ModernButton';
import ConfirmationModal from '../src/components/ConfirmationModal';
import { useTheme } from '../src/contexts/ThemeContext';
import { Icons } from '../src/utils/icons';

const UserRoleManager = ({ userId, userName, isOpen, onClose }) => {
    const [userRoles, setUserRoles] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [removeConfirm, setRemoveConfirm] = useState({ isOpen: false, roleId: null, roleName: '' });
    const { isDark } = useTheme();

    // Load dữ liệu khi component mount hoặc userId thay đổi
    useEffect(() => {
        if (userId) {
            loadUserRoles();
            loadAllRoles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Load roles của user
    const loadUserRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userRoleAPI.getUserRoles(userId);

            if (response.success) {
                setUserRoles(response.data);
            } else {
                setError(response.message || 'Failed to load user roles');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to load user roles');
            console.error('Error loading user roles:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load tất cả roles có sẵn
    const loadAllRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await roleAPI.getAllRoles();

            if (response.success) {
                setAllRoles(response.data);
            }
        } catch (err) {
            console.error('Error loading roles:', err);
        } finally {
            setLoadingRoles(false);
        }
    };

    // Gán role cho user
    const handleAssignRole = async (e) => {
        e.preventDefault();

        if (!selectedRoleId) {
            alert('Please select a role');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            const response = await userRoleAPI.assignRoleToUser(userId, selectedRoleId);

            if (response.success) {
                setSuccess(true);
                setSelectedRoleId('');
                await loadUserRoles(); // Refresh danh sách
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.message || 'Failed to assign role');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to assign role';
            setError(errorMsg);
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Xóa role của user
    const handleRemoveRoleClick = (roleId, roleName) => {
        setRemoveConfirm({ isOpen: true, roleId, roleName });
    };

    const confirmRemoveRole = async () => {
        const { roleId } = removeConfirm;
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            const response = await userRoleAPI.removeRoleFromUser(userId, roleId);

            if (response.success) {
                setSuccess(true);
                await loadUserRoles();
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.message || 'Failed to remove role');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to remove role';
            setError(errorMsg);
        } finally {
            setLoading(false);
            setRemoveConfirm({ isOpen: false, roleId: null, roleName: '' });
        }
    };

    // Lấy danh sách roles chưa được gán cho user
    const getAvailableRoles = () => {
        const assignedRoleIds = userRoles.map(ur => ur.role_id);
        return allRoles.filter(role => !assignedRoleIds.includes(role.id));
    };

    if (!userId) return null;

    const textColor = isDark ? '#f1f5f9' : '#1f2937';
    const textSecondary = isDark ? '#cbd5e1' : '#6b7280';
    const cardBg = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Manage Roles - ${userName || userId}`}
                size="large"
            >
                {/* Success message */}
                {success && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                        color: isDark ? '#6ee7b7' : '#065f46',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Success size={18} /> Operation successful!
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                        color: isDark ? '#fca5a5' : '#991b1b',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Warning size={18} /> {error}
                    </div>
                )}

                {/* Form để gán role mới */}
                <div style={{
                    marginBottom: '24px',
                    padding: '20px',
                    background: cardBg,
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: `1px solid ${borderColor}`
                }}>
                    <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Icons.Add size={20} /> Assign New Role
                    </h3>
                    <form onSubmit={handleAssignRole}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '600',
                                color: textColor,
                                fontSize: '14px'
                            }}>
                                Select Role:
                            </label>
                            <select
                                value={selectedRoleId}
                                onChange={(e) => setSelectedRoleId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '15px',
                                    border: `2px solid ${borderColor}`,
                                    borderRadius: '12px',
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    color: textColor,
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    cursor: loading || loadingRoles ? 'not-allowed' : 'pointer'
                                }}
                                disabled={loading || loadingRoles}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#475569';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(71, 85, 105, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = borderColor;
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <option value="">-- Select a role --</option>
                                {getAvailableRoles().map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name} ({role.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <ModernButton
                            type="submit"
                            variant="primary"
                            disabled={loading || !selectedRoleId || loadingRoles}
                            loading={loading}
                            icon={<Icons.Add size={18} />}
                            iconPosition="left"
                        >
                            Assign Role
                        </ModernButton>
                    </form>
                </div>

                {/* Danh sách roles hiện tại của user */}
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '600',
                            color: textColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Icons.Security size={20} /> Current Roles
                        </h3>
                        <ModernButton
                            variant="ghost"
                            size="sm"
                            onClick={loadUserRoles}
                            disabled={loading}
                            loading={loading}
                            icon={<Icons.Refresh size={16} />}
                        >
                            Refresh
                        </ModernButton>
                    </div>

                    {loading && userRoles.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: textSecondary
                        }}>
                            <Icons.Loading size={32} /> Loading roles...
                        </div>
                    ) : userRoles.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: textSecondary,
                            background: cardBg,
                            borderRadius: '12px',
                            border: `1px dashed ${borderColor}`
                        }}>
                            <Icons.Warning size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ margin: 0 }}>No roles assigned to this user</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gap: '12px',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
                        }}>
                            {userRoles.map((userRole) => (
                                <div
                                    key={userRole.role_id}
                                    style={{
                                        padding: '16px',
                                        background: cardBg,
                                        borderRadius: '12px',
                                        border: `1px solid ${borderColor}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = isDark
                                            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            fontWeight: '600',
                                            color: textColor,
                                            marginBottom: '4px'
                                        }}>
                                            {userRole.role_name}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: textSecondary
                                        }}>
                                            {userRole.role_id}
                                        </div>
                                    </div>
                                    <ModernButton
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveRoleClick(userRole.role_id, userRole.role_name)}
                                        disabled={loading}
                                        icon={<Icons.Delete size={14} />}
                                    >
                                        Remove
                                    </ModernButton>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={removeConfirm.isOpen}
                onClose={() => setRemoveConfirm({ isOpen: false, roleId: null, roleName: '' })}
                onConfirm={confirmRemoveRole}
                title="Remove Role"
                message={`Are you sure you want to remove role "${removeConfirm.roleName}" from this user?`}
                confirmText="Remove"
                cancelText="Cancel"
                type="danger"
            />
        </>
    );
};

export default UserRoleManager;

