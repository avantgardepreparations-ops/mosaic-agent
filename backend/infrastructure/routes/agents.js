/**
 * Agent Routes - Handle agent orchestration and workflow management
 */

const express = require('express');
const AgentOrchestrator = require('../../agents/orchestrator/AgentOrchestrator');
const AgentBase = require('../../agents/base/AgentBase');
const router = express.Router();

// Global orchestrator instance
let orchestrator = null;

// Initialize orchestrator
const initializeOrchestrator = () => {
    if (!orchestrator) {
        orchestrator = new AgentOrchestrator({
            maxAgents: 10,
            taskTimeout: 300000,
            enableLoadBalancing: true
        });
        
        console.log('Agent Orchestrator initialized');
    }
    return orchestrator;
};

// Example agent classes for demonstration
class FileProcessorAgent extends AgentBase {
    async processTask(task) {
        const { taskData } = task;
        
        // Simulate file processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            processed: true,
            fileCount: Math.floor(Math.random() * 10) + 1,
            processingTime: task.endTime - task.startTime,
            taskType: 'file_processing'
        };
    }
}

class DataAnalyzerAgent extends AgentBase {
    async processTask(task) {
        const { taskData } = task;
        
        // Simulate data analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            analyzed: true,
            insights: ['Pattern detected', 'Anomaly found', 'Data quality: Good'],
            dataPoints: Math.floor(Math.random() * 1000) + 100,
            taskType: 'data_analysis'
        };
    }
}

class ReportGeneratorAgent extends AgentBase {
    async processTask(task) {
        const { taskData, previousResults } = task;
        
        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            generated: true,
            reportUrl: '/reports/generated_' + Date.now() + '.pdf',
            summary: 'Report generated successfully',
            inputData: previousResults,
            taskType: 'report_generation'
        };
    }
}

// GET /api/orchestrator/status - Get orchestrator status
router.get('/status', (req, res) => {
    try {
        const orch = initializeOrchestrator();
        const status = orch.getStatus();
        
        res.json(status);
    } catch (error) {
        console.error('Error getting orchestrator status:', error);
        res.status(500).json({ error: 'Failed to get orchestrator status' });
    }
});

// POST /api/orchestrator/agents - Register new agent
router.post('/agents', async (req, res) => {
    try {
        const { agentId, agentType, config = {} } = req.body;
        
        if (!agentId || !agentType) {
            return res.status(400).json({ error: 'agentId and agentType are required' });
        }
        
        const orch = initializeOrchestrator();
        
        // Select agent class based on type
        let AgentClass;
        switch (agentType) {
            case 'file_processor':
                AgentClass = FileProcessorAgent;
                break;
            case 'data_analyzer':
                AgentClass = DataAnalyzerAgent;
                break;
            case 'report_generator':
                AgentClass = ReportGeneratorAgent;
                break;
            default:
                return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
        }
        
        const agent = await orch.registerAgent(agentId, AgentClass, config);
        
        res.json({
            success: true,
            agent: {
                id: agentId,
                type: agentType,
                status: agent.getStatus()
            }
        });
        
    } catch (error) {
        console.error('Error registering agent:', error);
        res.status(500).json({ error: 'Failed to register agent: ' + error.message });
    }
});

// DELETE /api/orchestrator/agents/:agentId - Unregister agent
router.delete('/agents/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const orch = initializeOrchestrator();
        
        await orch.unregisterAgent(agentId);
        
        res.json({
            success: true,
            message: `Agent ${agentId} unregistered successfully`
        });
        
    } catch (error) {
        console.error('Error unregistering agent:', error);
        res.status(500).json({ error: 'Failed to unregister agent: ' + error.message });
    }
});

// GET /api/orchestrator/agents/:agentId - Get agent details
router.get('/agents/:agentId', (req, res) => {
    try {
        const { agentId } = req.params;
        const orch = initializeOrchestrator();
        
        const status = orch.getStatus();
        const agent = status.agents.find(a => a.id === agentId);
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        res.json(agent);
        
    } catch (error) {
        console.error('Error getting agent details:', error);
        res.status(500).json({ error: 'Failed to get agent details' });
    }
});

