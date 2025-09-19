const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { validateCommand } = require('../middleware/security');

class TerminalService {
  constructor(websocket = null) {
    this.ws = websocket;
    this.commandHistory = [];
    this.currentProcess = null;
    this.workingDirectory = process.cwd();
    this.environmentVars = { ...process.env };
    this.sessionId = this.generateSessionId();
    
    console.log(`🖥️  New terminal session created: ${this.sessionId}`);
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'term_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Execute a command in a sandboxed environment
   */
  static async executeCommand(command, workingDir = './') {
    const startTime = Date.now();
    
    try {
      // Validate command first
      const validationErrors = validateCommand(command);
      if (validationErrors.length > 0) {
        throw new Error(`Command validation failed: ${validationErrors.join(', ')}`);
      }

      // Ensure working directory exists and is safe
      const safeWorkingDir = path.resolve(workingDir);
      if (!await fs.pathExists(safeWorkingDir)) {
        throw new Error('Working directory does not exist');
      }

      return new Promise((resolve, reject) => {
        // Parse command and arguments
        const args = command.trim().split(/\s+/);
        const cmd = args.shift();
        
        const child = spawn(cmd, args, {
          cwd: safeWorkingDir,
          env: {
            ...process.env,
            // Limit environment for security
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            USER: process.env.USER,
            SHELL: '/bin/sh', // Force safe shell
            TERM: 'xterm-256color'
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 30000, // 30 second timeout
          detached: false
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          const executionTime = Date.now() - startTime;
          
          // Add to command history
          TerminalService.addToHistory({
            command,
            workingDir: safeWorkingDir,
            output: stdout,
            error: stderr,
            exitCode: code,
            executionTime,
            timestamp: new Date().toISOString()
          });

          resolve({
            output: stdout,
            error: stderr,
            exitCode: code,
            executionTime,
            success: code === 0
          });
        });

        child.on('error', (error) => {
          const executionTime = Date.now() - startTime;
          
          TerminalService.addToHistory({
            command,
            workingDir: safeWorkingDir,
            output: '',
            error: error.message,
            exitCode: -1,
            executionTime,
            timestamp: new Date().toISOString()
          });

          reject(new Error(`Command execution failed: ${error.message}`));
        });

        // Kill process if it runs too long
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGTERM');
            setTimeout(() => {
              if (!child.killed) {
                child.kill('SIGKILL');
              }
            }, 5000);
          }
        }, 30000);
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      TerminalService.addToHistory({
        command,
        workingDir,
        output: '',
        error: error.message,
        exitCode: -1,
        executionTime,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Handle WebSocket messages for interactive terminal
   */
  handleMessage(data) {
    try {
      const { type, payload } = data;

      switch (type) {
        case 'command':
          this.executeInteractiveCommand(payload.command, payload.workingDir);
          break;
        
        case 'input':
          this.sendInput(payload.input);
          break;
        
        case 'resize':
          this.resizeTerminal(payload.cols, payload.rows);
          break;
        
        case 'kill':
          this.killCurrentProcess();
          break;
        
        case 'history':
          this.sendHistory(payload.limit);
          break;
        
        default:
          this.sendError(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Terminal message handling error:', error);
      this.sendError(error.message);
    }
  }

  /**
   * Execute command in interactive mode (WebSocket)
   */
  async executeInteractiveCommand(command, workingDir) {
    try {
      // Validate command
      const validationErrors = validateCommand(command);
      if (validationErrors.length > 0) {
        this.sendError(`Command not allowed: ${validationErrors.join(', ')}`);
        return;
      }

      // Update working directory if provided
      if (workingDir) {
        this.workingDirectory = path.resolve(workingDir);
      }

      this.sendMessage({
        type: 'command_start',
        command,
        workingDir: this.workingDirectory,
        timestamp: new Date().toISOString()
      });

      // Execute command
      const result = await TerminalService.executeCommand(command, this.workingDirectory);

      this.sendMessage({
        type: 'command_complete',
        command,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.sendError(error.message);
    }
  }

  /**
   * Send input to current process
   */
  sendInput(input) {
    if (this.currentProcess && !this.currentProcess.killed) {
      this.currentProcess.stdin.write(input);
    } else {
      this.sendError('No active process to send input to');
    }
  }

  /**
   * Resize terminal (for PTY integration)
   */
  resizeTerminal(cols, rows) {
    this.sendMessage({
      type: 'resize_ack',
      cols,
      rows,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Kill current process
   */
  killCurrentProcess() {
    if (this.currentProcess && !this.currentProcess.killed) {
      this.currentProcess.kill('SIGTERM');
      setTimeout(() => {
        if (this.currentProcess && !this.currentProcess.killed) {
          this.currentProcess.kill('SIGKILL');
        }
      }, 5000);

      this.sendMessage({
        type: 'process_killed',
        timestamp: new Date().toISOString()
      });
    } else {
      this.sendError('No active process to kill');
    }
  }

  /**
   * Send command history via WebSocket
   */
  sendHistory(limit = 50) {
    const history = TerminalService.getCommandHistory(limit);
    this.sendMessage({
      type: 'history',
      history,
      total: history.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(data) {
    if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send error message via WebSocket
   */
  sendError(message) {
    this.sendMessage({
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.currentProcess && !this.currentProcess.killed) {
      this.currentProcess.kill('SIGTERM');
    }
    console.log(`🖥️  Terminal session closed: ${this.sessionId}`);
  }

  // Static methods for command history management
  static commandHistory = [];

  static addToHistory(entry) {
    this.commandHistory.push(entry);
    
    // Keep only last 1000 commands
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory.slice(-1000);
    }
  }

  static getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit);
  }

  static clearCommandHistory() {
    this.commandHistory = [];
  }

  /**
   * Get available commands with descriptions
   */
  static getAvailableCommands() {
    const { ALLOWED_COMMANDS } = require('../middleware/security');
    
    const commandDescriptions = {
      'ls': 'List directory contents',
      'pwd': 'Print working directory',
      'cat': 'Display file contents',
      'git': 'Git version control',
      'npm': 'Node package manager',
      'node': 'Node.js runtime',
      'python': 'Python interpreter',
      'python3': 'Python 3 interpreter',
      'echo': 'Display text',
      'whoami': 'Print current user',
      'date': 'Display current date and time',
      'which': 'Locate command',
      'whereis': 'Locate binary, source, and manual page',
      'head': 'Display first lines of file',
      'tail': 'Display last lines of file',
      'grep': 'Search text patterns',
      'find': 'Search for files and directories',
      'wc': 'Word, line, character, and byte count',
      'sort': 'Sort lines of text',
      'uniq': 'Report or omit repeated lines',
      'cut': 'Extract columns from text',
      'awk': 'Text processing tool',
      'sed': 'Stream editor',
      'curl': 'Transfer data from servers',
      'wget': 'Download files',
      'ping': 'Test network connectivity',
      'ps': 'List running processes',
      'top': 'Display running processes',
      'free': 'Display memory usage',
      'df': 'Display filesystem disk usage',
      'du': 'Display directory space usage',
      'mkdir': 'Create directories',
      'touch': 'Create empty files or update timestamps',
      'cp': 'Copy files or directories',
      'mv': 'Move/rename files or directories',
      'ln': 'Create links',
      'tree': 'Display directory structure',
      'file': 'Determine file type',
      'stat': 'Display file or filesystem status'
    };

    return ALLOWED_COMMANDS.map(cmd => ({
      command: cmd,
      description: commandDescriptions[cmd] || 'No description available'
    }));
  }
}

module.exports = TerminalService;