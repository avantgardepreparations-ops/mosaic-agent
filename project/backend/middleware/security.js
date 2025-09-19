const path = require('path');

// File type whitelist - only allow these file types
const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Text and code files
  'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/xml',
  'application/javascript', 'application/json', 'application/xml',
  // Code files by extension (will be checked separately)
  'application/octet-stream' // For files without proper MIME detection
];

// File extensions whitelist
const ALLOWED_EXTENSIONS = [
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  // Text and code
  '.txt', '.md', '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
  '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config',
  // Programming languages
  '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
  '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
  // Data and config
  '.csv', '.tsv', '.sql', '.log', '.env'
];

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Command whitelist for terminal
const ALLOWED_COMMANDS = [
  'ls', 'pwd', 'cat', 'git', 'npm', 'node', 'python', 'python3',
  'echo', 'whoami', 'date', 'which', 'whereis', 'head', 'tail',
  'grep', 'find', 'wc', 'sort', 'uniq', 'cut', 'awk', 'sed',
  'curl', 'wget', 'ping', 'ps', 'top', 'free', 'df', 'du',
  'mkdir', 'touch', 'cp', 'mv', 'ln', 'tree', 'file', 'stat'
];

// Dangerous command patterns to block
const BLOCKED_COMMAND_PATTERNS = [
  /rm\s+-rf/, /rm\s+-fr/, /rm\s+--recursive\s+--force/,
  /sudo/, /su\s/, /chmod\s+777/, /chmod\s+-R\s+777/,
  /dd\s+if=/, /mkfs/, /fdisk/, /parted/,
  /shutdown/, /reboot/, /halt/, /poweroff/,
  /kill\s+-9/, /killall/, /pkill/,
  /\>\s*\/dev\/null/, /\>\s*\/dev\/zero/,
  /eval\s/, /exec\s/, /system\s*\(/,
  /;\s*rm/, /\|\s*rm/, /&&\s*rm/,
  /\/etc\/passwd/, /\/etc\/shadow/, /\/etc\/sudoers/
];

/**
 * Security middleware for general request validation
 */
const securityMiddleware = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Rate limiting headers (basic implementation)
  res.setHeader('X-RateLimit-Limit', '1000');
  res.setHeader('X-RateLimit-Remaining', '999');
  
  next();
};

/**
 * Validate file type and size
 */
const validateFile = (file) => {
  const errors = [];
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`File extension ${ext} is not allowed`);
  }
  
  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    // Special case for code files that might not have proper MIME type
    if (file.mimetype === 'application/octet-stream' && ALLOWED_EXTENSIONS.includes(ext)) {
      // Allow it if extension is whitelisted
    } else {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }
  }
  
  return errors;
};

/**
 * Validate terminal command
 */
const validateCommand = (command) => {
  const errors = [];
  const cleanCommand = command.trim().toLowerCase();
  
  // Check for blocked patterns first
  for (const pattern of BLOCKED_COMMAND_PATTERNS) {
    if (pattern.test(cleanCommand)) {
      errors.push(`Command contains blocked pattern: ${pattern.source}`);
      return errors; // Return immediately for security
    }
  }
  
  // Extract the base command (first word)
  const baseCommand = cleanCommand.split(/\s+/)[0];
  
  // Check if base command is in whitelist
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    errors.push(`Command '${baseCommand}' is not in the allowed list`);
  }
  
  // Additional safety checks
  if (cleanCommand.includes('..')) {
    errors.push('Command cannot contain path traversal (..)');
  }
  
  if (cleanCommand.includes('$(') || cleanCommand.includes('`')) {
    errors.push('Command cannot contain command substitution');
  }
  
  return errors;
};

/**
 * Sanitize file path to prevent directory traversal
 */
const sanitizePath = (inputPath) => {
  if (!inputPath) return '';
  
  // Remove any .. sequences and normalize
  const normalizedPath = path.normalize(inputPath);
  
  // Ensure path doesn't start with / or contain ..
  const safePath = normalizedPath.replace(/^\/+/, '').replace(/\.\./g, '');
  
  return safePath;
};

module.exports = {
  securityMiddleware,
  validateFile,
  validateCommand,
  sanitizePath,
  ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  ALLOWED_COMMANDS
};