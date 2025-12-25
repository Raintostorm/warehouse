const path = require('path');
const { getStorageAdapter } = require('./storageAdapter');
const logger = require('./logger');

/**
 * Validate file
 */
function validateFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    } = options;

    if (!file) {
        throw new Error('No file provided');
    }

    // Check file size
    const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
    if (fileSize > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check extension
    if (file.originalname) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            throw new Error(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
        }
    }

    return true;
}

/**
 * Get file type from MIME type
 */
function getFileType(mimeType) {
    if (!mimeType) return 'unknown';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint')) return 'document';
    
    return 'other';
}

/**
 * Generate file metadata
 */
function generateFileMetadata(file) {
    return {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size || (file.buffer ? file.buffer.length : 0),
        uploadedAt: new Date().toISOString()
    };
}

/**
 * Upload file using storage adapter
 */
async function uploadFileToStorage(file, entityType, entityId, uploadType = null) {
    try {
        const storage = getStorageAdapter();
        
        // Generate destination path
        const ext = path.extname(file.originalname);
        const filename = `${entityType}_${entityId}_${Date.now()}${ext}`;
        const destination = path.join(entityType, filename);

        // Upload file
        const filePath = await storage.uploadFile(file, destination);
        
        // Get file URL
        const fileUrl = await storage.getFileUrl(filePath);

        return {
            filePath,
            fileUrl,
            fileName: filename,
            originalName: file.originalname,
            fileType: getFileType(file.mimetype),
            mimeType: file.mimetype,
            fileSize: file.size || (file.buffer ? file.buffer.length : 0)
        };
    } catch (error) {
        logger.error('Error uploading file', { error: error.message, entityType, entityId });
        throw error;
    }
}

/**
 * Delete file using storage adapter
 */
async function deleteFile(filePath) {
    try {
        const storage = getStorageAdapter();
        return await storage.deleteFile(filePath);
    } catch (error) {
        logger.error('Error deleting file', { error: error.message, filePath });
        throw error;
    }
}

/**
 * Get file URL using storage adapter
 */
async function getFileUrl(filePath) {
    try {
        const storage = getStorageAdapter();
        return await storage.getFileUrl(filePath);
    } catch (error) {
        logger.error('Error getting file URL', { error: error.message, filePath });
        throw error;
    }
}

module.exports = {
    validateFile,
    getFileType,
    generateFileMetadata,
    uploadFileToStorage,
    deleteFile,
    getFileUrl
};

