const os = require('os');
const fs = require('fs');
const path = require('path');

class PlatformUtils {
  /**
   * Detect the current platform and environment
   */
  static detectPlatform() {
    const platform = os.platform();
    const arch = os.arch();
    const isTermux = this.isTermuxEnvironment();
    
    return {
      platform,
      arch,
      isTermux,
      isAndroid: platform === 'android' || isTermux,
      isMacOS: platform === 'darwin',
      isLinux: platform === 'linux',
      isWindows: platform === 'win32',
      nodeVersion: process.version,
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      hostname: os.hostname()
    };
  }

  /**
   * Check if running in Termux environment
   */
  static isTermuxEnvironment() {
    try {
      // Check for Termux-specific paths
      const termuxPaths = [
        '/data/data/com.termux',
        process.env.PREFIX && process.env.PREFIX.includes('com.termux')
      ];
      
      return termuxPaths.some(p => p && fs.existsSync(p));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get platform-specific configuration
   */
  static getPlatformConfig() {
    const info = this.detectPlatform();
    
    const config = {
      // Base configuration
      maxFileSize: 50 * 1024 * 1024, // 50MB
      commandTimeout: 30000, // 30 seconds
      maxConcurrentCommands: 3,
      
      // Platform-specific adjustments
      terminalShell: '/bin/sh',
      pythonCommand: 'python3',
      nodeCommand: 'node',
      npmCommand: 'npm'
    };

    if (info.isTermux) {
      // Termux-specific configuration
      config.terminalShell = process.env.SHELL || '/data/data/com.termux/files/usr/bin/bash';
      config.pythonCommand = 'python';
      config.maxFileSize = 25 * 1024 * 1024; // Reduce for mobile
      config.commandTimeout = 20000; // Shorter timeout for mobile
      config.maxConcurrentCommands = 2;
    } else if (info.isMacOS) {
      // macOS-specific configuration
      config.terminalShell = process.env.SHELL || '/bin/zsh';
      config.pythonCommand = 'python3';
    } else if (info.isLinux) {
      // Linux-specific configuration
      config.terminalShell = process.env.SHELL || '/bin/bash';
      config.pythonCommand = 'python3';
    } else if (info.isWindows) {
      // Windows-specific configuration
      config.terminalShell = 'cmd.exe';
      config.pythonCommand = 'python';
      config.nodeCommand = 'node.exe';
      config.npmCommand = 'npm.cmd';
    }

    return { ...info, config };
  }

  /**
   * Get safe environment variables for the platform
   */
  static getSafeEnvironment() {
    const info = this.detectPlatform();
    const baseEnv = {
      NODE_VERSION: process.version,
      PLATFORM: info.platform,
      ARCH: info.arch,
      PATH: process.env.PATH
    };

    if (info.isTermux) {
      return {
        ...baseEnv,
        PREFIX: process.env.PREFIX || '/data/data/com.termux/files/usr',
        HOME: process.env.HOME || '/data/data/com.termux/files/home',
        TMPDIR: process.env.TMPDIR || '/data/data/com.termux/files/usr/tmp',
        SHELL: process.env.SHELL || '/data/data/com.termux/files/usr/bin/bash',
        TERM: 'xterm-256color'
      };
    } else {
      return {
        ...baseEnv,
        HOME: process.env.HOME || os.homedir(),
        USER: process.env.USER || os.userInfo().username,
        SHELL: process.env.SHELL || '/bin/sh',
        TERM: process.env.TERM || 'xterm-256color',
        TMPDIR: process.env.TMPDIR || os.tmpdir()
      };
    }
  }

  /**
   * Get platform-specific allowed commands
   */
  static getPlatformCommands() {
    const info = this.detectPlatform();
    
    // Base commands available on most platforms
    const baseCommands = [
      'echo', 'cat', 'pwd', 'ls', 'find', 'grep',
      'head', 'tail', 'wc', 'sort', 'uniq', 'cut',
      'node', 'npm', 'git'
    ];

    // Platform-specific commands
    const platformCommands = {
      termux: [
        ...baseCommands,
        'python', 'python3', 'pip', 'pip3',
        'pkg', 'apt', 'termux-info', 'termux-setup-storage',
        'curl', 'wget', 'ping', 'ssh', 'scp'
      ],
      darwin: [
        ...baseCommands,
        'python3', 'pip3', 'brew', 'which', 'whereis',
        'curl', 'wget', 'ping', 'ssh', 'scp', 'rsync',
        'ps', 'top', 'free', 'df', 'du', 'stat',
        'mkdir', 'touch', 'cp', 'mv', 'ln', 'tree'
      ],
      linux: [
        ...baseCommands,
        'python3', 'pip3', 'apt', 'yum', 'dnf', 'which', 'whereis',
        'curl', 'wget', 'ping', 'ssh', 'scp', 'rsync',
        'ps', 'top', 'free', 'df', 'du', 'stat',
        'mkdir', 'touch', 'cp', 'mv', 'ln', 'tree'
      ],
      win32: [
        'echo', 'dir', 'type', 'find', 'findstr',
        'node', 'npm', 'git', 'python', 'pip',
        'curl', 'ping', 'mkdir', 'copy', 'move', 'del'
      ]
    };

    if (info.isTermux) {
      return platformCommands.termux;
    } else {
      return platformCommands[info.platform] || baseCommands;
    }
  }

  /**
   * Validate if a path is safe for the platform
   */
  static isPathSafe(inputPath) {
    const info = this.detectPlatform();
    const normalizedPath = path.normalize(inputPath);
    
    // Common unsafe patterns
    const unsafePatterns = [
      /\.\./,  // Directory traversal
      /^\/etc/, // System configs (Unix)
      /^\/proc/, // Process info (Linux)
      /^\/sys/, // System info (Linux)
      /^\/dev/, // Device files (Unix)
      /^C:\\Windows/i, // Windows system (Windows)
      /^C:\\Program Files/i // Program files (Windows)
    ];

    if (unsafePatterns.some(pattern => pattern.test(normalizedPath))) {
      return false;
    }

    // Platform-specific safe paths
    if (info.isTermux) {
      const safePrefixes = [
        process.env.HOME || '/data/data/com.termux/files/home',
        process.env.PREFIX || '/data/data/com.termux/files/usr',
        '/storage/emulated/0' // Android external storage
      ];
      
      return safePrefixes.some(prefix => normalizedPath.startsWith(prefix));
    }

    // For other platforms, allow relative paths and user home
    const userHome = os.homedir();
    return normalizedPath.startsWith('./') || 
           normalizedPath.startsWith(userHome) ||
           !path.isAbsolute(normalizedPath);
  }

  /**
   * Get resource limits for the platform
   */
  static getResourceLimits() {
    const info = this.detectPlatform();
    const totalMemoryMB = Math.floor(info.totalMemory / 1024 / 1024);
    
    let limits = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxConcurrentUploads: 5,
      maxConcurrentCommands: 3,
      commandTimeout: 30000,
      maxCommandHistory: 1000
    };

    // Adjust for limited resources
    if (info.isTermux || totalMemoryMB < 2048) {
      limits = {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxConcurrentUploads: 2,
        maxConcurrentCommands: 2,
        commandTimeout: 20000,
        maxCommandHistory: 500
      };
    }

    // Adjust for very low memory devices
    if (totalMemoryMB < 1024) {
      limits = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxConcurrentUploads: 1,
        maxConcurrentCommands: 1,
        commandTimeout: 15000,
        maxCommandHistory: 200
      };
    }

    return limits;
  }
}

module.exports = PlatformUtils;