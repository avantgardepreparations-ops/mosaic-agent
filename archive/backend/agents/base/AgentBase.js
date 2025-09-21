/**
 * AgentBase.js - Base class for all Mosaic Agent components
 * Provides common functionality for agent communication, state management, and security
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class AgentBase extends EventEmitter {
    constructor(agentId, config = {}) {
        super();
        
        this.agentId = agentId || this.generateId();
        this.config = {
            timeout: 30000,
            maxRetries: 3,
            encryptCommunication: true,
            sandboxed: true,
            ...config
        };
        
        this.state = 'initialized';
        this.tasks = new Map();
        this.communicationKey = this.generateKey();
        this.startTime = Date.now();
        
        this.setupEventHandlers();
    }
    
    generateId() {
        return `agent_${crypto.randomUUID()}`;
    }
    
    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    setupEventHandlers() {
        this.on('error', this.handleError.bind(this));
        this.on('task:start', this.handleTaskStart.bind(this));
        this.on('task:complete', this.handleTaskComplete.bind(this));
        this.on('task:error', this.handleTaskError.bind(this));
    }
    
    async initialize() {
        this.state = 'initializing';
        
        try {
            await this.validateSeparation();
            await this.setupSecurity();
            this.state = 'ready';
            this.emit('initialized', this.agentId);
            return true;
        } catch (error) {
            this.state = 'error';
            this.emit('error', error);
            return false;
        }
    }
    
    async validateSeparation() {
        // Ensure no MOSAICMIND integration as per separation requirements
        const blockedTerms = ['mosaicmind', 'MOSAICMIND', 'MosaicMind'];
        const checkResult = blockedTerms.every(term => 
            !JSON.stringify(this.config).toLowerCase().includes(term.toLowerCase())
        );
        
        if (!checkResult) {
            throw new Error('SECURITY VIOLATION: MOSAICMIND integration detected - separation required');
        }
    }
    
    async setupSecurity() {
        if (this.config.sandboxed) {
            this.securityContext = {
                sandboxId: this.generateId(),
                allowedCommands: [],
                rateLimits: {
                    commandsPerMinute: 30,
                    maxFileSize: 10485760, // 10MB
                    maxFiles: 100
                },
                encryptionEnabled: this.config.encryptCommunication
            };
        }
    }
    
    async executeTask(taskId, taskData, options = {}) {
        if (this.state !== 'ready') {
            throw new Error(`Agent ${this.agentId} not ready. Current state: ${this.state}`);
        }
        
        const task = {
            id: taskId,
            data: taskData,
            startTime: Date.now(),
            status: 'running',
            options: {
                timeout: this.config.timeout,
                ...options
            }
        };
        
        this.tasks.set(taskId, task);
        this.emit('task:start', task);
        
        try {
            const result = await this.processTask(task);
            task.status = 'completed';
            task.endTime = Date.now();
            task.result = result;
            
            this.emit('task:complete', task);
            return result;
        } catch (error) {
            task.status = 'error';
            task.endTime = Date.now();
            task.error = error;
            
            this.emit('task:error', task);
            throw error;
        } finally {
            // Clean up completed tasks after 1 hour
            setTimeout(() => {
                this.tasks.delete(taskId);
            }, 3600000);
        }
    }
    
    async processTask(task) {
        // Base implementation - to be overridden by specific agents
        throw new Error('processTask must be implemented by subclass');
    }
    
    encryptMessage(message) {
        if (!this.config.encryptCommunication) return message;
        
        const cipher = crypto.createCipher('aes-256-cbc', this.communicationKey);
        let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decryptMessage(encryptedMessage) {
        if (!this.config.encryptCommunication) return encryptedMessage;
        
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', this.communicationKey);
            let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error('Failed to decrypt message: ' + error.message);
        }
    }
    
    sendMessage(targetAgentId, message, encrypted = true) {
        const messageData = {
            from: this.agentId,
            to: targetAgentId,
            timestamp: Date.now(),
            data: encrypted ? this.encryptMessage(message) : message,
            encrypted
        };
        
        this.emit('message:send', messageData);
        return messageData;
    }
    
    getStatus() {
        return {
            agentId: this.agentId,
            state: this.state,
            uptime: Date.now() - this.startTime,
            activeTasks: this.tasks.size,
            lastActivity: this.lastActivity,
            securityContext: this.securityContext
        };
    }
    
    // Event handlers
    handleError(error) {
        console.error(`Agent ${this.agentId} error:`, error);
        this.lastActivity = Date.now();
    }
    
    handleTaskStart(task) {
        console.log(`Agent ${this.agentId} started task: ${task.id}`);
        this.lastActivity = Date.now();
    }
    
    handleTaskComplete(task) {
        console.log(`Agent ${this.agentId} completed task: ${task.id} in ${task.endTime - task.startTime}ms`);
        this.lastActivity = Date.now();
    }
    
    handleTaskError(task) {
        console.error(`Agent ${this.agentId} task error: ${task.id}`, task.error);
        this.lastActivity = Date.now();
    }
    
    async shutdown() {
        this.state = 'shutting_down';
        
        // Cancel all running tasks
        for (const [taskId, task] of this.tasks) {
            if (task.status === 'running') {
                task.status = 'cancelled';
                task.endTime = Date.now();
            }
        }
        
        this.removeAllListeners();
        this.state = 'shutdown';
        
        console.log(`Agent ${this.agentId} shutdown completed`);
    }
}

module.exports = AgentBase;