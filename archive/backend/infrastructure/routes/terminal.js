/**
 * Terminal Routes - Handle terminal operations and WebSocket connections
 */

const express = require('express');
const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');
const router = express.Router();

// Store active terminal sessions
const terminalSessions = new Map();

// Command validation for security
const validateCommand = (command) => {
    const blockedCommands = [
        'rm -rf /',
        'dd if=',
        'mkfs.',
        'format',
        'fdisk',
        ':(){ :|:& };:', // Fork bomb
        'sudo rm',
        'chmod 777 /',
        'wget',
        'curl.*\\|.*sh', // Dangerous pipe to shell
        'nc.*-e', // Netcat with execute
        'python.*-c.*exec', // Python exec
        'eval'
    ];
    
    const cmd = command.toLowerCase().trim();
    return !blockedCommands.some(blocked => {
        const regex = new RegExp(blocked, 'i');
        return regex.test(cmd);
    });
};

// Rate limiting per session
const rateLimits = new Map();
const MAX_COMMANDS_PER_MINUTE = 30;

const checkRateLimit = (sessionId) => {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!rateLimits.has(sessionId)) {
        rateLimits.set(sessionId, []);
    }
    
    const sessionCommands = rateLimits.get(sessionId);
    
    // Remove old commands outside the window
    const recentCommands = sessionCommands.filter(timestamp => timestamp > windowStart);
    rateLimits.set(sessionId, recentCommands);
    
    if (recentCommands.length >= MAX_COMMANDS_PER_MINUTE) {
        return false;
    }
    
    // Add current command
    recentCommands.push(now);
    return true;
};

// WebSocket handler for terminal connections
const handleTerminalWebSocket = (ws, req) => {
    const sessionId = req.params.sessionId;
    console.log(`Terminal WebSocket connected: ${sessionId}`);
    
    // Initialize session
    const session = {
        id: sessionId,
        ws,
        workingDirectory: process.cwd(),
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
        activeProcess: null,
        environment: {
            ...process.env,
            TERM: 'xterm-256color',
            COLUMNS: '80',
            LINES: '24'
        }
    };
    
    terminalSessions.set(sessionId, session);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'output',
        payload: {
            data: `Welcome to Mosaic Agent Terminal (Session: ${sessionId})\\n`,
            stream: 'stdout'
        }
    }));
    
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            await handleTerminalMessage(session, message);
        } catch (error) {
            console.error('Error handling terminal message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Invalid message format' }
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`Terminal WebSocket disconnected: ${sessionId}`);
        
        // Kill any running process
        if (session.activeProcess) {
            try {
                session.activeProcess.kill('SIGTERM');
            } catch (error) {
                console.warn('Error killing process:', error);
            }
        }
        
        terminalSessions.delete(sessionId);
        rateLimits.delete(sessionId);
    });
    
    ws.on('error', (error) => {
        console.error(`Terminal WebSocket error (${sessionId}):`, error);
    });
};

const handleTerminalMessage = async (session, message) => {
    const { type, command, signal, workingDirectory } = message;
    
    switch (type) {
        case 'init':
            if (workingDirectory) {
                session.workingDirectory = workingDirectory;
            }
            session.ws.send(JSON.stringify({
                type: 'directory_change',
                payload: { directory: session.workingDirectory }
            }));
            break;
            
        case 'command':
            await executeCommand(session, command);
            break;
            
        case 'kill':
            killActiveProcess(session, signal || 'SIGTERM');
            break;
            
        case 'resize':
            if (message.cols && message.rows) {
                session.environment.COLUMNS = message.cols.toString();
                session.environment.LINES = message.rows.toString();
            }
            break;
            
        default:
            session.ws.send(JSON.stringify({
                type: 'error',
                payload: { message: `Unknown message type: ${type}` }
            }));
    }
};