// POST /api/orchestrator/agents/:agentId/message - Send message to agent
router.post('/agents/:agentId/message', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        const orch = initializeOrchestrator();
        const agents = orch.agents;
        const agent = agents.get(agentId);
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Send message to agent
        const messageData = agent.sendMessage(agentId, message);
        
        res.json({
            success: true,
            messageData
        });
        
    } catch (error) {
        console.error('Error sending message to agent:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// POST /api/orchestrator/workflows - Create workflow
router.post('/workflows', async (req, res) => {
    try {
        const workflowDefinition = req.body;
        
        if (!workflowDefinition.id || !workflowDefinition.definition) {
            return res.status(400).json({ error: 'Workflow id and definition are required' });
        }
        
        const orch = initializeOrchestrator();
        const workflow = await orch.createWorkflow(workflowDefinition.id, workflowDefinition.definition);
        
        res.json({
            success: true,
            workflow
        });
        
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow: ' + error.message });
    }
});

// GET /api/orchestrator/workflows - List all workflows
router.get('/workflows', (req, res) => {
    try {
        const orch = initializeOrchestrator();
        const status = orch.getStatus();
        
        res.json({
            workflows: status.workflows
        });
        
    } catch (error) {
        console.error('Error listing workflows:', error);
        res.status(500).json({ error: 'Failed to list workflows' });
    }
});

// GET /api/orchestrator/workflows/:workflowId - Get workflow details
router.get('/workflows/:workflowId', (req, res) => {
    try {
        const { workflowId } = req.params;
        const orch = initializeOrchestrator();
        
        const workflow = orch.workflows.get(workflowId);
        
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        
        res.json(workflow);
        
    } catch (error) {
        console.error('Error getting workflow details:', error);
        res.status(500).json({ error: 'Failed to get workflow details' });
    }
});

// POST /api/orchestrator/workflows/:workflowId/execute - Execute workflow
router.post('/workflows/:workflowId/execute', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const orch = initializeOrchestrator();
        
        const result = await orch.executeWorkflow(workflowId);
        
        res.json({
            success: true,
            workflowId,
            result
        });
        
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({ error: 'Failed to execute workflow: ' + error.message });
    }
});

// POST /api/orchestrator/workflows/:workflowId/stop - Stop workflow
router.post('/workflows/:workflowId/stop', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const orch = initializeOrchestrator();
        
        const workflow = orch.workflows.get(workflowId);
        
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }
        
        if (workflow.status !== 'running') {
            return res.status(400).json({ error: 'Workflow is not running' });
        }
        
        // Mark workflow as stopped
        workflow.status = 'stopped';
        workflow.endTime = Date.now();
        
        res.json({
            success: true,
            message: `Workflow ${workflowId} stopped`
        });
        
    } catch (error) {
        console.error('Error stopping workflow:', error);
        res.status(500).json({ error: 'Failed to stop workflow' });
    }
});

// POST /api/orchestrator/tasks/distribute - Distribute task to available agents
router.post('/tasks/distribute', async (req, res) => {
    try {
        const { taskData, criteria = {} } = req.body;
        
        if (!taskData) {
            return res.status(400).json({ error: 'taskData is required' });
        }
        
        const orch = initializeOrchestrator();
        const result = await orch.distributeTask(taskData, criteria);
        
        res.json({
            success: true,
            result
        });
        
    } catch (error) {
        console.error('Error distributing task:', error);
        res.status(500).json({ error: 'Failed to distribute task: ' + error.message });
    }
});

// POST /api/orchestrator/demo/setup - Setup demo agents and workflow
router.post('/demo/setup', async (req, res) => {
    try {
        const orch = initializeOrchestrator();
        
        // Register demo agents
        await orch.registerAgent('file_processor_1', FileProcessorAgent);
        await orch.registerAgent('data_analyzer_1', DataAnalyzerAgent);
        await orch.registerAgent('report_generator_1', ReportGeneratorAgent);
        
        // Create demo workflow
        const workflowDefinition = {
            name: 'Demo Data Processing Workflow',
            description: 'Process files, analyze data, and generate report',
            steps: [
                {
                    name: 'process_files',
                    agentId: 'file_processor_1',
                    taskType: 'process',
                    taskData: { 
                        files: ['data1.csv', 'data2.json'],
                        operation: 'parse'
                    },
                    required: true
                },
                {
                    name: 'analyze_data',
                    agentId: 'data_analyzer_1',
                    taskType: 'analyze',
                    taskData: {
                        analysisType: 'statistical'
                    },
                    usePreviousResults: true,
                    required: true
                },
                {
                    name: 'generate_report',
                    agentId: 'report_generator_1',
                    taskType: 'report',
                    taskData: {
                        format: 'pdf',
                        template: 'standard'
                    },
                    usePreviousResults: true,
                    required: true
                }
            ]
        };
        
        const workflow = await orch.createWorkflow('demo_workflow_' + Date.now(), workflowDefinition);
        
        res.json({
            success: true,
            message: 'Demo setup completed',
            agents: orch.getStatus().agents.map(a => ({ id: a.id, status: a.status.state })),
            workflow: {
                id: workflow.id,
                steps: workflow.definition.steps.length
            }
        });
        
    } catch (error) {
        console.error('Error setting up demo:', error);
        res.status(500).json({ error: 'Failed to setup demo: ' + error.message });
    }
});

// GET /api/orchestrator/demo/status - Get demo status
router.get('/demo/status', (req, res) => {
    try {
        const orch = initializeOrchestrator();
        const status = orch.getStatus();
        
        const demoAgents = status.agents.filter(agent => 
            agent.id.includes('file_processor') || 
            agent.id.includes('data_analyzer') || 
            agent.id.includes('report_generator')
        );
        
        const demoWorkflows = status.workflows.filter(workflow =>
            workflow.id.includes('demo_workflow')
        );
        
        res.json({
            demoAgents,
            demoWorkflows,
            totalAgents: status.agents.length,
            totalWorkflows: status.workflows.length,
            orchestratorMetrics: status.metrics
        });
        
    } catch (error) {
        console.error('Error getting demo status:', error);
        res.status(500).json({ error: 'Failed to get demo status' });
    }
});

module.exports = router;