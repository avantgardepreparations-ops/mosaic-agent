/**
 * File Routes - Handle file operations with security validation
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = req.body.path || '/uploads';
        const fullPath = path.join(process.cwd(), 'data', uploadPath);
        
        try {
            await fs.mkdir(fullPath, { recursive: true });
            cb(null, fullPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, sanitized);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files per upload
    },
    fileFilter: (req, file, cb) => {
        // Basic file type validation
        const allowedTypes = [
            'text/plain',
            'text/javascript',
            'text/html',
            'text/css',
            'application/json',
            'image/png',
            'image/jpeg',
            'image/gif',
            'application/pdf'
        ];
        
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(py|js|html|css|md|txt|json|png|jpg|jpeg|gif|pdf)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Security middleware for path validation
const validatePath = (req, res, next) => {
    const requestedPath = req.query.path || req.body.path || '/';
    
    // Prevent directory traversal
    if (requestedPath.includes('..') || requestedPath.includes('~')) {
        return res.status(400).json({ error: 'Invalid path: directory traversal not allowed' });
    }
    
    // Ensure path starts with /
    req.safePath = requestedPath.startsWith('/') ? requestedPath : '/' + requestedPath;
    next();
};

// GET /api/files - List files in directory
router.get('/', validatePath, async (req, res) => {
    try {
        const fullPath = path.join(process.cwd(), 'data', req.safePath);
        
        // Check if path exists
        try {
            await fs.access(fullPath);
        } catch (error) {
            return res.status(404).json({ error: 'Directory not found' });
        }
        
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is not a directory' });
        }
        
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        const files = [];
        
        for (const item of items) {
            try {
                const itemPath = path.join(fullPath, item.name);
                const itemStats = await fs.stat(itemPath);
                
                files.push({
                    name: item.name,
                    type: item.isDirectory() ? 'directory' : 'file',
                    size: item.isFile() ? itemStats.size : 0,
                    modified: itemStats.mtime,
                    path: path.join(req.safePath, item.name),
                    permissions: {
                        readable: true,
                        writable: true,
                        executable: item.isDirectory()
                    }
                });
            } catch (error) {
                console.warn(`Error reading file ${item.name}:`, error.message);
            }
        }
        
        // Sort files: directories first, then by name
        files.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
        res.json({
            path: req.safePath,
            files,
            total: files.length
        });
        
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files: ' + error.message });
    }
});

// POST /api/files/upload - Upload files
router.post('/upload', validatePath, upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: path.relative(process.cwd(), file.path)
        }));
        
        res.json({
            success: true,
            uploadedFiles,
            message: `Successfully uploaded ${uploadedFiles.length} file(s)`
        });
        
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload files: ' + error.message });
    }
});

// GET /api/files/content - Get file content
router.get('/content', validatePath, async (req, res) => {
    try {
        const fullPath = path.join(process.cwd(), 'data', req.safePath);
        
        // Check if file exists
        try {
            await fs.access(fullPath);
        } catch (error) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) {
            return res.status(400).json({ error: 'Path is not a file' });
        }
        
        // Check file size (limit to 5MB for content viewing)
        if (stats.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'File too large for content viewing' });
        }
        
        // Determine content type
        const ext = path.extname(req.safePath).toLowerCase();
        const textExtensions = ['.txt', '.md', '.js', '.py', '.html', '.css', '.json', '.yaml', '.yml'];
        
        if (textExtensions.includes(ext)) {
            const content = await fs.readFile(fullPath, 'utf8');
            res.type('text/plain').send(content);
        } else {
            // For binary files, send as download
            res.sendFile(fullPath);
        }
        
    } catch (error) {
        console.error('Error reading file content:', error);
        res.status(500).json({ error: 'Failed to read file: ' + error.message });
    }
});

module.exports = router;