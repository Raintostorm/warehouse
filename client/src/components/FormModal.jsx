import { useState, useEffect } from 'react';
import Modal from './Modal';
import ModernButton from './ModernButton';
import { Icons } from '../utils/icons';

/**
 * FormModal Component - Base reusable form modal
 * Single Responsibility: Provide consistent form modal structure
 * Open/Closed: Extensible through render props and children
 * Liskov Substitution: Can replace any form modal implementation
 */
const FormModal = ({
    isOpen,
    onClose,
    title,
    onSubmit,
    submitText = 'Lưu',
    cancelText = 'Hủy',
    loading = false,
    children,
    size = 'medium',
    submitVariant = 'primary',
    showFooter = true,
    initialData = null,
    onReset
}) => {
    const [formData, setFormData] = useState(initialData || {});

    // Reset form when modal closes or initialData changes
    useEffect(() => {
        if (!isOpen && onReset) {
            onReset();
        }
    }, [isOpen, onReset]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (onSubmit) {
            await onSubmit(formData);
        }
    };

    const handleClose = () => {
        if (onReset) {
            onReset();
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            size={size}
        >
            <form onSubmit={handleSubmit}>
                {/* Form Content - Can be children or render prop */}
                {typeof children === 'function' 
                    ? children({ formData, setFormData })
                    : children
                }

                {/* Footer */}
                {showFooter && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '16px',
                        marginTop: '24px',
                        borderTop: '1px solid var(--border-color, #e5e7eb)'
                    }}>
                        <ModernButton
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            {cancelText}
                        </ModernButton>
                        <ModernButton
                            type="submit"
                            variant={submitVariant}
                            loading={loading}
                            icon={<Icons.Success size={16} />}
                        >
                            {loading ? 'Đang xử lý...' : submitText}
                        </ModernButton>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default FormModal;

