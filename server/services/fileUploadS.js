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

async function generateFileId() {
    const timestamp = Date.now();
    return `FILE${timestamp}`;
}

const FileUploadS = {
    /**
     * Upload file and save record
     */
    uploadFile: async (file, entityType, entityId, uploadType = null, actor = null) => {
        try {
            // Upload file to storage
            const uploadResult = await uploadFileToStorage(file, entityType, entityId, uploadType);

            // Generate file ID
            const fileId = generateFileId();

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

            const fileRecord = await FileUploadsM.create(fileData);
            return fileRecord;
        } catch (error) {
            logger.error('Error in file upload service', { error: error.message, entityType, entityId });
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

