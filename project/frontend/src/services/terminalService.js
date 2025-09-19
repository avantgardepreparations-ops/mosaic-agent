class TerminalService {
  constructor() {
    this.baseURL = '/api/terminal';
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Terminal service request failed:', error);
      throw error;
    }
  }

  async executeCommand(command, workingDir = './') {
    return this.makeRequest(`${this.baseURL}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        command,
        workingDir
      })
    });
  }

  async getHistory(limit = 50) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const url = `${this.baseURL}/history?${params.toString()}`;
    return this.makeRequest(url);
  }

  async clearHistory() {
    return this.makeRequest(`${this.baseURL}/clear-history`, {
      method: 'POST'
    });
  }

  async getWorkingDirectory() {
    return this.makeRequest(`${this.baseURL}/working-directory`);
  }

  async getCommands() {
    const result = await this.makeRequest(`${this.baseURL}/commands`);
    return result.allowedCommands || [];
  }

  async validateCommand(command) {
    return this.makeRequest(`${this.baseURL}/validate-command`, {
      method: 'POST',
      body: JSON.stringify({ command })
    });
  }

  async getEnvironment() {
    return this.makeRequest(`${this.baseURL}/environment`);
  }

  // Command validation helpers
  isCommandAllowed(command) {
    const allowedCommands = [
      'ls', 'pwd', 'cat', 'git', 'npm', 'node', 'python', 'python3',
      'echo', 'whoami', 'date', 'which', 'whereis', 'head', 'tail',
      'grep', 'find', 'wc', 'sort', 'uniq', 'cut', 'awk', 'sed',
      'curl', 'wget', 'ping', 'ps', 'top', 'free', 'df', 'du',
      'mkdir', 'touch', 'cp', 'mv', 'ln', 'tree', 'file', 'stat'
    ];

    const baseCommand = command.trim().split(/\s+/)[0];
    return allowedCommands.includes(baseCommand);
  }

  isDangerousCommand(command) {
    const dangerousPatterns = [
      /rm\s+-rf/, /rm\s+-fr/, /rm\s+--recursive\s+--force/,
      /sudo/, /su\s/, /chmod\s+777/, /chmod\s+-R\s+777/,
      /dd\s+if=/, /mkfs/, /fdisk/, /parted/,
      /shutdown/, /reboot/, /halt/, /poweroff/,
      /kill\s+-9/, /killall/, /pkill/,
      /eval\s/, /exec\s/, /system\s*\(/,
      /;\s*rm/, /\|\s*rm/, /&&\s*rm/,
      /\/etc\/passwd/, /\/etc\/shadow/, /\/etc\/sudoers/
    ];

    return dangerousPatterns.some(pattern => pattern.test(command.toLowerCase()));
  }

  // Command history management
  getLocalHistory() {
    try {
      const history = localStorage.getItem('terminal_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to load local history:', error);
      return [];
    }
  }

  saveToLocalHistory(command) {
    try {
      const history = this.getLocalHistory();
      const newEntry = {
        command,
        timestamp: new Date().toISOString(),
        local: true
      };
      
      const updatedHistory = [...history, newEntry].slice(-100); // Keep last 100
      localStorage.setItem('terminal_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save to local history:', error);
    }
  }

  clearLocalHistory() {
    try {
      localStorage.removeItem('terminal_history');
    } catch (error) {
      console.error('Failed to clear local history:', error);
    }
  }

  // Command suggestions and autocompletion
  getSuggestions(partialCommand) {
    const commands = [
      { command: 'ls', description: 'List directory contents' },
      { command: 'pwd', description: 'Print working directory' },
      { command: 'cat', description: 'Display file contents' },
      { command: 'git status', description: 'Show git repository status' },
      { command: 'git log', description: 'Show git commit history' },
      { command: 'npm list', description: 'List installed packages' },
      { command: 'npm install', description: 'Install package' },
      { command: 'node --version', description: 'Show Node.js version' },
      { command: 'python --version', description: 'Show Python version' },
      { command: 'echo "hello"', description: 'Print text' },
      { command: 'whoami', description: 'Print current user' },
      { command: 'date', description: 'Show current date and time' },
      { command: 'find . -name "*.js"', description: 'Find JavaScript files' },
      { command: 'grep -r "text" .', description: 'Search for text in files' },
      { command: 'head -n 10 file.txt', description: 'Show first 10 lines' },
      { command: 'tail -n 10 file.txt', description: 'Show last 10 lines' },
      { command: 'mkdir folder', description: 'Create directory' },
      { command: 'touch file.txt', description: 'Create empty file' },
      { command: 'cp source dest', description: 'Copy file' },
      { command: 'mv source dest', description: 'Move/rename file' }
    ];

    if (!partialCommand) {
      return commands.slice(0, 10); // Return top 10 if no input
    }

    return commands.filter(cmd => 
      cmd.command.toLowerCase().startsWith(partialCommand.toLowerCase())
    );
  }

  // Platform detection
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return {
        platform: 'android',
        isTermux: userAgent.includes('termux'),
        isMobile: true
      };
    } else if (userAgent.includes('mac')) {
      return {
        platform: 'darwin',
        isTermux: false,
        isMobile: false
      };
    } else if (userAgent.includes('linux')) {
      return {
        platform: 'linux',
        isTermux: false,
        isMobile: false
      };
    } else if (userAgent.includes('win')) {
      return {
        platform: 'win32',
        isTermux: false,
        isMobile: false
      };
    }
    
    return {
      platform: 'unknown',
      isTermux: false,
      isMobile: false
    };
  }

  // Format helpers
  formatExecutionTime(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  // WebSocket helpers
  createWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${this.baseURL}/connect`;
  }

  // Command parsing
  parseCommand(command) {
    const parts = command.trim().split(/\s+/);
    return {
      command: parts[0],
      args: parts.slice(1),
      full: command.trim()
    };
  }

  // Safety checks
  isSafeCommand(command) {
    if (this.isDangerousCommand(command)) {
      return false;
    }
    
    if (!this.isCommandAllowed(command)) {
      return false;
    }
    
    // Check for path traversal
    if (command.includes('..')) {
      return false;
    }
    
    // Check for command injection
    if (command.includes('$(') || command.includes('`') || command.includes(';')) {
      return false;
    }
    
    return true;
  }
}

// Create singleton instance
export const terminalService = new TerminalService();