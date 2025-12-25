import { useState, useEffect } from 'react';
import { fileUploadAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import ConfirmationModal from '../src/components/ConfirmationModal';

/**
 * Image Gallery Component
 * Displays and manages images for an entity
 */
const ImageGallery = ({ 
    entityType, 
    entityId,
    onRefresh,
    allowDelete = true,
    allowSetPrimary = true
}) => {
    const { success: showSuccess, error: showError } = useToast();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, imageId: null });

    useEffect(() => {
        if (entityType && entityId) {
            fetchImages();
        }
    }, [entityType, entityId]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await fileUploadAPI.getFilesByEntity(entityType, entityId);
            if (response.success) {
                // Filter only images
                const imageFiles = (response.data || []).filter(file => 
                    file.file_type === 'image' || file.mime_type?.startsWith('image/')
                );
                setImages(imageFiles);
            } else {
                showError('Failed to fetch images: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching images: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async (imageId) => {
        try {
            const response = await fileUploadAPI.setPrimaryFile(imageId, entityType, entityId);
            if (response.success) {
                showSuccess('Primary image set successfully!');
                fetchImages();
                if (onRefresh) onRefresh();
            } else {
                showError(response.message || 'Failed to set primary image');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = (imageId) => {
        setConfirmModal({ isOpen: true, action: 'delete', imageId });
    };

    const confirmDelete = async () => {
        const { imageId } = confirmModal;
        try {
            const response = await fileUploadAPI.deleteFile(imageId);
            if (response.success) {
                showSuccess('Image deleted successfully!');
                fetchImages();
                if (onRefresh) onRefresh();
            } else {
                showError(response.message || 'Failed to delete image');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        }
        setConfirmModal({ isOpen: false, action: null, imageId: null });
    };

    const getImageUrl = (image) => {
        if (image.file_url) {
            // If it's a full URL, use it directly
            if (image.file_url.startsWith('http://') || image.file_url.startsWith('https://')) {
                return image.file_url;
            }
            // If it's a relative path, prepend API URL
            const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
            return `${apiUrl}${image.file_url}`;
        }
        // Fallback to file_path
        const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${apiUrl}/uploads/${image.file_path}`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Icons.Loader className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: '12px', color: '#666' }}>Đang tải ảnh...</div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#999',
                fontSize: '14px'
            }}>
                Chưa có ảnh nào
            </div>
        );
    }

    return (
        <div>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px'
            }}>
                {images.map((image) => (
                    <div 
                        key={image.id}
                        style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: `2px solid ${image.is_primary ? '#3b82f6' : 'var(--border-color, #e5e7eb)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => setSelectedImage(image)}
                    >
                        <img 
                            src={getImageUrl(image)}
                            alt={image.original_name || image.file_name}
                            style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        {image.is_primary && (
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: '#3b82f6',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}>
                                Primary
                            </div>
                        )}
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            display: 'flex',
                            gap: '4px'
                        }}>
                            {allowSetPrimary && !image.is_primary && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetPrimary(image.id);
                                    }}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.9)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    title="Set as primary"
                                >
                                    <Icons.Success size={16} />
                                </button>
                            )}
                            {allowDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(image.id);
                                    }}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.9)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    title="Delete"
                                >
                                    <Icons.X size={16} />
                                </button>
                            )}
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                            padding: '8px',
                            color: 'white',
                            fontSize: '11px'
                        }}>
                            {image.original_name || image.file_name}
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 2000,
                        padding: '20px'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img 
                            src={getImageUrl(selectedImage)}
                            alt={selectedImage.original_name || selectedImage.file_name}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                borderRadius: '8px'
                            }}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255, 255, 255, 0.9)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '20px'
                            }}
                        >
                            <Icons.X size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, action: null, imageId: null })}
                    onConfirm={confirmDelete}
                    title="Xóa Ảnh"
                    message="Bạn có chắc chắn muốn xóa ảnh này?"
                    type="danger"
                />
            )}
        </div>
    );
};

export default ImageGallery;

