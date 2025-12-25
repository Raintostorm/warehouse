import { useState, useEffect } from 'react';
import { fileUploadAPI } from '../services/api';
import { useToast } from '../src/contexts/ToastContext';
import { Icons } from '../src/utils/icons';
import FileUpload from './FileUpload';
import ImageGallery from './ImageGallery';
import ConfirmationModal from '../src/components/ConfirmationModal';

/**
 * File Manager Component
 * Complete file management interface for an entity
 */
const FileManager = ({ 
    entityType, 
    entityId,
    uploadType = null,
    onRefresh,
    allowDelete = true,
    allowSetPrimary = true,
    showImagesOnly = false
}) => {
    const { success: showSuccess, error: showError } = useToast();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gallery');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, fileId: null });

    useEffect(() => {
        if (entityType && entityId) {
            fetchFiles();
        }
    }, [entityType, entityId]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await fileUploadAPI.getFilesByEntity(entityType, entityId);
            if (response.success) {
                setFiles(response.data || []);
            } else {
                showError('Failed to fetch files: ' + response.message);
            }
        } catch (err) {
            showError('Error fetching files: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = (uploadedFiles) => {
        fetchFiles();
        if (onRefresh) onRefresh();
    };

    const handleDelete = (fileId) => {
        setConfirmModal({ isOpen: true, fileId });
    };

    const confirmDelete = async () => {
        const { fileId } = confirmModal;
        try {
            const response = await fileUploadAPI.deleteFile(fileId);
            if (response.success) {
                showSuccess('File deleted successfully!');
                fetchFiles();
                if (onRefresh) onRefresh();
            } else {
                showError(response.message || 'Failed to delete file');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        }
        setConfirmModal({ isOpen: false, fileId: null });
    };

    const handleSetPrimary = async (fileId) => {
        try {
            const response = await fileUploadAPI.setPrimaryFile(fileId, entityType, entityId);
            if (response.success) {
                showSuccess('Primary file set successfully!');
                fetchFiles();
                if (onRefresh) onRefresh();
            } else {
                showError(response.message || 'Failed to set primary file');
            }
        } catch (err) {
            showError('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const images = files.filter(f => f.file_type === 'image' || f.mime_type?.startsWith('image/'));
    const documents = files.filter(f => f.file_type !== 'image' && !f.mime_type?.startsWith('image/'));

    const getFileUrl = (file) => {
        if (file.file_url) {
            if (file.file_url.startsWith('http://') || file.file_url.startsWith('https://')) {
                return file.file_url;
            }
            const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
            return `${apiUrl}${file.file_url}`;
        }
        const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${apiUrl}/uploads/${file.file_path}`;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Icons.Loader className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
                <div style={{ marginTop: '12px', color: '#666' }}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Tabs */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '24px',
                borderBottom: '2px solid var(--border-color, #e5e7eb)'
            }}>
                <button
                    onClick={() => setActiveTab('upload')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'upload' 
                            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                            : 'transparent',
                        color: activeTab === 'upload' ? 'white' : 'var(--text-secondary, #666)',
                        border: 'none',
                        borderBottom: activeTab === 'upload' ? '3px solid #2563eb' : '3px solid transparent',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeTab === 'upload' ? '600' : '500',
                        marginBottom: '-2px'
                    }}
                >
                    Tải Lên
                </button>
                {images.length > 0 && (
                    <button
                        onClick={() => setActiveTab('gallery')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'gallery' 
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                                : 'transparent',
                            color: activeTab === 'gallery' ? 'white' : 'var(--text-secondary, #666)',
                            border: 'none',
                            borderBottom: activeTab === 'gallery' ? '3px solid #2563eb' : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'gallery' ? '600' : '500',
                            marginBottom: '-2px'
                        }}
                    >
                        Ảnh ({images.length})
                    </button>
                )}
                {documents.length > 0 && (
                    <button
                        onClick={() => setActiveTab('documents')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'documents' 
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                                : 'transparent',
                            color: activeTab === 'documents' ? 'white' : 'var(--text-secondary, #666)',
                            border: 'none',
                            borderBottom: activeTab === 'documents' ? '3px solid #2563eb' : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'documents' ? '600' : '500',
                            marginBottom: '-2px'
                        }}
                    >
                        Tài Liệu ({documents.length})
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
                <div>
                    <FileUpload
                        entityType={entityType}
                        entityId={entityId}
                        uploadType={uploadType}
                        onUploadSuccess={handleUploadSuccess}
                        multiple={true}
                        accept={showImagesOnly ? 'image/*' : '*/*'}
                    />
                </div>
            )}

            {activeTab === 'gallery' && images.length > 0 && (
                <ImageGallery
                    entityType={entityType}
                    entityId={entityId}
                    onRefresh={fetchFiles}
                    allowDelete={allowDelete}
                    allowSetPrimary={allowSetPrimary}
                />
            )}

            {activeTab === 'documents' && documents.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{ 
                                background: 'var(--bg-tertiary, #f9fafb)',
                                borderBottom: '2px solid var(--border-color, #e5e7eb)'
                            }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tên File</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Loại</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Kích Thước</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Primary</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Ngày Tải</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((file) => (
                                <tr 
                                    key={file.id}
                                    style={{ 
                                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f9fafb)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '12px' }}>
                                        <a 
                                            href={getFileUrl(file)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#3b82f6',
                                                textDecoration: 'none',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {file.original_name || file.file_name}
                                        </a>
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {file.file_type || file.mime_type || '-'}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        {formatFileSize(file.file_size)}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {file.is_primary ? (
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                background: '#dbeafe',
                                                color: '#2563eb'
                                            }}>
                                                Primary
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(file.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            {allowSetPrimary && !file.is_primary && (
                                                <button
                                                    onClick={() => handleSetPrimary(file.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Set Primary
                                                </button>
                                            )}
                                            {allowDelete && (
                                                <button
                                                    onClick={() => handleDelete(file.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, fileId: null })}
                    onConfirm={confirmDelete}
                    title="Xóa File"
                    message="Bạn có chắc chắn muốn xóa file này?"
                    type="danger"
                />
            )}
        </div>
    );
};

export default FileManager;

