const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Base Storage Adapter Interface
 */
class StorageAdapter {
    async uploadFile(file, destination) {
        throw new Error('uploadFile must be implemented');
    }

    async deleteFile(filePath) {
        throw new Error('deleteFile must be implemented');
    }

    async getFileUrl(filePath) {
        throw new Error('getFileUrl must be implemented');
    }

    async fileExists(filePath) {
        throw new Error('fileExists must be implemented');
    }
}

/**
 * Local File Storage Adapter
 */
class LocalStorageAdapter extends StorageAdapter {
    constructor(uploadDir = './uploads') {
        super();
        this.uploadDir = uploadDir;
    }

    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    async uploadFile(file, destination) {
        try {
            const fullPath = path.join(this.uploadDir, destination);
            const dir = path.dirname(fullPath);
            
            await this.ensureDirectory(dir);
            
            // Move file from temp location to destination
            if (file.path) {
                // Multer saves to temp location
                await fs.rename(file.path, fullPath);
            } else if (file.buffer) {
                // File is in memory
                await fs.writeFile(fullPath, file.buffer);
            } else {
                throw new Error('Invalid file object');
            }

            return fullPath;
        } catch (error) {
            logger.error('Error uploading file to local storage', { error: error.message, destination });
            throw error;
        }
    }

    async deleteFile(filePath) {
        try {
            // If filePath is relative, make it relative to uploadDir
            const fullPath = filePath.startsWith(this.uploadDir) 
                ? filePath 
                : path.join(this.uploadDir, filePath);
            
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn('File not found for deletion', { filePath });
                return false;
            }
            logger.error('Error deleting file from local storage', { error: error.message, filePath });
            throw error;
        }
    }

    async getFileUrl(filePath) {
        // For local storage, return relative path that can be served via static middleware
        const relativePath = filePath.startsWith(this.uploadDir)
            ? filePath.replace(this.uploadDir, '').replace(/^[\/\\]/, '')
            : filePath;
        
        return `/uploads/${relativePath.replace(/\\/g, '/')}`;
    }

    async fileExists(filePath) {
        try {
            const fullPath = filePath.startsWith(this.uploadDir)
                ? filePath
                : path.join(this.uploadDir, filePath);
            
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Factory function to get storage adapter based on configuration
 */
function getStorageAdapter() {
    const storageType = process.env.STORAGE_TYPE || 'local';
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    switch (storageType.toLowerCase()) {
        case 'local':
            return new LocalStorageAdapter(uploadDir);
        case 's3':
            // TODO: Implement S3 adapter
            logger.warn('S3 storage adapter not yet implemented, falling back to local');
            return new LocalStorageAdapter(uploadDir);
        case 'gcs':
            // TODO: Implement GCS adapter
            logger.warn('GCS storage adapter not yet implemented, falling back to local');
            return new LocalStorageAdapter(uploadDir);
        default:
            logger.warn(`Unknown storage type: ${storageType}, using local storage`);
            return new LocalStorageAdapter(uploadDir);
    }
}

module.exports = {
    StorageAdapter,
    LocalStorageAdapter,
    getStorageAdapter
};

