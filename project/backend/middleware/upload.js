const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { validateFile, sanitizePath, MAX_FILE_SIZE } = require('./security');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get path from request, sanitize it
    const relativePath = sanitizePath(req.body.path || '');
    const fullPath = path.join(uploadsDir, relativePath);
    
    // Ensure directory exists
    fs.ensureDirSync(fullPath);
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Check if file already exists and append number if needed
    let finalName = sanitizedName;
    let counter = 1;
    const baseName = path.parse(sanitizedName).name;
    const ext = path.parse(sanitizedName).ext;
    
    const relativePath = sanitizePath(req.body.path || '');
    const fullPath = path.join(uploadsDir, relativePath);
    
    while (fs.existsSync(path.join(fullPath, finalName))) {
      finalName = `${baseName}_${counter}${ext}`;
      counter++;
    }
    
    cb(null, finalName);
  }
});

// File filter for security validation
const fileFilter = (req, file, cb) => {
  const errors = validateFile(file);
  
  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.code = 'INVALID_FILE';
    return cb(error, false);
  }
  
  cb(null, true);
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per upload
    fields: 5, // Maximum 5 non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024 // Maximum field value size (1MB)
  }
});

// Middleware for handling upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'Upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files per upload';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart data';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in form data';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      default:
        message = err.message;
    }
    
    return res.status(400).json({
      error: 'Upload failed',
      message: message,
      code: err.code
    });
  }
  
  if (err && err.code === 'INVALID_FILE') {
    return res.status(400).json({
      error: 'Invalid file',
      message: err.message
    });
  }
  
  next(err);
};

// Single file upload middleware
const uploadSingle = (fieldName = 'file') => {
  return [upload.single(fieldName), handleUploadErrors];
};

// Multiple files upload middleware
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return [upload.array(fieldName, maxCount), handleUploadErrors];
};

// Fields upload middleware (mixed form data)
const uploadFields = (fields) => {
  return [upload.fields(fields), handleUploadErrors];
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadErrors
};