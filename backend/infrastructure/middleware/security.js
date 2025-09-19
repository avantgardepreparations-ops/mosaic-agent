/**
 * Security Middleware - Handles authentication, rate limiting, and validation
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Rate limit exceeded',
                message,
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimiters = {
    // General API rate limit
    general: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        100, // limit each IP to 100 requests per windowMs
        'Too many requests from this IP, please try again later'
    ),
    
    // File upload rate limit
    upload: createRateLimiter(
        5 * 60 * 1000, // 5 minutes
        10, // limit each IP to 10 uploads per 5 minutes
        'Too many file uploads, please try again later'
    ),
    
    // Terminal command rate limit
    terminal: createRateLimiter(
        1 * 60 * 1000, // 1 minute
        30, // limit each IP to 30 commands per minute
        'Too many terminal commands, please slow down'
    ),
    
    // Agent operation rate limit
    agents: createRateLimiter(
        10 * 60 * 1000, // 10 minutes
        50, // limit each IP to 50 agent operations per 10 minutes
        'Too many agent operations, please try again later'
    )
};

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
});

// Input validation middleware
const validateInput = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(d => d.message)
            });
        }
        next();
    };
};

// Path traversal protection
const sanitizePath = (inputPath) => {
    if (!inputPath || typeof inputPath !== 'string') {
        return '/';
    }
    
    // Remove dangerous characters and sequences
    let sanitized = inputPath
        .replace(/\\.\\./g, '') // Remove ../
        .replace(/~+/g, '') // Remove tildes
        .replace(/\\0/g, '') // Remove null bytes
        .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
        .trim();
    
    // Ensure path starts with /
    if (!sanitized.startsWith('/')) {
        sanitized = '/' + sanitized;
    }
    
    // Normalize path
    const path = require('path');
    return path.posix.normalize(sanitized);
};

// Command validation for terminal security
const validateCommand = (command) => {
    if (!command || typeof command !== 'string') {
        return { valid: false, reason: 'Invalid command format' };
    }
    
    const cmd = command.trim().toLowerCase();
    
    // Blocked commands for security
    const blockedPatterns = [
        /rm\s+-rf\s+\//, // rm -rf /
        /dd\s+if=/, // Disk operations
        /mkfs\./, // Format filesystem
        /fdisk/, // Disk partitioning
        /:\(\)\{\s*:\|\:&\s*\};\:/, // Fork bomb
        /sudo\s+rm/, // Sudo rm operations
        /chmod\s+777\s+\//, // Dangerous permissions
        /wget.*\|.*sh/, // Download and execute
        /curl.*\|.*sh/, // Download and execute
        /nc.*-e/, // Netcat with execute
        /python.*-c.*exec/, // Python exec
        /eval\s*\(/, // Code evaluation
        /\$\(.*\)/, // Command substitution (partial)
        /`.*`/, // Backtick execution
        /;\s*rm/, // Command chaining with rm
        /&\s*rm/, // Background rm
        /\|\s*rm/, // Piped rm
    ];
    
    for (const pattern of blockedPatterns) {
        if (pattern.test(cmd)) {
            return { valid: false, reason: 'Command blocked by security policy' };
        }
    }
    
    // Additional validation for specific commands
    if (cmd.includes('rm ') && (cmd.includes(' -r') || cmd.includes(' -f'))) {
        // Allow rm but be careful with recursive/force flags
        if (cmd.match(/rm\s+.*(-rf|-fr|--recursive.*--force|--force.*--recursive)/)) {
            return { valid: false, reason: 'Recursive force deletion not allowed' };
        }
    }
    
    // Block network operations that could be used maliciously
    const networkCommands = ['nc', 'netcat', 'telnet', 'ssh', 'scp', 'rsync'];
    if (networkCommands.some(netCmd => cmd.includes(netCmd))) {
        return { valid: false, reason: 'Network commands are restricted' };
    }
    
    return { valid: true };
};

// File type validation
const validateFileType = (filename, allowedExtensions = []) => {
    if (!filename || typeof filename !== 'string') {
        return { valid: false, reason: 'Invalid filename' };
    }
    
    const ext = require('path').extname(filename).toLowerCase();
    
    // Default allowed extensions if none specified
    const defaultAllowed = [
        '.txt', '.md', '.js', '.py', '.html', '.css', '.json', '.yaml', '.yml',
        '.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.gz'
    ];
    
    const allowed = allowedExtensions.length > 0 ? allowedExtensions : defaultAllowed;
    
    if (!allowed.includes(ext)) {
        return { valid: false, reason: `File type ${ext} not allowed` };
    }
    
    // Additional checks for executable files
    const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.sh'];
    if (executableExtensions.includes(ext)) {
        return { valid: false, reason: 'Executable files not allowed' };
    }
    
    return { valid: true };
};

// Authentication middleware (basic implementation)
const authenticate = (req, res, next) => {
    // Skip authentication for demo/development
    if (process.env.NODE_ENV === 'development') {
        req.user = { id: 'demo_user', role: 'user' };
        return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        // In production, implement proper JWT validation
        // For now, accept any non-empty token
        if (token.length > 0) {
            req.user = { id: 'authenticated_user', role: 'user' };
            next();
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

// CORS middleware with security considerations
const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8000'
    ];
    
    if (process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(body) {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        
        // Log potentially dangerous requests
        if (req.method === 'POST' && req.originalUrl.includes('terminal')) {
            console.log(`Terminal command: ${JSON.stringify(req.body.command)}`);
        }
        
        originalSend.call(this, body);
    };
    
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large',
            message: 'The uploaded file exceeds the maximum allowed size'
        });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            error: 'Too many files',
            message: 'Too many files uploaded at once'
        });
    }
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON'
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: isDevelopment ? err.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: err.stack })
    });
};

// Audit logging for sensitive operations
const auditLog = (operation) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(body) {
            // Log successful sensitive operations
            if (res.statusCode < 400) {
                console.log(`AUDIT: ${operation} - User: ${req.user?.id || 'unknown'} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
            }
            
            originalSend.call(this, body);
        };
        
        next();
    };
};

module.exports = {
    rateLimiters,
    securityHeaders,
    validateInput,
    sanitizePath,
    validateCommand,
    validateFileType,
    authenticate,
    corsMiddleware,
    requestLogger,
    errorHandler,
    auditLog
};