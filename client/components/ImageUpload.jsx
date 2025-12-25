import { useState, useRef } from 'react';
import { fileUploadAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';

/**
 * Image Upload Component
 * Specialized for image uploads with preview
 */
const ImageUpload = ({ 
    entityType, 
    entityId, 
    uploadType = 'product_image',
    onUploadSuccess,
    onUploadError,
    multiple = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    disabled = false,
    showPreview = true
}) => {
    const { success: showSuccess, error: showError } = useToast();
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (files) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        
        // Validate file types
        const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            showError('Chỉ chấp nhận file ảnh');
            return;
        }

        // Validate file sizes
        const oversizedFiles = fileArray.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            showError(`Một số file vượt quá kích thước cho phép (${maxSize / 1024 / 1024}MB)`);
            return;
        }

        // Create previews
        if (showPreview) {
            const previews = await Promise.all(
                fileArray.map(file => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve({ file, preview: e.target.result });
                        reader.readAsDataURL(file);
                    });
                })
            );
            setPreview(previews);
        }

        try {
            setUploading(true);
            
            if (multiple) {
                const response = await fileUploadAPI.uploadMultipleImages(fileArray, entityType, entityId, uploadType);
                if (response.success) {
                    showSuccess(`${response.data.length} ảnh đã được tải lên!`);
                    if (onUploadSuccess) onUploadSuccess(response.data);
                    setPreview([]);
                } else {
                    showError(response.message || 'Upload failed');
                    if (onUploadError) onUploadError(response);
                }
            } else {
                const response = await fileUploadAPI.uploadImage(fileArray[0], entityType, entityId, uploadType);
                if (response.success) {
                    showSuccess('Ảnh đã được tải lên!');
                    if (onUploadSuccess) onUploadSuccess(response.data);
                    setPreview([]);
                } else {
                    showError(response.message || 'Upload failed');
                    if (onUploadError) onUploadError(response);
                }
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Upload failed';
            showError(errorMsg);
            if (onUploadError) onUploadError(err);
            setPreview([]);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
        }
    };

    return (
        <div>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragActive ? '#3b82f6' : 'var(--border-color, #e5e7eb)'}`,
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    background: dragActive ? '#eff6ff' : 'var(--bg-secondary, #f9fafb)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: disabled ? 0.6 : 1
                }}
                onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    onChange={handleInputChange}
                    disabled={disabled || uploading}
                    style={{ display: 'none' }}
                />
                
                {uploading ? (
                    <>
                        <Icons.Loader className="animate-spin" size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#3b82f6' }} />
                        <div style={{ color: '#666', fontSize: '14px' }}>Đang tải lên...</div>
                    </>
                ) : (
                    <>
                        <Icons.File size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#9ca3af' }} />
                        <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500', color: 'var(--text-primary, #1a1a1a)' }}>
                            {multiple ? 'Kéo thả ảnh hoặc click để chọn' : 'Kéo thả ảnh hoặc click để chọn ảnh'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            JPG, PNG, GIF, WEBP - Tối đa {maxSize / 1024 / 1024}MB {multiple ? 'mỗi ảnh' : ''}
                        </div>
                    </>
                )}
            </div>

            {/* Preview */}
            {showPreview && preview.length > 0 && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '12px',
                    marginTop: '20px'
                }}>
                    {preview.map((item, index) => (
                        <div key={index} style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color, #e5e7eb)'
                        }}>
                            <img 
                                src={item.preview} 
                                alt={`Preview ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '150px',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                setPreview(prev => prev.filter((_, i) => i !== index));
                            }}
                            >
                                <Icons.X size={14} color="white" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;

