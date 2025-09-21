/**
 * Mosaic Agent Infrastructure Server
 * Integrates file management, terminal, agents, and security
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

// Import routes
const filesRouter = require('./routes/files');
const agentsRouter = require('./routes/agents');
const { router: terminalRouter, handleTerminalWebSocket } = require('./routes/terminal');

// Import middleware
const {
    rateLimiters,
    securityHeaders,
    corsMiddleware,
    requestLogger,
    errorHandler,
    auditLog
} = require('./middleware/security');

// Import security services
const { getSandboxManager } = require('../../security/sandbox/DockerSandbox');
const { getValidator } = require('../../security/validation/CommandValidator');

class MosaicAgentServer {
    constructor(config = {}) {
        this.config = {
            port: process.env.PORT || 8000,
            host: process.env.HOST || '0.0.0.0',
            enableSandbox: process.env.ENABLE_SANDBOX === 'true',
            staticPath: path.join(__dirname, '../../frontend'),
            dataPath: path.join(__dirname, '../../data'),
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.wss = null;
        this.sandboxManager = null;
        this.validator = null;
        
        this.setupExpress();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupSecurity();
    }
    
    setupExpress() {
        // Trust proxy for accurate IP addresses
        this.app.set('trust proxy', 1);
        
        // Security headers
        this.app.use(securityHeaders);
        
        // CORS
        this.app.use(corsMiddleware);
        
        // Request logging
        this.app.use(requestLogger);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Rate limiting
        this.app.use('/api/files/upload', rateLimiters.upload);
        this.app.use('/api/terminal', rateLimiters.terminal);
        this.app.use('/api/orchestrator', rateLimiters.agents);
        this.app.use('/api', rateLimiters.general);
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                services: {
                    sandbox: this.sandboxManager ? 'enabled' : 'disabled',
                    websocket: this.wss ? 'running' : 'stopped'
                }
            });
        });
        
        // API routes
        this.app.use('/api/files', auditLog('file_operation'), filesRouter);
        this.app.use('/api/terminal', auditLog('terminal_operation'), terminalRouter);
        this.app.use('/api/orchestrator', auditLog('agent_operation'), agentsRouter);
        
        // Security API routes
        this.setupSecurityRoutes();
        
        // Serve static files (frontend)
        if (this.config.staticPath) {
            this.app.use(express.static(this.config.staticPath));
            
            // Serve frontend for any non-API routes
            this.app.get('*', (req, res) => {
                if (!req.path.startsWith('/api/')) {
                    res.sendFile(path.join(this.config.staticPath, 'index.html'));
                } else {
                    res.status(404).json({ error: 'API endpoint not found' });
                }
            });
        }
        
        // Error handling middleware (must be last)
        this.app.use(errorHandler);
    }
    
    setupSecurityRoutes() {
        const securityRouter = express.Router();
        
        // Command validation endpoint
        securityRouter.post('/validate-command', (req, res) => {
            try {
                const { command } = req.body;
                if (!command) {
                    return res.status(400).json({ error: 'Command is required' });
                }
                
                const validator = getValidator();
                const result = validator.validateCommand({ command });
                
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Validation error: ' + error.message });
            }
        });
        
        // Sandbox management endpoints
        if (this.config.enableSandbox) {
            securityRouter.get('/sandbox/status', (req, res) => {
                try {
                    const sandboxes = this.sandboxManager.listActiveSandboxes();
                    res.json({
                        enabled: true,
                        activeSandboxes: sandboxes.length,
                        sandboxes
                    });
                } catch (error) {
                    res.status(500).json({ error: 'Failed to get sandbox status' });
                }
            });
            
            securityRouter.post('/sandbox/create', async (req, res) => {
                try {
                    const taskConfig = req.body;
                    const sandbox = await this.sandboxManager.createSandbox(taskConfig);
                    
                    res.json({
                        success: true,
                        sandboxId: sandbox.id,
                        status: sandbox.status
                    });
                } catch (error) {
                    res.status(500).json({ error: 'Failed to create sandbox: ' + error.message });
                }
            });
            
            securityRouter.delete('/sandbox/:sandboxId', async (req, res) => {
                try {
                    const { sandboxId } = req.params;
                    const success = await this.sandboxManager.destroySandbox(sandboxId);
                    
                    if (success) {
                        res.json({ success: true, message: 'Sandbox destroyed' });
                    } else {
                        res.status(404).json({ error: 'Sandbox not found' });
                    }
                } catch (error) {
                    res.status(500).json({ error: 'Failed to destroy sandbox: ' + error.message });
                }
            });
        } else {
            securityRouter.get('/sandbox/status', (req, res) => {
                res.json({ enabled: false, message: 'Sandbox disabled' });
            });
        }
        
        // Security policies endpoint
        securityRouter.get('/policies', (req, res) => {
            res.json({
                commandValidation: true,
                rateLimiting: true,
                fileTypeValidation: true,
                pathTraversalProtection: true,
                sandboxEnabled: this.config.enableSandbox,
                policies: {
                    maxFileSize: '10MB',
                    maxCommandLength: 1000,
                    allowedFileTypes: ['.txt', '.md', '.js', '.py', '.html', '.css', '.json', '.png', '.jpg', '.pdf'],
                    blockedCommands: ['rm -rf /', 'dd if=', 'mkfs.', 'fdisk'],
                    rateLimits: {
                        general: '100 requests per 15 minutes',
                        upload: '10 uploads per 5 minutes',
                        terminal: '30 commands per minute',
                        agents: '50 operations per 10 minutes'
                    }
                }
            });
        });
        
        this.app.use('/api/security', securityRouter);
    }
    
    setupWebSocket() {
        this.server = http.createServer(this.app);
        
        this.wss = new WebSocket.Server({
            server: this.server,
            path: '/api/terminal'
        });
        
        this.wss.on('connection', (ws, req) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathParts = url.pathname.split('/');
            
            // Extract session ID from path: /api/terminal/{sessionId}
            if (pathParts.length >= 4 && pathParts[2] === 'terminal') {
                const sessionId = pathParts[3];
                req.params = { sessionId };
                handleTerminalWebSocket(ws, req);
            } else {
                ws.close(1000, 'Invalid WebSocket path');
            }
        });
        
        console.log('WebSocket server configured for terminal sessions');
    }
    
    setupSecurity() {
        // Initialize security components
        this.validator = getValidator({
            maxCommandLength: 1000,
            strictMode: false, // Allow common commands
            allowedCommands: [], // Empty means allow all except blocked
            blockedCommands: ['rm -rf /', 'dd if=', 'mkfs.', 'fdisk', 'format']
        });
        
        if (this.config.enableSandbox) {
            this.sandboxManager = getSandboxManager({
                baseImage: 'node:18-alpine',
                networkMode: 'none',
                memoryLimit: '256m',
                cpuLimit: '0.5',
                timeout: 300000
            });
            
            // Check Docker availability
            this.sandboxManager.checkDockerAvailability().then(available => {
                if (available) {
                    console.log('Docker sandbox enabled and available');
                } else {
                    console.warn('Docker not available - sandbox features disabled');
                    this.config.enableSandbox = false;
                }
            });
        }
        
        console.log('Security systems initialized');
    }
    
    async start() {
        try {
            // Ensure data directory exists
            const fs = require('fs').promises;
            await fs.mkdir(this.config.dataPath, { recursive: true });
            
            // Start server
            this.server.listen(this.config.port, this.config.host, () => {
                console.log('🚀 Mosaic Agent Infrastructure Server Started');
                console.log('=' .repeat(50));
                console.log(`📋 Server: http://${this.config.host}:${this.config.port}`);
                console.log(`📋 Health: http://${this.config.host}:${this.config.port}/health`);
                console.log(`📋 Static Files: ${this.config.staticPath || 'disabled'}`);
                console.log(`📋 Data Directory: ${this.config.dataPath}`);
                console.log(`📋 Sandbox: ${this.config.enableSandbox ? 'enabled' : 'disabled'}`);
                console.log('');
                console.log('🔐 Security Features:');
                console.log('  ✅ Rate limiting enabled');
                console.log('  ✅ Command validation enabled');
                console.log('  ✅ Path traversal protection');
                console.log('  ✅ File type validation');
                console.log('  ✅ Security headers applied');
                console.log('  ✅ Request logging enabled');
                console.log('');
                console.log('🛠️  Infrastructure Components:');
                console.log('  ✅ File Manager API');
                console.log('  ✅ Terminal WebSocket API');
                console.log('  ✅ Agent Orchestrator API');
                console.log('  ✅ Security Validation API');
                console.log('');
                console.log('✅ Server ready for connections');
            });
            
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    
    async stop() {
        console.log('Shutting down Mosaic Agent Infrastructure Server...');
        
        try {
            // Close WebSocket server
            if (this.wss) {
                this.wss.close();
            }
            
            // Shutdown sandbox manager
            if (this.sandboxManager) {
                await this.sandboxManager.shutdown();
            }
            
            // Close HTTP server
            if (this.server) {
                await new Promise((resolve, reject) => {
                    this.server.close((error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
            }
            
            console.log('Server shutdown completed');
            
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Create and start server if this file is run directly
if (require.main === module) {
    const server = new MosaicAgentServer({
        enableSandbox: process.env.ENABLE_SANDBOX === 'true'
    });
    
    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    
    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    
    server.start();
}

module.exports = MosaicAgentServer;