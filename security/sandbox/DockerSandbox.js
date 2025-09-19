/**
 * Docker Sandbox Manager - Isolated execution environment for agents
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class DockerSandbox {
    constructor(config = {}) {
        this.config = {
            baseImage: 'node:18-alpine',
            networkMode: 'none', // Disable network access by default
            memoryLimit: '256m',
            cpuLimit: '0.5',
            timeout: 300000, // 5 minutes
            workDir: '/workspace',
            user: 'node:node',
            readOnly: true,
            ...config
        };
        
        this.activeSandboxes = new Map();
        this.cleanupInterval = setInterval(() => this.cleanupExpiredSandboxes(), 60000);
    }
    
    generateSandboxId() {
        return `mosaic-sandbox-${crypto.randomUUID()}`;
    }
    
    async createSandbox(taskConfig = {}) {
        const sandboxId = this.generateSandboxId();
        
        try {
            // Create temporary directory for sandbox files
            const tempDir = path.join('/tmp', sandboxId);
            await fs.mkdir(tempDir, { recursive: true });
            
            // Write any required files to the sandbox
            if (taskConfig.files) {
                for (const [filename, content] of Object.entries(taskConfig.files)) {
                    const filePath = path.join(tempDir, filename);
                    await fs.writeFile(filePath, content);
                }
            }
            
            // Create Docker run command
            const dockerArgs = this.buildDockerArgs(sandboxId, tempDir, taskConfig);
            
            const sandbox = {
                id: sandboxId,
                created: Date.now(),
                status: 'creating',
                tempDir,
                config: taskConfig,
                containerId: null
            };
            
            this.activeSandboxes.set(sandboxId, sandbox);
            
            console.log(`Creating sandbox ${sandboxId} with args:`, dockerArgs);
            return sandbox;
            
        } catch (error) {
            console.error(`Error creating sandbox ${sandboxId}:`, error);
            throw new Error(`Failed to create sandbox: ${error.message}`);
        }
    }
    
    buildDockerArgs(sandboxId, tempDir, taskConfig) {
        const args = [
            'run',
            '--rm',
            '--name', sandboxId,
            '--network', this.config.networkMode,
            '--memory', this.config.memoryLimit,
            '--cpus', this.config.cpuLimit,
            '--user', this.config.user,
            '--workdir', this.config.workDir,
            '--read-only',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=100m',
            '--tmpfs', '/var/tmp:rw,noexec,nosuid,size=100m',
            '-v', `${tempDir}:${this.config.workDir}:ro`,
            '--security-opt', 'no-new-privileges:true',
            '--cap-drop', 'ALL',
            '--cap-add', 'CHOWN',
            '--cap-add', 'SETGID',
            '--cap-add', 'SETUID'
        ];
        
        // Add environment variables
        if (taskConfig.env) {
            for (const [key, value] of Object.entries(taskConfig.env)) {
                args.push('-e', `${key}=${value}`);
            }
        }
        
        // Add the image
        args.push(taskConfig.image || this.config.baseImage);
        
        // Add the command
        if (taskConfig.command) {
            if (Array.isArray(taskConfig.command)) {
                args.push(...taskConfig.command);
            } else {
                args.push('sh', '-c', taskConfig.command);
            }
        } else {
            args.push('sh', '-c', 'echo "No command specified"');
        }
        
        return args;
    }
    
    async executeSandbox(sandboxId, command, options = {}) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }
        
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || this.config.timeout;
            let timedOut = false;
            
            // Build docker command
            const dockerArgs = this.buildDockerArgs(sandboxId, sandbox.tempDir, {
                ...sandbox.config,
                command
            });
            
            console.log(`Executing in sandbox ${sandboxId}:`, command);
            
            const dockerProcess = spawn('docker', dockerArgs, {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            sandbox.containerId = sandboxId; // Docker container name is the same as sandbox ID
            sandbox.status = 'running';
            sandbox.process = dockerProcess;
            
            let stdout = '';
            let stderr = '';
            
            dockerProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            dockerProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            // Set timeout
            const timeoutHandle = setTimeout(() => {
                timedOut = true;
                this.killSandbox(sandboxId);
                reject(new Error(`Sandbox execution timed out after ${timeout}ms`));
            }, timeout);
            
            dockerProcess.on('close', (code, signal) => {
                clearTimeout(timeoutHandle);
                
                if (timedOut) return; // Already handled by timeout
                
                sandbox.status = 'completed';
                sandbox.exitCode = code;
                sandbox.completedAt = Date.now();
                
                const result = {
                    sandboxId,
                    exitCode: code,
                    signal,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    executionTime: Date.now() - sandbox.created
                };
                
                if (code === 0) {
                    resolve(result);
                } else {
                    reject(Object.assign(new Error(`Sandbox execution failed with code ${code}`), result));
                }
                
                // Schedule cleanup
                setTimeout(() => this.destroySandbox(sandboxId), 5000);
            });
            
            dockerProcess.on('error', (error) => {
                clearTimeout(timeoutHandle);
                sandbox.status = 'error';
                reject(new Error(`Docker execution error: ${error.message}`));
            });
        });
    }
    
    async killSandbox(sandboxId) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        
        if (!sandbox) {
            return false;
        }
        
        try {
            if (sandbox.containerId) {
                await this.execCommand(`docker kill ${sandbox.containerId}`);
                console.log(`Killed sandbox container ${sandboxId}`);
            }
            
            if (sandbox.process && !sandbox.process.killed) {
                sandbox.process.kill('SIGTERM');
                console.log(`Killed sandbox process ${sandboxId}`);
            }
            
            sandbox.status = 'killed';
            return true;
            
        } catch (error) {
            console.warn(`Error killing sandbox ${sandboxId}:`, error.message);
            return false;
        }
    }
    
    async destroySandbox(sandboxId) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        
        if (!sandbox) {
            return false;
        }
        
        try {
            // Kill if still running
            await this.killSandbox(sandboxId);
            
            // Clean up temporary directory
            if (sandbox.tempDir) {
                await fs.rm(sandbox.tempDir, { recursive: true, force: true });
                console.log(`Cleaned up sandbox directory ${sandbox.tempDir}`);
            }
            
            // Remove from active sandboxes
            this.activeSandboxes.delete(sandboxId);
            
            console.log(`Destroyed sandbox ${sandboxId}`);
            return true;
            
        } catch (error) {
            console.error(`Error destroying sandbox ${sandboxId}:`, error);
            return false;
        }
    }
    
    async cleanupExpiredSandboxes() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        for (const [sandboxId, sandbox] of this.activeSandboxes.entries()) {
            if (now - sandbox.created > maxAge) {
                console.log(`Cleaning up expired sandbox ${sandboxId}`);
                await this.destroySandbox(sandboxId);
            }
        }
    }
    
    getSandboxStatus(sandboxId) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        
        if (!sandbox) {
            return null;
        }
        
        return {
            id: sandbox.id,
            status: sandbox.status,
            created: sandbox.created,
            age: Date.now() - sandbox.created,
            containerId: sandbox.containerId,
            exitCode: sandbox.exitCode,
            completedAt: sandbox.completedAt
        };
    }
    
    listActiveSandboxes() {
        return Array.from(this.activeSandboxes.values()).map(sandbox => ({
            id: sandbox.id,
            status: sandbox.status,
            created: sandbox.created,
            age: Date.now() - sandbox.created
        }));
    }
    
    async checkDockerAvailability() {
        try {
            await this.execCommand('docker --version');
            return true;
        } catch (error) {
            console.error('Docker not available:', error.message);
            return false;
        }
    }
    
    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
                }
            });
        });
    }
    
    async shutdown() {
        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Destroy all active sandboxes
        const destroyPromises = Array.from(this.activeSandboxes.keys()).map(
            sandboxId => this.destroySandbox(sandboxId)
        );
        
        await Promise.all(destroyPromises);
        console.log('Docker Sandbox Manager shutdown completed');
    }
}

// Singleton instance
let sandboxManager = null;

const getSandboxManager = (config) => {
    if (!sandboxManager) {
        sandboxManager = new DockerSandbox(config);
    }
    return sandboxManager;
};

module.exports = { DockerSandbox, getSandboxManager };