const executeCommand = async (session, command) => {
    if (!command || typeof command !== 'string') {
        return;
    }
    
    // Check rate limit
    if (!checkRateLimit(session.id)) {
        session.ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Rate limit exceeded. Please wait before sending more commands.' }
        }));
        return;
    }
    
    // Validate command
    if (!validateCommand(command)) {
        session.ws.send(JSON.stringify({
            type: 'output',
            payload: {
                data: `[BLOCKED] Command blocked by security policy: ${command}\\n`,
                stream: 'stderr'
            }
        }));
        return;
    }
    
    // Handle built-in commands
    const trimmedCommand = command.trim();
    
    if (trimmedCommand.startsWith('cd ')) {
        await handleChangeDirectory(session, trimmedCommand.substring(3).trim());
        return;
    }
    
    if (trimmedCommand === 'pwd') {
        session.ws.send(JSON.stringify({
            type: 'output',
            payload: {
                data: `${session.workingDirectory}\\n`,
                stream: 'stdout'
            }
        }));
        return;
    }
    
    if (trimmedCommand === 'clear') {
        session.ws.send(JSON.stringify({
            type: 'clear'
        }));
        return;
    }
    
    // Execute external command
    try {
        const childProcess = spawn(session.shell, ['-c', command], {
            cwd: session.workingDirectory,
            env: session.environment,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        session.activeProcess = childProcess;
        
        session.ws.send(JSON.stringify({
            type: 'command_start',
            payload: { pid: childProcess.pid }
        }));
        
        childProcess.stdout.on('data', (data) => {
            session.ws.send(JSON.stringify({
                type: 'output',
                payload: {
                    data: data.toString(),
                    stream: 'stdout'
                }
            }));
        });
        
        childProcess.stderr.on('data', (data) => {
            session.ws.send(JSON.stringify({
                type: 'output',
                payload: {
                    data: data.toString(),
                    stream: 'stderr'
                }
            }));
        });
        
        childProcess.on('close', (code, signal) => {
            session.activeProcess = null;
            
            session.ws.send(JSON.stringify({
                type: 'command_complete',
                payload: { 
                    exitCode: code,
                    signal: signal
                }
            }));
            
            if (code !== 0) {
                session.ws.send(JSON.stringify({
                    type: 'output',
                    payload: {
                        data: `Process exited with code ${code}\\n`,
                        stream: 'stderr'
                    }
                }));
            }
        });
        
        childProcess.on('error', (error) => {
            session.activeProcess = null;
            
            session.ws.send(JSON.stringify({
                type: 'error',
                payload: { message: `Command execution error: ${error.message}` }
            }));
        });
        
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            payload: { message: `Failed to execute command: ${error.message}` }
        }));
    }
};

const handleChangeDirectory = async (session, targetDir) => {
    try {
        let newDir;
        
        if (targetDir === '~' || targetDir === '') {
            newDir = os.homedir();
        } else if (path.isAbsolute(targetDir)) {
            newDir = targetDir;
        } else {
            newDir = path.resolve(session.workingDirectory, targetDir);
        }
        
        // Verify directory exists
        const fs = require('fs').promises;
        const stats = await fs.stat(newDir);
        
        if (!stats.isDirectory()) {
            session.ws.send(JSON.stringify({
                type: 'output',
                payload: {
                    data: `cd: not a directory: ${targetDir}\\n`,
                    stream: 'stderr'
                }
            }));
            return;
        }
        
        session.workingDirectory = newDir;
        
        session.ws.send(JSON.stringify({
            type: 'directory_change',
            payload: { directory: newDir }
        }));
        
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'output',
            payload: {
                data: `cd: ${error.message}\\n`,
                stream: 'stderr'
            }
        }));
    }
};

const killActiveProcess = (session, signal = 'SIGTERM') => {
    if (session.activeProcess) {
        try {
            session.activeProcess.kill(signal);
            session.ws.send(JSON.stringify({
                type: 'output',
                payload: {
                    data: `Process killed with signal ${signal}\\n`,
                    stream: 'stdout'
                }
            }));
        } catch (error) {
            session.ws.send(JSON.stringify({
                type: 'error',
                payload: { message: `Failed to kill process: ${error.message}` }
            }));
        }
    } else {
        session.ws.send(JSON.stringify({
            type: 'output',
            payload: {
                data: 'No active process to kill\\n',
                stream: 'stdout'
            }
        }));
    }
};

// REST API endpoints

// POST /api/terminal/execute - Execute single command (non-interactive)
router.post('/execute', async (req, res) => {
    try {
        const { command, workingDirectory = process.cwd() } = req.body;
        
        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }
        
        if (!validateCommand(command)) {
            return res.status(400).json({ error: 'Command blocked by security policy' });
        }
        
        const childProcess = spawn('/bin/bash', ['-c', command], {
            cwd: workingDirectory,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        childProcess.on('close', (code) => {
            res.json({
                command,
                exitCode: code,
                stdout,
                stderr,
                workingDirectory
            });
        });
        
        childProcess.on('error', (error) => {
            res.status(500).json({
                error: 'Command execution failed',
                message: error.message
            });
        });
        
    } catch (error) {
        console.error('Error executing command:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/terminal/system - Get system information
router.get('/system', (req, res) => {
    res.json({
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        memory: {
            total: os.totalmem(),
            free: os.freemem()
        },
        cpus: os.cpus().length,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
        activeSessions: terminalSessions.size
    });
});

// GET /api/terminal/:sessionId/history - Get terminal history
router.get('/:sessionId/history', (req, res) => {
    const { sessionId } = req.params;
    const session = terminalSessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Terminal session not found' });
    }
    
    res.json({
        sessionId,
        workingDirectory: session.workingDirectory,
        hasActiveProcess: !!session.activeProcess
    });
});

// POST /api/terminal/:sessionId/kill - Kill process in session
router.post('/:sessionId/kill', (req, res) => {
    const { sessionId } = req.params;
    const { signal = 'SIGTERM' } = req.body;
    
    const session = terminalSessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Terminal session not found' });
    }
    
    killActiveProcess(session, signal);
    
    res.json({
        success: true,
        message: `Kill signal ${signal} sent to session ${sessionId}`
    });
});

module.exports = { router, handleTerminalWebSocket };