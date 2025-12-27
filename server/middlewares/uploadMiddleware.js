const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default
// Support all common image formats
const ALLOWED_IMAGE_TYPES = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp,bmp,svg,ico,tiff,tif,heic,heif,avif,jfif,jp2,jpx').split(',').map(t => t.trim());
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const entityType = req.body.entityType || req.query.entityType || 'general';
        const uploadPath = path.join(UPLOAD_DIR, entityType);
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
});

// File filter for images
const imageFilter = (req, file, cb) => {
    // Accept if MIME type starts with 'image/' (supports all image formats)
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
        return;
    }
    
    // Also check extension as fallback
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (ALLOWED_IMAGE_TYPES.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')} or any image/* MIME type`), false);
    }
};

// File filter for all files (more permissive)
const fileFilter = (req, file, cb) => {
    // Allow all file types, but log warnings for potentially dangerous types
    const ext = path.extname(file.originalname).toLowerCase();
    const dangerousTypes = ['.exe', '.bat', '.sh', '.js', '.php'];
    
    if (dangerousTypes.some(dt => ext.includes(dt))) {
        logger.warn('Potentially dangerous file type uploaded', {
            filename: file.originalname,
            mimetype: file.mimetype,
            ext
        });
    }
    
    cb(null, true);
};

// Multer instances
const uploadImage = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: imageFilter
});

const uploadFile = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE * 10 // 50MB for general files
    },
    fileFilter: fileFilter
});

// Middleware functions
const uploadSingleImage = uploadImage.single('file');
const uploadMultipleImages = uploadImage.array('files', 10);
const uploadSingleFile = uploadFile.single('file');
const uploadMultipleFiles = uploadFile.array('files', 10);

// Error handler middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                error: err.message
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files',
                error: err.message
            });
        }
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }
    
    next();
};

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    uploadSingleFile,
    uploadMultipleFiles,
    handleUploadError,
    MAX_FILE_SIZE,
    ALLOWED_IMAGE_TYPES
};

