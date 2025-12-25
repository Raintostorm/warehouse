const FileUploadS = require('../services/fileUploadS');
const getActor = require('../utils/getActor');
const auditLogger = require('../utils/auditLogger');
const { sendSuccess, sendError } = require('../utils/controllerHelper');
const logger = require('../utils/logger');

const FileUploadC = {
    uploadFile: async (req, res) => {
        try {
            const file = req.file;
            if (!file) {
                return sendError(res, new Error('No file uploaded'), 'No file provided');
            }

            const { entityType, entityId, uploadType } = req.body;
            if (!entityType || !entityId) {
                return sendError(res, new Error('entityType and entityId are required'), 'Validation error');
            }

            const actorInfo = getActor(req);
            const fileRecord = await FileUploadS.uploadFile(file, entityType, entityId, uploadType, actorInfo);

            // Log audit
            await auditLogger({
                tableName: 'file_uploads',
                recordId: fileRecord.id,
                action: 'CREATE',
                actor: actorInfo,
                newData: fileRecord,
                req
            });

            return sendSuccess(res, fileRecord, 'File uploaded successfully', 201);
        } catch (error) {
            logger.error('Error in upload file controller', { error: error.message, stack: error.stack });
            return sendError(res, error, 'Failed to upload file');
        }
    },

    uploadMultipleFiles: async (req, res) => {
        try {
            const files = req.files;
            if (!files || files.length === 0) {
                return sendError(res, new Error('No files uploaded'), 'No files provided');
            }

            const { entityType, entityId, uploadType } = req.body;
            if (!entityType || !entityId) {
                return sendError(res, new Error('entityType and entityId are required'), 'Validation error');
            }

            const actorInfo = getActor(req);
            const fileRecords = [];

            for (const file of files) {
                try {
                    const fileRecord = await FileUploadS.uploadFile(file, entityType, entityId, uploadType, actorInfo);
                    fileRecords.push(fileRecord);
                } catch (fileError) {
                    logger.error('Error uploading individual file', { error: fileError.message, filename: file.originalname });
                    // Continue with other files
                }
            }

            if (fileRecords.length === 0) {
                return sendError(res, new Error('Failed to upload any files'), 'Upload failed');
            }

            return sendSuccess(res, fileRecords, `${fileRecords.length} file(s) uploaded successfully`, 201);
        } catch (error) {
            logger.error('Error in upload multiple files controller', { error: error.message });
            return sendError(res, error, 'Failed to upload files');
        }
    },

    getFilesByEntity: async (req, res) => {
        try {
            const { entityType, entityId } = req.params;
            const files = await FileUploadS.getFilesByEntity(entityType, entityId);
            return sendSuccess(res, files, 'Files fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch files');
        }
    },

    getPrimaryFile: async (req, res) => {
        try {
            const { entityType, entityId } = req.params;
            const file = await FileUploadS.getPrimaryFile(entityType, entityId);
            if (!file) {
                return sendSuccess(res, null, 'No primary file found');
            }
            return sendSuccess(res, file, 'Primary file fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch primary file');
        }
    },

    getFileById: async (req, res) => {
        try {
            const file = await FileUploadS.getFileById(req.params.id);
            return sendSuccess(res, file, 'File fetched successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to fetch file');
        }
    },

    setPrimaryFile: async (req, res) => {
        try {
            const { id } = req.params;
            const { entityType, entityId } = req.body;

            if (!entityType || !entityId) {
                return sendError(res, new Error('entityType and entityId are required'), 'Validation error');
            }

            const actorInfo = getActor(req);
            const oldFile = await FileUploadS.getFileById(id);
            const file = await FileUploadS.setPrimaryFile(id, entityType, entityId);

            // Log audit
            await auditLogger({
                tableName: 'file_uploads',
                recordId: file.id,
                action: 'UPDATE',
                actor: actorInfo,
                oldData: oldFile,
                newData: file,
                req
            });

            return sendSuccess(res, file, 'Primary file set successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to set primary file');
        }
    },

    deleteFile: async (req, res) => {
        try {
            const actorInfo = getActor(req);
            const oldFile = await FileUploadS.getFileById(req.params.id);
            const file = await FileUploadS.deleteFile(req.params.id);

            // Log audit
            await auditLogger({
                tableName: 'file_uploads',
                recordId: req.params.id,
                action: 'DELETE',
                actor: actorInfo,
                oldData: oldFile,
                req
            });

            return sendSuccess(res, file, 'File deleted successfully');
        } catch (error) {
            return sendError(res, error, 'Failed to delete file');
        }
    }
};

module.exports = FileUploadC;

