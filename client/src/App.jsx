import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from './contexts/useAuth';
import { useRole } from './hooks/useRole';
import { Icons } from './utils/icons';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationBell from '../components/NotificationBell';
import Login from '../components/Login';
import ResetPassword from '../components/ResetPassword';
import ThemeToggle from './components/ThemeToggle';
import Sidebar from './components/Sidebar';
import { useTheme } from './contexts/ThemeContext';
import './App.css';

// Lazy load heavy components for better performance
const UserL = lazy(() => import('../components/UserL'));
const CUser = lazy(() => import('../components/CUser'));
const WarehouseL = lazy(() => import('../components/WarehouseL'));
const CWarehouse = lazy(() => import('../components/CWarehouse'));
const OrderL = lazy(() => import('../components/OrderL'));
const COrder = lazy(() => import('../components/COrder'));
const Payments = lazy(() => import('../components/Payments'));
const PaymentCallback = lazy(() => import('../components/PaymentCallback'));
const ProductL = lazy(() => import('../components/ProductL'));
const CProduct = lazy(() => import('../components/CProduct'));
const SupplierL = lazy(() => import('../components/SupplierL'));
const CSupplier = lazy(() => import('../components/CSupplier'));
const Dashboard = lazy(() => import('../components/Dashboard'));
const AuditLogs = lazy(() => import('../components/AuditLogs'));
const Reports = lazy(() => import('../components/Reports'));
const Settings = lazy(() => import('../components/Settings'));
const VideoCallList = lazy(() => import('./components/VideoCallList'));
const AdminNotificationPanel = lazy(() => import('./components/AdminNotificationPanel'));
const AIChat = lazy(() => import('./components/AIChat'));
const CustomChatbot = lazy(() => import('./components/CustomChatbot'));

