const express = require('express');
const router = express.Router();
const FileUploadC = require('../controllers/fileUploadC');
const { uploadSingleImage, uploadMultipleImages, uploadSingleFile, uploadMultipleFiles, handleUploadError } = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Upload single image
router.post('/upload/image', roleMiddleware(['admin', 'staff']), uploadSingleImage, handleUploadError, FileUploadC.uploadFile);

// Upload multiple images
router.post('/upload/images', roleMiddleware(['admin', 'staff']), uploadMultipleImages, handleUploadError, FileUploadC.uploadMultipleFiles);

// Upload single file
router.post('/upload/file', roleMiddleware(['admin', 'staff']), uploadSingleFile, handleUploadError, FileUploadC.uploadFile);

// Upload multiple files
router.post('/upload/files', roleMiddleware(['admin', 'staff']), uploadMultipleFiles, handleUploadError, FileUploadC.uploadMultipleFiles);

// Get files by entity
router.get('/entity/:entityType/:entityId', FileUploadC.getFilesByEntity);

// Get primary file for entity
router.get('/entity/:entityType/:entityId/primary', FileUploadC.getPrimaryFile);

// Get file by ID
router.get('/:id', FileUploadC.getFileById);

// Set primary file
router.put('/:id/primary', roleMiddleware(['admin', 'staff']), FileUploadC.setPrimaryFile);

// Delete file
router.delete('/:id', roleMiddleware(['admin', 'staff']), FileUploadC.deleteFile);

module.exports = router;

