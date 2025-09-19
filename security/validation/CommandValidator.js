/**
 * Command Validation System - Validates commands and inputs for security
 */

const Joi = require('joi');

class CommandValidator {
    constructor(config = {}) {
        this.config = {
            maxCommandLength: 1000,
            allowedCommands: [],
            blockedCommands: [],
            strictMode: true,
            ...config
        };
        
        this.initializeValidationRules();
    }
    
    initializeValidationRules() {
        // Basic command validation schema
        this.commandSchema = Joi.object({
            command: Joi.string()
                .max(this.config.maxCommandLength)
                .pattern(/^[a-zA-Z0-9\s\-_\.\/\\='",:;@#$%&*+?<>|(){}[\]]+$/)
                .required(),
            workingDirectory: Joi.string()
                .pattern(/^[a-zA-Z0-9\s\-_\.\/\\]+$/)
                .optional(),
            environment: Joi.object()
                .pattern(Joi.string(), Joi.string())
                .optional(),
            timeout: Joi.number()
                .min(1000)
                .max(300000)
                .optional()
        });
        
        // File path validation schema
        this.pathSchema = Joi.object({
            path: Joi.string()
                .pattern(/^[a-zA-Z0-9\s\-_\.\/]+$/)
                .required()
        });
        
        // Agent configuration validation schema
        this.agentConfigSchema = Joi.object({
            agentId: Joi.string()
                .pattern(/^[a-zA-Z0-9_-]+$/)
                .min(3)
                .max(50)
                .required(),
            agentType: Joi.string()
                .valid('file_processor', 'data_analyzer', 'report_generator', 'custom')
                .required(),
            config: Joi.object({
                timeout: Joi.number().min(1000).max(600000).optional(),
                maxRetries: Joi.number().min(0).max(5).optional(),
                encryptCommunication: Joi.boolean().optional(),
                sandboxed: Joi.boolean().optional()
            }).optional()
        });
        
        // Workflow definition validation schema
        this.workflowSchema = Joi.object({
            id: Joi.string()
                .pattern(/^[a-zA-Z0-9_-]+$/)
                .min(3)
                .max(100)
                .required(),
            definition: Joi.object({
                name: Joi.string().max(200).required(),
                description: Joi.string().max(1000).optional(),
                steps: Joi.array().items(
                    Joi.object({
                        name: Joi.string().max(100).required(),
                        agentId: Joi.string().required(),
                        taskType: Joi.string().max(50).required(),
                        taskData: Joi.object().required(),
                        timeout: Joi.number().min(1000).max(600000).optional(),
                        required: Joi.boolean().optional(),
                        usePreviousResults: Joi.boolean().optional(),
                        conditions: Joi.array().items(
                            Joi.object({
                                field: Joi.string().required(),
                                operator: Joi.string().valid('equals', 'not_equals', 'greater_than', 'exists').required(),
                                value: Joi.any().optional()
                            })
                        ).optional()
                    })
                ).min(1).required()
            }).required()
        });
    }
    
    validateCommand(input) {
        try {
            // Schema validation
            const { error, value } = this.commandSchema.validate(input);
            if (error) {
                return {
                    valid: false,
                    reason: 'Invalid input format',
                    details: error.details.map(d => d.message)
                };
            }
            
            const { command } = value;
            
            // Security validation
            const securityCheck = this.performSecurityCheck(command);
            if (!securityCheck.valid) {
                return securityCheck;
            }
            
            // Command-specific validation
            const commandCheck = this.validateSpecificCommand(command);
            if (!commandCheck.valid) {
                return commandCheck;
            }
            
            return { valid: true, sanitized: value };
            
        } catch (error) {
            return {
                valid: false,
                reason: 'Validation error',
                details: [error.message]
            };
        }
    }
    
    performSecurityCheck(command) {
        const cmd = command.toLowerCase().trim();
        
        // Check for dangerous patterns
        const dangerousPatterns = [
            // System manipulation
            { pattern: /rm\s+-rf\s+\//, reason: 'Root directory deletion attempt' },
            { pattern: /:\(\)\{\s*:\|\:&\s*\};\:/, reason: 'Fork bomb detected' },
            { pattern: /dd\s+if=\/dev\/(zero|random|urandom)/, reason: 'Device file manipulation' },
            { pattern: /mkfs\.|fdisk|parted/, reason: 'Disk partitioning/formatting commands' },
            
            // Network and download operations
            { pattern: /wget\s+.*\|\s*(sh|bash|zsh)/, reason: 'Download and execute pattern' },
            { pattern: /curl\s+.*\|\s*(sh|bash|zsh)/, reason: 'Download and execute pattern' },
            { pattern: /nc\s+.*-e/, reason: 'Netcat with execute flag' },
            { pattern: /telnet.*[0-9]+\s*$/, reason: 'Telnet connection attempt' },
            
            // Code execution
            { pattern: /python.*-c.*exec/, reason: 'Python exec injection' },
            { pattern: /perl.*-e/, reason: 'Perl one-liner execution' },
            { pattern: /ruby.*-e/, reason: 'Ruby one-liner execution' },
            { pattern: /eval\s*\(/, reason: 'Code evaluation function' },
            
            // System access
            { pattern: /sudo\s+(rm|dd|mkfs|fdisk)/, reason: 'Elevated dangerous command' },
            { pattern: /chmod\s+777\s+\//, reason: 'Root permission modification' },
            { pattern: /chown\s+.*:.*\s+\//, reason: 'Root ownership change' },
            
            // File system
            { pattern: /\>\s*\/dev\/(null|zero)/, reason: 'Device file redirection' },
            { pattern: /\/proc\/.*\/mem/, reason: 'Memory access attempt' },
            { pattern: /\/etc\/(passwd|shadow|sudoers)/, reason: 'System file access' },
            
            // Command injection
            { pattern: /;\s*(rm|dd|mkfs)/, reason: 'Command chaining with dangerous command' },
            { pattern: /\$\([^)]*\)/, reason: 'Command substitution' },
            { pattern: /`[^`]*`/, reason: 'Backtick command execution' },
            { pattern: /&&\s*(rm|dd)/, reason: 'Conditional dangerous command execution' },
            
            // Environment manipulation
            { pattern: /export\s+PATH=/, reason: 'PATH environment manipulation' },
            { pattern: /unset\s+PATH/, reason: 'PATH environment removal' },
            { pattern: /LD_PRELOAD=/, reason: 'Library preloading attempt' }
        ];
        
        for (const { pattern, reason } of dangerousPatterns) {
            if (pattern.test(cmd)) {
                return { valid: false, reason: `Security violation: ${reason}` };
            }
        }
        
        // Check for blocked commands
        if (this.config.blockedCommands.length > 0) {
            for (const blocked of this.config.blockedCommands) {
                if (cmd.includes(blocked.toLowerCase())) {
                    return { valid: false, reason: `Blocked command: ${blocked}` };
                }
            }
        }
        
        // Check allowed commands in strict mode
        if (this.config.strictMode && this.config.allowedCommands.length > 0) {
            const commandName = cmd.split(' ')[0];
            if (!this.config.allowedCommands.includes(commandName)) {
                return { valid: false, reason: `Command not in allowed list: ${commandName}` };
            }
        }
        
        return { valid: true };
    }
    
    validateSpecificCommand(command) {
        const cmd = command.trim();
        const firstWord = cmd.split(' ')[0].toLowerCase();
        
        // Command-specific validation rules
        switch (firstWord) {
            case 'rm':
                return this.validateRmCommand(cmd);
            case 'cp':
            case 'mv':
                return this.validateCopyMoveCommand(cmd);
            case 'find':
                return this.validateFindCommand(cmd);
            case 'grep':
                return this.validateGrepCommand(cmd);
            default:
                return { valid: true };
        }
    }
    
    validateRmCommand(command) {
        // Allow safe rm operations but block dangerous ones
        if (command.includes('-rf /') || command.includes('-fr /')) {
            return { valid: false, reason: 'Root directory deletion not allowed' };
        }
        
        if (command.includes('*') && (command.includes('-r') || command.includes('-f'))) {
            return { valid: false, reason: 'Wildcard with recursive/force flags too dangerous' };
        }
        
        return { valid: true };
    }
    
    validateCopyMoveCommand(command) {
        // Check for attempts to overwrite system files
        const systemPaths = ['/etc/', '/usr/', '/bin/', '/sbin/', '/boot/'];
        
        for (const sysPath of systemPaths) {
            if (command.includes(sysPath)) {
                return { valid: false, reason: `System directory modification not allowed: ${sysPath}` };
            }
        }
        
        return { valid: true };
    }
    
    validateFindCommand(command) {
        // Block find commands that could access sensitive areas
        if (command.includes('/etc/') || command.includes('/proc/') || command.includes('/dev/')) {
            return { valid: false, reason: 'Find in system directories not allowed' };
        }
        
        if (command.includes('-exec') && (command.includes('rm') || command.includes('dd'))) {
            return { valid: false, reason: 'Find with dangerous exec not allowed' };
        }
        
        return { valid: true };
    }
    
    validateGrepCommand(command) {
        // Block grep on sensitive files
        const sensitiveFiles = ['passwd', 'shadow', 'sudoers', 'authorized_keys'];
        
        for (const file of sensitiveFiles) {
            if (command.includes(file)) {
                return { valid: false, reason: `Grep on sensitive file not allowed: ${file}` };
            }
        }
        
        return { valid: true };
    }
    
    validatePath(path) {
        const { error, value } = this.pathSchema.validate({ path });
        if (error) {
            return {
                valid: false,
                reason: 'Invalid path format',
                details: error.details.map(d => d.message)
            };
        }
        
        // Additional path security checks
        if (path.includes('..') || path.includes('~')) {
            return { valid: false, reason: 'Path traversal not allowed' };
        }
        
        // Block system directories
        const blockedPaths = ['/etc/', '/usr/', '/bin/', '/sbin/', '/proc/', '/dev/', '/sys/'];
        for (const blocked of blockedPaths) {
            if (path.startsWith(blocked)) {
                return { valid: false, reason: `Access to system directory not allowed: ${blocked}` };
            }
        }
        
        return { valid: true, sanitized: value.path };
    }
    
    validateAgentConfig(config) {
        const { error, value } = this.agentConfigSchema.validate(config);
        if (error) {
            return {
                valid: false,
                reason: 'Invalid agent configuration',
                details: error.details.map(d => d.message)
            };
        }
        
        return { valid: true, sanitized: value };
    }
    
    validateWorkflow(workflow) {
        const { error, value } = this.workflowSchema.validate(workflow);
        if (error) {
            return {
                valid: false,
                reason: 'Invalid workflow definition',
                details: error.details.map(d => d.message)
            };
        }
        
        // Additional workflow validation
        const stepNames = value.definition.steps.map(step => step.name);
        const uniqueNames = new Set(stepNames);
        if (stepNames.length !== uniqueNames.size) {
            return { valid: false, reason: 'Duplicate step names in workflow' };
        }
        
        return { valid: true, sanitized: value };
    }
    
    sanitizeFileName(filename) {
        if (!filename || typeof filename !== 'string') {
            return null;
        }
        
        // Remove dangerous characters
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/\.{2,}/g, '.')
            .replace(/^\.+|\.+$/g, '')
            .substring(0, 255);
    }
    
    sanitizeInput(input, type = 'general') {
        if (!input || typeof input !== 'string') {
            return '';
        }
        
        switch (type) {
            case 'command':
                return input.replace(/[;&|`$(){}[\]<>]/g, '').trim();
            case 'path':
                return input.replace(/[^a-zA-Z0-9.\-_/]/g, '').replace(/\.{2,}/g, '');
            case 'filename':
                return this.sanitizeFileName(input);
            default:
                return input.replace(/[<>&"']/g, '').trim();
        }
    }
}

// Export singleton instance
let validator = null;

const getValidator = (config) => {
    if (!validator) {
        validator = new CommandValidator(config);
    }
    return validator;
};

module.exports = { CommandValidator, getValidator };