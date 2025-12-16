import { createContext, useContext, useState, useCallback } from 'react';
import { Icons } from '../utils/icons';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };
        
        setToasts(prev => [...prev, toast]);
        
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
        
        return id;
    }, [removeToast]);

    const success = useCallback((message, duration) => {
        return showToast(message, 'success', duration);
    }, [showToast]);

    const error = useCallback((message, duration) => {
        return showToast(message, 'error', duration);
    }, [showToast]);

    const info = useCallback((message, duration) => {
        return showToast(message, 'info', duration);
    }, [showToast]);

    const warning = useCallback((message, duration) => {
        return showToast(message, 'warning', duration);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none'
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    const getToastStyle = () => {
        const baseStyle = {
            minWidth: '300px',
            maxWidth: '400px',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            animation: 'slideInRight 0.3s ease-out',
            border: '1px solid',
            backdropFilter: 'blur(10px)'
        };

        switch (toast.type) {
            case 'success':
                return {
                    ...baseStyle,
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    borderColor: '#10b981',
                    color: '#065f46'
                };
            case 'error':
                return {
                    ...baseStyle,
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    borderColor: '#ef4444',
                    color: '#991b1b'
                };
            case 'warning':
                return {
                    ...baseStyle,
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderColor: '#f59e0b',
                    color: '#92400e'
                };
            default:
                return {
                    ...baseStyle,
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderColor: '#3b82f6',
                    color: '#1e40af'
                };
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <Icons.Success size={24} color={toast.type === 'success' ? '#10b981' : '#3b82f6'} />;
            case 'error':
                return <Icons.Warning size={24} color="#ef4444" />;
            case 'warning':
                return <Icons.Warning size={24} color="#f59e0b" />;
            default:
                return <Icons.Success size={24} color="#3b82f6" />;
        }
    };

    return (
        <div style={getToastStyle()}>
            {getIcon()}
            <div style={{ flex: 1, fontSize: '14px', fontWeight: '500', lineHeight: '1.5' }}>
                {toast.message}
            </div>
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    color: 'inherit',
                    opacity: 0.7,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <Icons.Close size={18} />
            </button>
        </div>
    );
};

