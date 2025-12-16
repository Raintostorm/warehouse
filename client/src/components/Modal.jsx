import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Icons } from '../utils/icons';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
    const { isDark } = useTheme();
    
    // Theme-aware colors
    const modalBg = isDark ? 'rgba(30, 41, 59, 0.98)' : 'white';
    const headerBg = isDark 
        ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
    const borderColor = isDark ? '#334155' : '#e5e7eb';
    const textColor = isDark ? '#f1f5f9' : '#1f2937';
    const closeButtonHover = isDark ? '#334155' : '#f1f5f9';
    const closeButtonColor = isDark ? '#94a3b8' : '#64748b';
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeStyles = {
        small: { maxWidth: '400px' },
        medium: { maxWidth: '600px' },
        large: { maxWidth: '800px' },
        xlarge: { maxWidth: '1000px' }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                overflow: 'visible',
                padding: '20px',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: modalBg,
                    borderRadius: '20px',
                    boxShadow: isDark
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
                        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    width: '100%',
                    ...sizeStyles[size],
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.3s ease-out',
                    overflow: 'visible',
                    transition: 'background 0.3s ease, box-shadow 0.3s ease',
                    border: `1px solid ${borderColor}`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div style={{
                        padding: '24px 28px',
                        borderBottom: `1px solid ${borderColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: headerBg,
                        transition: 'background 0.3s ease, border-color 0.3s ease'
                    }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: closeButtonColor,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = closeButtonHover;
                                e.currentTarget.style.color = textColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = closeButtonColor;
                            }}
                        >
                            <Icons.Close size={24} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div style={{
                    padding: '20px',
                    overflowY: 'auto',
                    overflowX: 'visible',
                    flex: 1,
                    position: 'relative',
                    overflow: 'visible'
                }}>
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Modal;

