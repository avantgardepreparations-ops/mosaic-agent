/**
 * AgentOrchestrator.js - Coordinator for multi-agent workflows
 * Manages agent lifecycle, task distribution, and workflow coordination
 */

const AgentBase = require('../base/AgentBase');
const EventEmitter = require('events');

class AgentOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxAgents: 10,
            taskTimeout: 300000, // 5 minutes
            enableLoadBalancing: true,
            ...config
        };
        
        this.agents = new Map();
        this.workflows = new Map();
        this.taskQueue = [];
        this.isProcessing = false;
        this.metrics = {
            tasksCompleted: 0,
            tasksError: 0,
            totalExecutionTime: 0,
            activeWorkflows: 0
        };
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.on('agent:registered', this.handleAgentRegistered.bind(this));
        this.on('agent:error', this.handleAgentError.bind(this));
        this.on('workflow:start', this.handleWorkflowStart.bind(this));
        this.on('workflow:complete', this.handleWorkflowComplete.bind(this));
    }
    
    async registerAgent(agentId, agentClass, agentConfig = {}) {
        if (this.agents.has(agentId)) {
            throw new Error(`Agent ${agentId} already registered`);
        }
        
        if (this.agents.size >= this.config.maxAgents) {
            throw new Error(`Maximum agent limit (${this.config.maxAgents}) reached`);
        }
        
        // Ensure agent extends AgentBase
        const agent = new agentClass(agentId, agentConfig);
        if (!(agent instanceof AgentBase)) {
            throw new Error('Agents must extend AgentBase class');
        }
        
        await agent.initialize();
        
        // Setup agent event forwarding
        agent.on('task:complete', (task) => {
            this.emit('agent:task:complete', { agentId, task });
            this.updateMetrics('taskComplete', task);
        });
        
        agent.on('task:error', (task) => {
            this.emit('agent:task:error', { agentId, task });
            this.updateMetrics('taskError', task);
        });
        
        agent.on('error', (error) => {
            this.emit('agent:error', { agentId, error });
        });
        
        this.agents.set(agentId, agent);
        this.emit('agent:registered', { agentId, agent });
        
        console.log(`Agent ${agentId} registered successfully`);
        return agent;
    }
    
    async unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        await agent.shutdown();
        this.agents.delete(agentId);
        
        console.log(`Agent ${agentId} unregistered`);
    }
    
    async createWorkflow(workflowId, definition) {
        if (this.workflows.has(workflowId)) {
            throw new Error(`Workflow ${workflowId} already exists`);
        }
        
        const workflow = {
            id: workflowId,
            definition,
            status: 'created',
            startTime: null,
            endTime: null,
            steps: [],
            currentStep: 0,
            results: {},
            errors: []
        };
        
        this.workflows.set(workflowId, workflow);
        console.log(`Workflow ${workflowId} created`);
        
        return workflow;
    }
    
    async executeWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        
        if (workflow.status === 'running') {
            throw new Error(`Workflow ${workflowId} is already running`);
        }
        
        workflow.status = 'running';
        workflow.startTime = Date.now();
        this.metrics.activeWorkflows++;
        
        this.emit('workflow:start', workflow);
        
        try {
            const result = await this.processWorkflowSteps(workflow);
            
            workflow.status = 'completed';
            workflow.endTime = Date.now();
            workflow.results.final = result;
            
            this.emit('workflow:complete', workflow);
            return result;
            
        } catch (error) {
            workflow.status = 'error';
            workflow.endTime = Date.now();
            workflow.errors.push({
                step: workflow.currentStep,
                error: error.message,
                timestamp: Date.now()
            });
            
            this.emit('workflow:error', { workflow, error });
            throw error;
            
        } finally {
            this.metrics.activeWorkflows--;
        }
    }
    
    async processWorkflowSteps(workflow) {
        const results = {};
        
        for (let i = 0; i < workflow.definition.steps.length; i++) {
            workflow.currentStep = i;
            const step = workflow.definition.steps[i];
            
            console.log(`Executing workflow ${workflow.id} step ${i}: ${step.name}`);
            
            try {
                const stepResult = await this.executeWorkflowStep(workflow, step, results);
                results[step.name] = stepResult;
                workflow.results[step.name] = stepResult;
                
                // Check if step has conditions for next step
                if (step.conditions && !this.evaluateConditions(step.conditions, stepResult)) {
                    console.log(`Workflow ${workflow.id} stopped at step ${i} due to conditions`);
                    break;
                }
                
            } catch (error) {
                console.error(`Workflow ${workflow.id} step ${i} failed:`, error);
                
                if (step.required !== false) {
                    throw error;
                }
                
                // Non-required step failed, continue with warning
                workflow.errors.push({
                    step: i,
                    error: error.message,
                    timestamp: Date.now(),
                    warning: true
                });
            }
        }
        
        return results;
    }
    
    async executeWorkflowStep(workflow, step, previousResults) {
        const { agentId, taskType, taskData, timeout } = step;
        
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found for workflow step`);
        }
        
        if (agent.state !== 'ready') {
            throw new Error(`Agent ${agentId} not ready (state: ${agent.state})`);
        }
        
        // Prepare task data with previous results if needed
        const enrichedTaskData = {
            ...taskData,
            previousResults: step.usePreviousResults ? previousResults : undefined,
            workflowId: workflow.id,
            stepIndex: workflow.currentStep
        };
        
        const taskId = `${workflow.id}_step_${workflow.currentStep}_${Date.now()}`;
        
        return await agent.executeTask(taskId, enrichedTaskData, {
            timeout: timeout || this.config.taskTimeout,
            taskType
        });
    }
    
    evaluateConditions(conditions, result) {
        // Simple condition evaluation - can be extended
        for (const condition of conditions) {
            const { field, operator, value } = condition;
            const fieldValue = this.getNestedValue(result, field);
            
            switch (operator) {
                case 'equals':
                    if (fieldValue !== value) return false;
                    break;
                case 'not_equals':
                    if (fieldValue === value) return false;
                    break;
                case 'greater_than':
                    if (fieldValue <= value) return false;
                    break;
                case 'exists':
                    if (fieldValue === undefined) return false;
                    break;
                default:
                    console.warn(`Unknown condition operator: ${operator}`);
            }
        }
        return true;
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    async distributeTask(taskData, criteria = {}) {
        const availableAgents = Array.from(this.agents.values())
            .filter(agent => agent.state === 'ready');
        
        if (availableAgents.length === 0) {
            throw new Error('No available agents for task distribution');
        }
        
        let selectedAgent;
        
        if (this.config.enableLoadBalancing) {
            // Select agent with least active tasks
            selectedAgent = availableAgents.reduce((best, current) => 
                current.tasks.size < best.tasks.size ? current : best
            );
        } else {
            // Round-robin selection
            selectedAgent = availableAgents[0];
        }
        
        const taskId = `distributed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return await selectedAgent.executeTask(taskId, taskData);
    }
    
    updateMetrics(type, data) {
        switch (type) {
            case 'taskComplete':
                this.metrics.tasksCompleted++;
                if (data.endTime && data.startTime) {
                    this.metrics.totalExecutionTime += (data.endTime - data.startTime);
                }
                break;
            case 'taskError':
                this.metrics.tasksError++;
                break;
        }
    }
    
    getStatus() {
        return {
            agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
                id,
                status: agent.getStatus()
            })),
            workflows: Array.from(this.workflows.values()).map(workflow => ({
                id: workflow.id,
                status: workflow.status,
                currentStep: workflow.currentStep,
                totalSteps: workflow.definition.steps.length,
                startTime: workflow.startTime,
                errors: workflow.errors.length
            })),
            metrics: {
                ...this.metrics,
                averageExecutionTime: this.metrics.tasksCompleted > 0 
                    ? this.metrics.totalExecutionTime / this.metrics.tasksCompleted 
                    : 0
            },
            taskQueue: this.taskQueue.length
        };
    }
    
    // Event handlers
    handleAgentRegistered({ agentId, agent }) {
        console.log(`Orchestrator: Agent ${agentId} registered and ready`);
    }
    
    handleAgentError({ agentId, error }) {
        console.error(`Orchestrator: Agent ${agentId} error:`, error);
        // Could implement auto-restart logic here
    }
    
    handleWorkflowStart(workflow) {
        console.log(`Orchestrator: Workflow ${workflow.id} started`);
    }
    
    handleWorkflowComplete(workflow) {
        const duration = workflow.endTime - workflow.startTime;
        console.log(`Orchestrator: Workflow ${workflow.id} completed in ${duration}ms`);
    }
    
    async shutdown() {
        console.log('Orchestrator shutting down...');
        
        // Shutdown all agents
        const shutdownPromises = Array.from(this.agents.values()).map(agent => agent.shutdown());
        await Promise.all(shutdownPromises);
        
        this.agents.clear();
        this.workflows.clear();
        this.taskQueue.length = 0;
        
        this.removeAllListeners();
        console.log('Orchestrator shutdown completed');
    }
}

module.exports = AgentOrchestrator;