function App() {
  const { isAuthenticated, user, logout, loading, token } = useAuth();
  const { getUserRoles } = useRole();
  const { isDark } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [videoCallFromLink, setVideoCallFromLink] = useState(null);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Close mobile sidebar when switching to desktop
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle tab change - close mobile sidebar
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const userRoles = getUserRoles();

  // Use isAuthenticated function for proper authentication check
  const authenticated = isAuthenticated();

  // Also check localStorage as fallback (for immediate check after login)
  // This ensures we catch authentication state even if React state hasn't updated yet
  const [authState, setAuthState] = useState(() => {
    try {
      const hasToken = !!localStorage.getItem('token');
      const hasUser = !!localStorage.getItem('user');
      return hasToken && hasUser;
    } catch (_e) {
      return false;
    }
  });

  // Force re-render when authentication state changes
  useEffect(() => {
    // Check both state and localStorage
    const hasToken = !!(token || localStorage.getItem('token'));
    const hasUser = !!(user || localStorage.getItem('user'));
    const isAuth = hasToken && hasUser;

    if (isAuth !== authState) {
      setAuthState(isAuth);
    }
  }, [token, user, authenticated, authState]);

  // Use the most up-to-date authentication state
  // Prioritize function result, but fallback to localStorage check
  // Also check localStorage directly as final fallback
  const tokenInStorage = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userInStorage = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const isUserAuthenticated = authenticated || authState || (!!tokenInStorage && !!userInStorage);

  // Check URL params for video call link
  useEffect(() => {
    if (!isUserAuthenticated || !user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    const fromUserId = urlParams.get('from');

    if (roomId && fromUserId) {
      // Extract target user ID from room ID (format: room_${callerId}_${targetId}_${timestamp})
      const roomParts = roomId.split('_');
      if (roomParts.length >= 3) {
        const callerId = roomParts[1];
        const targetId = roomParts[2];
        const currentUserId = user?.id || user?.Id;

        // Determine who is calling whom
        let targetUserId = currentUserId === callerId ? targetId : callerId;

        // Fetch caller name
        const fetchCallerName = async () => {
          try {
            const { userAPI } = await import('../services/api');
            const response = await userAPI.getUserById(targetUserId);
            let targetUserName = 'User';
            if (response.success && response.data) {
              targetUserName = response.data.fullname || response.data.Fullname || response.data.email || 'User';
            }

            setVideoCallFromLink({
              roomId,
              targetUserId,
              targetUserName,
              fromUserId,
              autoJoin: true
            });
            setActiveTab('video-call');

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          } catch (error) {
            console.error('Error fetching caller name:', error);
            // Still set video call even if name fetch fails
            setVideoCallFromLink({
              roomId,
              targetUserId,
              targetUserName: 'User',
              fromUserId,
              autoJoin: true
            });
            setActiveTab('video-call');
            window.history.replaceState({}, '', window.location.pathname);
          }
        };

        fetchCallerName();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user, isUserAuthenticated]);

  const handleUserCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleWarehouseCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOrderCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleProductCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSupplierCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Check if we're on reset password page
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const isResetPasswordPage = window.location.pathname.includes('reset-password') || resetToken;

  // Check if we're on payment callback page
  // Support both /payment/success and /payment/callback/vnpay formats
  const isPaymentCallback = window.location.pathname.includes('/payment/') &&
    (window.location.pathname.includes('/success') ||
      window.location.pathname.includes('/failed') ||
      window.location.pathname.includes('/callback/'));

  // Show reset password page if token exists (even if authenticated)
  if (isResetPasswordPage) {
    return <ResetPassword />;
  }

  // Show payment callback page (even if authenticated)
  if (isPaymentCallback) {
    return <PaymentCallback />;
  }

  // Check authentication - use both function result and state
  console.log('[App] Authentication check:', {
    authenticated,
    authState,
    isUserAuthenticated,
    hasToken: !!token,
    hasUser: !!user,
    tokenInStorage: !!localStorage.getItem('token'),
    userInStorage: !!localStorage.getItem('user')
  });

  if (!isUserAuthenticated) {
    console.log('[App] Not authenticated, showing Login');
    return <Login />;
  }

  console.log('[App] Authenticated, showing dashboard');

  // Theme-aware colors
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
  const cardBg = isDark
    ? 'rgba(30, 41, 59, 0.95)'
    : 'rgba(255, 255, 255, 0.95)';
  const textPrimary = isDark ? '#f1f5f9' : '#1f2937';
  const textSecondary = isDark ? '#cbd5e1' : '#6b7280';
  const borderColor = isDark ? '#334155' : 'rgba(255, 255, 255, 0.18)';

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 80 : 280);

  return (
    <div className="App" style={{
      minHeight: '100vh',
      background: bgGradient,
      position: 'relative',
      transition: 'background 0.3s ease',
      display: 'flex'
    }}>
      {/* Hamburger Menu Button (Mobile only) */}
      {isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          data-hamburger
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileSidebarOpen}
          aria-controls="main-sidebar"
          tabIndex={0}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            width: '44px',
            height: '44px',
            padding: '10px',
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDark
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isMobileSidebarOpen ? (
            <Icons.Close size={24} color={isDark ? '#f1f5f9' : '#1f2937'} />
          ) : (
            <Icons.Add size={24} color={isDark ? '#f1f5f9' : '#1f2937'} style={{ transform: 'rotate(0deg)' }} />
          )}
        </button>
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: `${sidebarWidth}px`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '24px',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          background: cardBg,
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '28px 36px',
          marginBottom: '28px',
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          border: `1px solid ${borderColor}`,
          animation: 'fadeIn 0.5s ease-out',
          transition: 'background 0.3s ease, border-color 0.3s ease'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
              }}>
                <Icons.Users size={24} color="white" />
              </div>
              System Management
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              color: textSecondary,
              fontSize: '15px',
              transition: 'color 0.3s ease'
            }}>
              Hello, <strong style={{ color: isDark ? '#60a5fa' : '#007bff' }}>{user?.fullname || user?.email}</strong>
              {userRoles.length > 0 && (
                <span style={{
                  marginLeft: '12px',
                  fontSize: '13px',
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  color: '#475569',
                  borderRadius: '20px',
                  fontWeight: '600',
                  border: '1px solid rgba(71, 85, 105, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Icons.Security size={14} color="#475569" />
                  {userRoles.join(' • ')}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={logout}
              aria-label="Logout"
              tabIndex={0}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
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
              <Icons.Logout size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            {activeTab === 'dashboard' && (
              <Dashboard />
            )}
            {activeTab === 'users' && (
              <>
                <CUser onUserCreated={handleUserCreated} />
                <UserL key={refreshKey} />
              </>
            )}
            {activeTab === 'warehouses' && (
              <>
                <CWarehouse onWarehouseCreated={handleWarehouseCreated} />
                <WarehouseL key={`warehouse-${refreshKey}`} />
              </>
            )}
            {activeTab === 'orders' && (
              <>
                <COrder onOrderCreated={handleOrderCreated} />
                <OrderL key={`order-${refreshKey}`} />
              </>
            )}
            {activeTab === 'payments' && (
              <Payments />
            )}
            {activeTab === 'products' && (
              <>
                <CProduct onProductCreated={handleProductCreated} />
                <ProductL key={`product-${refreshKey}`} />
              </>
            )}
            {activeTab === 'suppliers' && (
              <>
                <CSupplier onSupplierCreated={handleSupplierCreated} />
                <SupplierL key={`supplier-${refreshKey}`} />
              </>
            )}
            {activeTab === 'audit-logs' && (
              <AuditLogs />
            )}
            {activeTab === 'reports' && (
              <Reports />
            )}
            {activeTab === 'video-call' && (
              <VideoCallList joinFromLink={videoCallFromLink} />
            )}
            {activeTab === 'admin-notifications' && userRoles.some(r => r.toLowerCase() === 'admin') && (
              <AdminNotificationPanel />
            )}
            {activeTab === 'settings' && (
              <Settings />
            )}
          </Suspense>

          {/* AI Chat - Floating widget (Gemini AI) */}
          {isAuthenticated && (
            <Suspense fallback={null}>
              <AIChat />
            </Suspense>
          )}

          {/* Custom Chatbot - Floating widget (Custom AI with Actions) */}
          {isAuthenticated && (
            <Suspense fallback={null}>
              <CustomChatbot />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default App
