/**
 * API Services for Frontend Components
 * Handles communication with backend infrastructure
 */

import axios from 'axios';

// Configure axios with default settings
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// File Management API
export const fileService = {
    // List files in directory
    async listFiles(path = '/') {
        const response = await api.get('/api/files', {
            params: { path }
        });
        return response.data;
    },

    // Upload files
    async uploadFiles(files, path = '/') {
        const formData = new FormData();
        
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('path', path);

        const response = await api.post('/api/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                // Emit progress event for UI updates
                window.dispatchEvent(new CustomEvent('upload-progress', {
                    detail: { progress }
                }));
            }
        });
        return response.data;
    },

    // Get file content
    async getFileContent(filePath) {
        const response = await api.get('/api/files/content', {
            params: { path: filePath },
            responseType: 'text'
        });
        return response.data;
    },

    // Delete file or directory
    async deleteFile(filePath) {
        const response = await api.delete('/api/files', {
            params: { path: filePath }
        });
        return response.data;
    },

    // Create directory
    async createDirectory(path, name) {
        const response = await api.post('/api/files/directory', {
            path,
            name
        });
        return response.data;
    },

    // Move/rename file
    async moveFile(sourcePath, destinationPath) {
        const response = await api.put('/api/files/move', {
            source: sourcePath,
            destination: destinationPath
        });
        return response.data;
    },

    // Get file metadata
    async getFileMetadata(filePath) {
        const response = await api.get('/api/files/metadata', {
            params: { path: filePath }
        });
        return response.data;
    }
};

