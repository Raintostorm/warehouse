const path = require('path');
const { getStorageAdapter } = require('./storageAdapter');
const logger = require('./logger');

/**
 * Validate file
 */
function validateFile(file, options = {}) {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        // Support all common image formats
        allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'image/bmp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
            'image/tiff', 'image/tif', 'image/heic', 'image/heif', 'image/avif',
            'image/jfif', 'image/jp2', 'image/jpx', 'image/x-jp2'
        ],
        allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico',
            '.tiff', '.tif', '.heic', '.heif', '.avif', '.jfif', '.jp2', '.jpx'
        ]
    } = options;

    if (!file) {
        throw new Error('No file provided');
    }

    // Check file size
    const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
    if (fileSize > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Check MIME type - for images, accept any MIME type starting with 'image/'
    if (file.mimetype) {
        const isImage = file.mimetype.startsWith('image/');
        if (!isImage && !allowedTypes.includes(file.mimetype)) {
            throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')} or any image/* type`);
        }
    }

    // Check extension - for images, be more permissive
    if (file.originalname) {
        const ext = path.extname(file.originalname).toLowerCase();
        const isImageExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', 
                           '.tiff', '.tif', '.heic', '.heif', '.avif', '.jfif', '.jp2', '.jpx'].includes(ext);
        if (!isImageExt && !allowedExtensions.includes(ext)) {
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
        
        // Generate destination path with unique filename
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1000000);
        const filename = `${entityType}_${entityId}_${timestamp}_${random}${ext}`;
        const destination = path.join(entityType, filename);

        logger.info('Uploading file to storage', { 
            destination, 
            filename, 
            originalName: file.originalname,
            size: file.size 
        });

        // Upload file
        const filePath = await storage.uploadFile(file, destination);
        
        // Get file URL
        const fileUrl = await storage.getFileUrl(filePath);

        logger.info('File uploaded successfully', { filePath, fileUrl });

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
        logger.error('Error uploading file to storage', { 
            error: error.message, 
            stack: error.stack,
            originalName: file?.originalname,
            entityType, 
            entityId 
        });
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

