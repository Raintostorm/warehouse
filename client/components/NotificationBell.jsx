import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { notificationAPI } from '../services/api';
import { Icons } from '../src/utils/icons';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        fetchUnreadCount();
        fetchUnreadNotifications();
        
        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
            fetchUnreadNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Calculate dropdown position when opening
        if (isOpen && buttonRef.current) {
            const updatePosition = () => {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + 12,
                    right: window.innerWidth - rect.right
                });
            };
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleClickOutside, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleClickOutside, true);
        };
    }, [isOpen]);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            if (response.success) {
                setUnreadCount(response.count);
            }
        } catch (error) {
            console.error('Fetch unread count error:', error);
        }
    };

    const fetchUnreadNotifications = async () => {
        try {
            const response = await notificationAPI.getUnreadNotifications(10);
            if (response.success) {
                setNotifications(response.data || []);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setLoading(true);
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Mark all as read error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await notificationAPI.deleteNotification(id);
            const notification = notifications.find(n => n.id === id);
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Delete notification error:', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_order':
                return <Icons.Order size={20} />;
            case 'low_stock':
                return <Icons.Warning size={20} />;
            default:
                return <Icons.Success size={20} />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'new_order':
                return '#3b82f6'; // blue
            case 'low_stock':
                return '#ef4444'; // red
            default:
                return '#10b981'; // green
        }
    };

    const dropdownContent = isOpen ? (
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                width: '400px',
                maxHeight: '600px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                zIndex: 10000,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#334155' }}>
                    Thông báo {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={loading}
                        style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div style={{
                overflowY: 'auto',
                maxHeight: '500px',
                padding: '8px'
            }}>
                {notifications.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#94a3b8'
                    }}>
                        <Icons.Success size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>Không có thông báo mới</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            style={{
                                padding: '12px 16px',
                                marginBottom: '8px',
                                borderRadius: '12px',
                                background: notification.is_read ? '#f8fafc' : '#fffbeb',
                                border: `1px solid ${notification.is_read ? '#e5e7eb' : '#fcd34d'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = notification.is_read ? '#f1f5f9' : '#fef3c7';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = notification.is_read ? '#f8fafc' : '#fffbeb';
                            }}
                            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        >
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: `${getNotificationColor(notification.type)}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: getNotificationColor(notification.type),
                                    flexShrink: 0
                                }}>
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '4px'
                                    }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: notification.is_read ? '500' : '600',
                                            color: '#334155'
                                        }}>
                                            {notification.title}
                                        </h4>
                                        {!notification.is_read && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#ef4444',
                                                flexShrink: 0,
                                                marginTop: '4px'
                                            }} />
                                        )}
                                    </div>
                                    <p style={{
                                        margin: '4px 0',
                                        fontSize: '13px',
                                        color: '#64748b',
                                        lineHeight: '1.5'
                                    }}>
                                        {notification.message}
                                    </p>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '8px'
                                    }}>
                                        <span style={{
                                            fontSize: '11px',
                                            color: '#94a3b8'
                                        }}>
                                            {formatTime(notification.created_at)}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notification.id);
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                borderRadius: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#fee2e2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            <div style={{ position: 'relative' }}>
                <button
                    ref={buttonRef}
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            fetchUnreadNotifications();
                        }
                    }}
                    style={{
                        position: 'relative',
                        padding: '10px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#475569',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <Icons.Warning size={24} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
            {isOpen && createPortal(dropdownContent, document.body)}
        </>
    );
};

export default NotificationBell;

