import { useState, useRef } from 'react';
import { fileUploadAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';

/**
 * Generic File Upload Component
 * Supports single and multiple file uploads
 */
const FileUpload = ({ 
    entityType, 
    entityId, 
    uploadType = null,
    onUploadSuccess,
    onUploadError,
    multiple = false,
    accept = '*/*',
    maxSize = 5 * 1024 * 1024, // 5MB default
    disabled = false
}) => {
    const { success: showSuccess, error: showError } = useToast();
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (files) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        
        // Validate file sizes
        const oversizedFiles = fileArray.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            showError(`Một số file vượt quá kích thước cho phép (${maxSize / 1024 / 1024}MB)`);
            return;
        }

        try {
            setUploading(true);
            
            if (multiple) {
                const response = await fileUploadAPI.uploadMultipleImages(fileArray, entityType, entityId, uploadType);
                if (response.success) {
                    showSuccess(`${response.data.length} file(s) uploaded successfully!`);
                    if (onUploadSuccess) onUploadSuccess(response.data);
                } else {
                    showError(response.message || 'Upload failed');
                    if (onUploadError) onUploadError(response);
                }
            } else {
                const response = await fileUploadAPI.uploadImage(fileArray[0], entityType, entityId, uploadType);
                if (response.success) {
                    showSuccess('File uploaded successfully!');
                    if (onUploadSuccess) onUploadSuccess(response.data);
                } else {
                    showError(response.message || 'Upload failed');
                    if (onUploadError) onUploadError(response);
                }
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Upload failed';
            showError(errorMsg);
            if (onUploadError) onUploadError(err);
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
                accept={accept}
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
                        {multiple ? 'Kéo thả file hoặc click để chọn' : 'Kéo thả file hoặc click để chọn file'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Tối đa {maxSize / 1024 / 1024}MB {multiple ? 'mỗi file' : ''}
                    </div>
                </>
            )}
        </div>
    );
};

export default FileUpload;

