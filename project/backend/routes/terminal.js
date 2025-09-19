const express = require('express');
const { validateCommand, sanitizePath } = require('../middleware/security');
const TerminalService = require('../services/terminalService');

const router = express.Router();

/**
 * POST /api/terminal/execute
 * Execute a command in a safe environment
 * Body: { command, workingDir }
 */
router.post('/execute', async (req, res) => {
  try {
    const { command, workingDir } = req.body;
    
    if (!command) {
      return res.status(400).json({
        error: 'Missing command',
        message: 'Command is required'
      });
    }
    
    // Validate command for security
    const validationErrors = validateCommand(command);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Command not allowed',
        message: validationErrors.join(', '),
        command: command
      });
    }
    
    // Sanitize working directory
    let sanitizedWorkingDir = './';
    if (workingDir) {
      sanitizedWorkingDir = sanitizePath(workingDir);
      if (!sanitizedWorkingDir) {
        sanitizedWorkingDir = './';
      }
    }
    
    // Execute command using terminal service
    const result = await TerminalService.executeCommand(command, sanitizedWorkingDir);
    
    res.json({
      success: true,
      command: command,
      workingDir: sanitizedWorkingDir,
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Terminal execute error:', error);
    res.status(500).json({
      error: 'Command execution failed',
      message: error.message,
      command: req.body.command
    });
  }
});

/**
 * GET /api/terminal/history
 * Get command history for the session
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = TerminalService.getCommandHistory(limit);
    
    res.json({
      history: history,
      total: history.length
    });
  } catch (error) {
    console.error('Terminal history error:', error);
    res.status(500).json({
      error: 'Failed to get command history',
      message: error.message
    });
  }
});

/**
 * POST /api/terminal/clear-history
 * Clear command history
 */
router.post('/clear-history', (req, res) => {
  try {
    TerminalService.clearCommandHistory();
    
    res.json({
      success: true,
      message: 'Command history cleared'
    });
  } catch (error) {
    console.error('Terminal clear history error:', error);
    res.status(500).json({
      error: 'Failed to clear command history',
      message: error.message
    });
  }
});

/**
 * GET /api/terminal/working-directory
 * Get current working directory
 */
router.get('/working-directory', (req, res) => {
  try {
    const cwd = process.cwd();
    
    res.json({
      workingDirectory: cwd,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Terminal working directory error:', error);
    res.status(500).json({
      error: 'Failed to get working directory',
      message: error.message
    });
  }
});

/**
 * GET /api/terminal/commands
 * Get list of allowed commands
 */
router.get('/commands', (req, res) => {
  try {
    const { ALLOWED_COMMANDS } = require('../middleware/security');
    
    res.json({
      allowedCommands: ALLOWED_COMMANDS,
      total: ALLOWED_COMMANDS.length,
      message: 'Commands are filtered for security. Dangerous commands are blocked.'
    });
  } catch (error) {
    console.error('Terminal commands error:', error);
    res.status(500).json({
      error: 'Failed to get allowed commands',
      message: error.message
    });
  }
});

/**
 * GET /api/terminal/environment
 * Get safe environment variables
 */
router.get('/environment', (req, res) => {
  try {
    // Only return safe environment variables
    const safeEnvVars = {
      NODE_VERSION: process.version,
      PLATFORM: process.platform,
      ARCH: process.arch,
      USER: process.env.USER || 'unknown',
      HOME: process.env.HOME || 'unknown',
      SHELL: process.env.SHELL || 'unknown',
      PATH: process.env.PATH ? 'defined' : 'undefined',
      TERM: process.env.TERM || 'unknown'
    };
    
    res.json({
      environment: safeEnvVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Terminal environment error:', error);
    res.status(500).json({
      error: 'Failed to get environment',
      message: error.message
    });
  }
});

/**
 * POST /api/terminal/validate-command
 * Validate a command without executing it
 */
router.post('/validate-command', (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        error: 'Missing command',
        message: 'Command is required'
      });
    }
    
    const validationErrors = validateCommand(command);
    
    res.json({
      command: command,
      valid: validationErrors.length === 0,
      errors: validationErrors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Terminal validate command error:', error);
    res.status(500).json({
      error: 'Failed to validate command',
      message: error.message
    });
  }
});

module.exports = router;