// Terminal API
export const terminalService = {
    // Create WebSocket connection for terminal
    createTerminalConnection(tabId) {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/terminal/${tabId}`;
        return new WebSocket(wsUrl);
    },

    // Execute command
    async executeCommand(command, workingDirectory = '/') {
        const response = await api.post('/api/terminal/execute', {
            command,
            workingDirectory
        });
        return response.data;
    },

    // Get terminal history
    async getTerminalHistory(tabId) {
        const response = await api.get(`/api/terminal/${tabId}/history`);
        return response.data;
    },

    // Kill running process
    async killProcess(tabId, signal = 'SIGTERM') {
        const response = await api.post(`/api/terminal/${tabId}/kill`, {
            signal
        });
        return response.data;
    },

    // Get system information
    async getSystemInfo() {
        const response = await api.get('/api/terminal/system');
        return response.data;
    }
};

// Agent and Orchestrator API
export const agentService = {
    // Get orchestrator status
    async getOrchestratorStatus() {
        const response = await api.get('/api/orchestrator/status');
        return response.data;
    },

    // Register new agent
    async registerAgent(agentConfig) {
        const response = await api.post('/api/orchestrator/agents', agentConfig);
        return response.data;
    },

    // Unregister agent
    async unregisterAgent(agentId) {
        const response = await api.delete(`/api/orchestrator/agents/${agentId}`);
        return response.data;
    },

    // Get agent details
    async getAgentDetails(agentId) {
        const response = await api.get(`/api/orchestrator/agents/${agentId}`);
        return response.data;
    },

    // Send message to agent
    async sendMessageToAgent(agentId, message) {
        const response = await api.post(`/api/orchestrator/agents/${agentId}/message`, {
            message
        });
        return response.data;
    },

    // Create workflow
    async createWorkflow(workflowDefinition) {
        const response = await api.post('/api/orchestrator/workflows', workflowDefinition);
        return response.data;
    },

    // Execute workflow
    async executeWorkflow(workflowId) {
        const response = await api.post(`/api/orchestrator/workflows/${workflowId}/execute`);
        return response.data;
    },

    // Stop workflow
    async stopWorkflow(workflowId) {
        const response = await api.post(`/api/orchestrator/workflows/${workflowId}/stop`);
        return response.data;
    },

    // Get workflow details
    async getWorkflowDetails(workflowId) {
        const response = await api.get(`/api/orchestrator/workflows/${workflowId}`);
        return response.data;
    },

    // List all workflows
    async listWorkflows() {
        const response = await api.get('/api/orchestrator/workflows');
        return response.data;
    },

    // Distribute task to available agents
    async distributeTask(taskData, criteria = {}) {
        const response = await api.post('/api/orchestrator/tasks/distribute', {
            taskData,
            criteria
        });
        return response.data;
    }
};

// Security and Validation API
export const securityService = {
    // Validate command for security
    async validateCommand(command) {
        const response = await api.post('/api/security/validate-command', {
            command
        });
        return response.data;
    },

    // Get security policies
    async getSecurityPolicies() {
        const response = await api.get('/api/security/policies');
        return response.data;
    },

    // Check rate limits
    async checkRateLimit(userId, action) {
        const response = await api.get('/api/security/rate-limit', {
            params: { userId, action }
        });
        return response.data;
    },

    // Get sandbox status
    async getSandboxStatus() {
        const response = await api.get('/api/security/sandbox/status');
        return response.data;
    },

    // Create isolated sandbox
    async createSandbox(config = {}) {
        const response = await api.post('/api/security/sandbox/create', config);
        return response.data;
    },

    // Destroy sandbox
    async destroySandbox(sandboxId) {
        const response = await api.delete(`/api/security/sandbox/${sandboxId}`);
        return response.data;
    }
};

// System API
export const systemService = {
    // Get system health
    async getSystemHealth() {
        const response = await api.get('/api/system/health');
        return response.data;
    },

    // Get system metrics
    async getSystemMetrics() {
        const response = await api.get('/api/system/metrics');
        return response.data;
    },

    // Get application configuration
    async getConfig() {
        const response = await api.get('/api/system/config');
        return response.data;
    },

    // Update configuration
    async updateConfig(config) {
        const response = await api.put('/api/system/config', config);
        return response.data;
    }
};

// WebSocket Manager for real-time updates
export class WebSocketManager {
    constructor() {
        this.connections = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 1000;
    }

    connect(endpoint, options = {}) {
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${endpoint}`;
        
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log(`WebSocket connected: ${endpoint}`);
                this.reconnectAttempts.set(endpoint, 0);
                if (options.onConnect) options.onConnect();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (options.onMessage) options.onMessage(data);
                } catch (error) {
                    if (options.onMessage) options.onMessage(event.data);
                }
            };

            ws.onerror = (error) => {
                console.error(`WebSocket error: ${endpoint}`, error);
                if (options.onError) options.onError(error);
            };

            ws.onclose = () => {
                console.log(`WebSocket disconnected: ${endpoint}`);
                this.connections.delete(endpoint);
                
                if (options.autoReconnect !== false) {
                    this.attemptReconnect(endpoint, options);
                }
                
                if (options.onClose) options.onClose();
            };

            this.connections.set(endpoint, ws);
            return ws;
            
        } catch (error) {
            console.error(`Failed to create WebSocket connection: ${endpoint}`, error);
            if (options.onError) options.onError(error);
            return null;
        }
    }

    attemptReconnect(endpoint, options) {
        const attempts = this.reconnectAttempts.get(endpoint) || 0;
        
        if (attempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                console.log(`Attempting to reconnect to ${endpoint} (attempt ${attempts + 1})`);
                this.reconnectAttempts.set(endpoint, attempts + 1);
                this.connect(endpoint, options);
            }, this.reconnectInterval * Math.pow(2, attempts)); // Exponential backoff
        } else {
            console.error(`Max reconnection attempts reached for ${endpoint}`);
            if (options.onMaxReconnectReached) options.onMaxReconnectReached();
        }
    }

    send(endpoint, data) {
        const ws = this.connections.get(endpoint);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(typeof data === 'string' ? data : JSON.stringify(data));
            return true;
        }
        return false;
    }

    disconnect(endpoint) {
        const ws = this.connections.get(endpoint);
        if (ws) {
            ws.close();
            this.connections.delete(endpoint);
            this.reconnectAttempts.delete(endpoint);
        }
    }

    disconnectAll() {
        this.connections.forEach((ws, endpoint) => {
            ws.close();
        });
        this.connections.clear();
        this.reconnectAttempts.clear();
    }
}

// Create singleton instance
export const wsManager = new WebSocketManager();

// Utility functions
export const utils = {
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Format duration
    formatDuration(ms) {
        if (!ms) return '0s';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

export default {
    fileService,
    terminalService,
    agentService,
    securityService,
    systemService,
    wsManager,
    utils
};