const FileUploadsM = require('../models/fileUploadsM');
const { uploadFileToStorage, deleteFile, generateFileMetadata } = require('../utils/fileUpload');
const logger = require('../utils/logger');

// Helper to get actor (works with or without req)
const getActor = (reqOrActor) => {
    if (!reqOrActor) return 'System';
    if (typeof reqOrActor === 'string') return reqOrActor;
    if (reqOrActor.user) {
        return reqOrActor.user.email || reqOrActor.user.id || 'System';
    }
    return 'System';
};

// Counter to ensure unique IDs even when multiple files uploaded simultaneously
let fileIdCounter = 0;

async function generateFileId() {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 999999); // 6 digits (0-999999)
    fileIdCounter = (fileIdCounter + 1) % 1000; // 3 digits counter (0-999)
    // Combine: timestamp (13) + counter (3) + random (6) = 22 digits
    // Use base36 encoding to make it shorter: ~14 chars
    // Total: FILE (4) + base36 (~14) = ~18 chars - fits in VARCHAR(20)
    const combined = `${timestamp}${String(fileIdCounter).padStart(3, '0')}${String(random).padStart(6, '0')}`;
    const base36 = parseInt(combined).toString(36).toUpperCase();
    return `FILE${base36}`;
}

const FileUploadS = {
    /**
     * Upload file and save record
     */
    uploadFile: async (file, entityType, entityId, uploadType = null, actor = null) => {
        let uploadResult = null;
        let retryCount = 0;
        const maxRetries = 3;

        try {
            logger.info('Starting file upload', { 
                originalName: file.originalname, 
                mimetype: file.mimetype,
                size: file.size,
                entityType,
                entityId
            });
            
            // Upload file to storage first
            uploadResult = await uploadFileToStorage(file, entityType, entityId, uploadType);
            logger.info('File uploaded to storage', { 
                filePath: uploadResult.filePath, 
                fileUrl: uploadResult.fileUrl 
            });

            // Try to save file record with retry logic for ID conflicts
            while (retryCount < maxRetries) {
                try {
                    // Generate file ID
                    const fileId = await generateFileId();

                    // Save file record
                    const fileData = {
                        id: fileId,
                        entityType,
                        entityId,
                        fileName: uploadResult.fileName,
                        originalName: uploadResult.originalName,
                        filePath: uploadResult.filePath,
                        fileUrl: uploadResult.fileUrl,
                        fileType: uploadResult.fileType,
                        mimeType: uploadResult.mimeType,
                        fileSize: uploadResult.fileSize,
                        isPrimary: false,
                        uploadType: uploadType || `${entityType}_${uploadResult.fileType}`,
                        metadata: generateFileMetadata(file),
                        actor: actor || getActor()
                    };

                    logger.info('Saving file record to database', { fileId, retryCount, fileData: { ...fileData, metadata: '...' } });
                    const fileRecord = await FileUploadsM.create(fileData);
                    logger.info('File record saved successfully', { fileId, fileRecordId: fileRecord.id });
                    
                    return fileRecord;
                } catch (dbError) {
                    // Check if it's a unique constraint violation (duplicate key)
                    if (dbError.message && dbError.message.includes('unique constraint') && retryCount < maxRetries - 1) {
                        retryCount++;
                        logger.warn('File ID conflict detected, retrying with new ID', { 
                            retryCount, 
                            error: dbError.message 
                        });
                        // Wait a bit before retry to ensure different timestamp
                        await new Promise(resolve => setTimeout(resolve, 10));
                        continue;
                    }
                    // If not a conflict or max retries reached, throw the error
                    throw dbError;
                }
            }
        } catch (error) {
            // If file was uploaded to storage but database save failed, try to clean up
            if (uploadResult && uploadResult.filePath) {
                try {
                    const { deleteFile } = require('../utils/fileUpload');
                    await deleteFile(uploadResult.filePath);
                    logger.info('Cleaned up uploaded file after database error', { filePath: uploadResult.filePath });
                } catch (cleanupError) {
                    logger.error('Failed to cleanup file after error', { 
                        cleanupError: cleanupError.message,
                        filePath: uploadResult.filePath 
                    });
                }
            }
            
            logger.error('Error in file upload service', { 
                error: error.message, 
                stack: error.stack,
                originalName: file?.originalname,
                mimetype: file?.mimetype,
                entityType, 
                entityId,
                retryCount
            });
            throw error;
        }
    },

    /**
     * Delete file and record
     */
    deleteFile: async (fileId) => {
        try {
            const fileRecord = await FileUploadsM.findById(fileId);
            if (!fileRecord) {
                throw new Error('File not found');
            }

            // Delete file from storage
            await deleteFile(fileRecord.file_path);

            // Delete record
            return await FileUploadsM.delete(fileId);
        } catch (error) {
            logger.error('Error deleting file', { error: error.message, fileId });
            throw error;
        }
    },

    /**
     * Get all files for an entity
     */
    getFilesByEntity: async (entityType, entityId) => {
        try {
            return await FileUploadsM.findByEntity(entityType, entityId);
        } catch (error) {
            logger.error('Error getting files by entity', { error: error.message, entityType, entityId });
            throw error;
        }
    },

    /**
     * Get primary file for an entity
     */
    getPrimaryFile: async (entityType, entityId) => {
        try {
            return await FileUploadsM.findPrimaryByEntity(entityType, entityId);
        } catch (error) {
            logger.error('Error getting primary file', { error: error.message, entityType, entityId });
            throw error;
        }
    },

    /**
     * Set file as primary (and unset others)
     */
    setPrimaryFile: async (fileId, entityType, entityId) => {
        try {
            const fileRecord = await FileUploadsM.findById(fileId);
            if (!fileRecord) {
                throw new Error('File not found');
            }

            if (fileRecord.entity_type !== entityType || fileRecord.entity_id !== entityId) {
                throw new Error('File does not belong to this entity');
            }

            // Unset all other primary files for this entity
            const allFiles = await FileUploadsM.findByEntity(entityType, entityId);
            for (const file of allFiles) {
                if (file.is_primary && file.id !== fileId) {
                    await FileUploadsM.update(file.id, { isPrimary: false });
                }
            }

            // Set this file as primary
            return await FileUploadsM.update(fileId, { isPrimary: true });
        } catch (error) {
            logger.error('Error setting primary file', { error: error.message, fileId, entityType, entityId });
            throw error;
        }
    },

    /**
     * Get file by ID
     */
    getFileById: async (fileId) => {
        try {
            const file = await FileUploadsM.findById(fileId);
            if (!file) {
                throw new Error('File not found');
            }
            return file;
        } catch (error) {
            logger.error('Error getting file by ID', { error: error.message, fileId });
            throw error;
        }
    }
};

module.exports = FileUploadS;

