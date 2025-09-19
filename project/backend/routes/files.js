const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const { uploadMultiple } = require('../middleware/upload');
const { sanitizePath } = require('../middleware/security');
const FileService = require('../services/fileService');

const router = express.Router();

/**
 * POST /api/files/upload
 * Upload files with multipart/form-data
 */
router.post('/upload', uploadMultiple('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    const uploadPath = sanitizePath(req.body.path || '');
    const results = [];

    for (const file of req.files) {
      try {
        // Save file metadata to database
        const fileRecord = await FileService.saveFileMetadata({
          originalName: file.originalname,
          filename: file.filename,
          path: path.join(uploadPath, file.filename),
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });

        results.push({
          id: fileRecord.id,
          originalName: file.originalname,
          filename: file.filename,
          path: path.join(uploadPath, file.filename),
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: fileRecord.uploadedAt
        });
      } catch (error) {
        console.error('Error saving file metadata:', error);
        // Continue with other files even if one fails
        results.push({
          error: `Failed to process ${file.originalname}: ${error.message}`
        });
      }
    }

    res.json({
      message: `Successfully uploaded ${results.length} file(s)`,
      files: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * GET /api/files
 * List files and directories
 * Query params: path, recursive
 */
router.get('/', async (req, res) => {
  try {
    const requestPath = sanitizePath(req.query.path || '');
    const recursive = req.query.recursive === 'true';
    
    const files = await FileService.listFiles(requestPath, recursive);
    
    res.json({
      path: requestPath,
      files: files
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    });
  }
});

/**
 * GET /api/files/:id
 * Get file metadata by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    if (isNaN(fileId)) {
      return res.status(400).json({
        error: 'Invalid file ID',
        message: 'File ID must be a number'
      });
    }
    
    const file = await FileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: `File with ID ${fileId} does not exist`
      });
    }
    
    res.json(file);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      error: 'Failed to get file',
      message: error.message
    });
  }
});

/**
 * GET /api/files/:id/download
 * Download file by ID
 */
router.get('/:id/download', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    if (isNaN(fileId)) {
      return res.status(400).json({
        error: 'Invalid file ID',
        message: 'File ID must be a number'
      });
    }
    
    const file = await FileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: `File with ID ${fileId} does not exist`
      });
    }
    
    const filePath = path.join(__dirname, '../uploads', file.path);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        error: 'File not found on disk',
        message: 'The file exists in database but not on disk'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype || mime.lookup(file.originalName) || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to read file',
          message: error.message
        });
      }
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: error.message
    });
  }
});

/**
 * PUT /api/files/move
 * Move/rename files
 * Body: { from, to }
 */
router.put('/move', async (req, res) => {
  try {
    const { from, to } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Both "from" and "to" paths are required'
      });
    }
    
    const sanitizedFrom = sanitizePath(from);
    const sanitizedTo = sanitizePath(to);
    
    if (!sanitizedFrom || !sanitizedTo) {
      return res.status(400).json({
        error: 'Invalid paths',
        message: 'Paths cannot be empty or contain invalid characters'
      });
    }
    
    const result = await FileService.moveFile(sanitizedFrom, sanitizedTo);
    
    res.json({
      message: 'File moved successfully',
      from: sanitizedFrom,
      to: sanitizedTo,
      file: result
    });
  } catch (error) {
    console.error('Move file error:', error);
    res.status(500).json({
      error: 'Failed to move file',
      message: error.message
    });
  }
});

/**
 * DELETE /api/files/:id
 * Delete file by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    if (isNaN(fileId)) {
      return res.status(400).json({
        error: 'Invalid file ID',
        message: 'File ID must be a number'
      });
    }
    
    const result = await FileService.deleteFile(fileId);
    
    if (!result) {
      return res.status(404).json({
        error: 'File not found',
        message: `File with ID ${fileId} does not exist`
      });
    }
    
    res.json({
      message: 'File deleted successfully',
      id: fileId
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

/**
 * GET /api/files/:id/preview
 * Get file preview (for images and text files)
 */
router.get('/:id/preview', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    if (isNaN(fileId)) {
      return res.status(400).json({
        error: 'Invalid file ID',
        message: 'File ID must be a number'
      });
    }
    
    const file = await FileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: `File with ID ${fileId} does not exist`
      });
    }
    
    const filePath = path.join(__dirname, '../uploads', file.path);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        error: 'File not found on disk',
        message: 'The file exists in database but not on disk'
      });
    }
    
    // For images, serve directly
    if (file.mimetype.startsWith('image/')) {
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const fileStream = fs.createReadStream(filePath);
      return fileStream.pipe(res);
    }
    
    // For text files, return content with syntax highlighting info
    if (file.mimetype.startsWith('text/') || 
        ['.js', '.jsx', '.ts', '.tsx', '.py', '.css', '.html', '.json', '.md'].some(ext => 
          file.originalName.endsWith(ext))) {
      
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(file.originalName).toLowerCase();
      
      res.json({
        type: 'text',
        content: content,
        extension: extension,
        language: getLanguageFromExtension(extension),
        size: file.size,
        lines: content.split('\n').length
      });
      return;
    }
    
    // For other files, return metadata only
    res.json({
      type: 'binary',
      message: 'Preview not available for this file type',
      mimetype: file.mimetype,
      size: file.size,
      downloadUrl: `/api/files/${fileId}/download`
    });
    
  } catch (error) {
    console.error('Preview file error:', error);
    res.status(500).json({
      error: 'Failed to preview file',
      message: error.message
    });
  }
});

/**
 * Helper function to get language from file extension
 */
function getLanguageFromExtension(ext) {
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.css': 'css',
    '.html': 'html',
    '.htm': 'html',
    '.json': 'json',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash'
  };
  
  return languageMap[ext] || 'text';
}

module.exports = router;