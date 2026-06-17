const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_TYPES } = require('../config/constants');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = uploadDir;
    
    // Determine subfolder based on route
    if (req.path.includes('gallery')) {
      folder = path.join(uploadDir, 'gallery');
    } else if (req.path.includes('orders') || req.path.includes('upload')) {
      folder = path.join(uploadDir, 'orders');
    } else {
      folder = path.join(uploadDir, 'general');
    }
    
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = FILE_TYPES.ALLOWED;
  const maxSize = FILE_TYPES.MAX_SIZE;
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only images, PDF, and AI files are allowed.'), false);
  }
  
  // Check file size (multer also handles this)
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_TYPES.MAX_SIZE,
    files: 5 // Max 5 files per upload
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${FILE_TYPES.MAX_SIZE / (1024 * 1024)} MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 files per upload.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

module.exports = { upload, handleUploadError };