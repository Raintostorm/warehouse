import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../hooks/useRole';
import { Icons } from '../utils/icons';

/**
 * Sidebar Component - Vertical navigation sidebar
 * Single Responsibility: Handle navigation UI and state
 */
const Sidebar = ({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse }) => {
    const { isDark } = useTheme();
    const { getUserRoles } = useRole();
    const userRoles = getUserRoles();
    const isAdmin = userRoles.some(role => role.toLowerCase() === 'admin');

    const sidebarBg = isDark
        ? 'rgba(30, 41, 59, 0.98)'
        : 'rgba(255, 255, 255, 0.98)';
    const textColor = isDark ? '#cbd5e1' : '#64748b';
    const activeBg = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
    const hoverBg = isDark ? '#334155' : '#f1f5f9';
    const borderColor = isDark ? '#334155' : '#e5e7eb';

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Icons.Chart },
        { id: 'users', label: 'Users', icon: Icons.Users },
        { id: 'warehouses', label: 'Warehouses', icon: Icons.Warehouse },
        { id: 'orders', label: 'Orders', icon: Icons.Order },
        { id: 'products', label: 'Products', icon: Icons.Product },
        { id: 'suppliers', label: 'Suppliers', icon: Icons.Supplier },
        { id: 'video-call', label: 'Video Call', icon: Icons.Users },
        ...(isAdmin ? [{ id: 'admin-notifications', label: 'Send Notification', icon: Icons.File }] : []),
        { id: 'audit-logs', label: 'Audit Logs', icon: Icons.File },
        { id: 'reports', label: 'Reports', icon: Icons.Chart },
        { id: 'settings', label: 'Settings', icon: Icons.Settings },
    ];

    return (
        <aside
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: isCollapsed ? '80px' : '280px',
                background: sidebarBg,
                backdropFilter: 'blur(20px)',
                borderRight: `1px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isDark
                    ? '4px 0 24px -4px rgba(0, 0, 0, 0.5)'
                    : '4px 0 24px -4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}
        >
            {/* Logo/Brand Section */}
            <div style={{
                padding: '24px',
                borderBottom: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '80px'
            }}>
                {!isCollapsed && (
                    <h1 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        whiteSpace: 'nowrap',
                        transition: 'opacity 0.3s ease'
                    }}>
                        MyWarehouse
                    </h1>
                )}
                {isCollapsed && (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto'
                    }}>
                        <Icons.Warehouse size={24} color="white" />
                    </div>
                )}
            </div>

            {/* Navigation Items */}
            <nav style={{
                flex: 1,
                padding: '16px 12px',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            style={{
                                width: '100%',
                                padding: isCollapsed ? '14px' : '14px 20px',
                                marginBottom: '8px',
                                background: isActive ? activeBg : 'transparent',
                                color: isActive ? 'white' : textColor,
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: isActive ? '600' : '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isCollapsed ? '0' : '12px',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                whiteSpace: 'nowrap',
                                boxShadow: isActive
                                    ? '0 4px 12px rgba(71, 85, 105, 0.3)'
                                    : 'none',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = hoverBg;
                                    e.currentTarget.style.color = isDark ? '#f1f5f9' : '#334155';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = textColor;
                                }
                            }}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon size={22} />
                            {!isCollapsed && (
                                <span style={{
                                    opacity: isCollapsed ? 0 : 1,
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    {item.label}
                                </span>
                            )}
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '4px',
                                    height: '60%',
                                    background: 'white',
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                                }} />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse Toggle Button */}
            <div style={{
                padding: '16px',
                borderTop: `1px solid ${borderColor}`
            }}>
                <button
                    onClick={onToggleCollapse}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'transparent',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '10px',
                        color: textColor,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = hoverBg;
                        e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = borderColor;
                    }}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <Icons.Add size={20} style={{ transform: 'rotate(0deg)' }} />
                    ) : (
                        <>
                            <Icons.Close size={18} />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

