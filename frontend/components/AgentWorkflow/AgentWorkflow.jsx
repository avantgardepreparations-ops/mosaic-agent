import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Play, 
    Pause, 
    Square, 
    RotateCcw, 
    CheckCircle, 
    AlertCircle, 
    Clock,
    Activity,
    Settings,
    Eye
} from 'lucide-react';

const AgentWorkflow = ({ 
    onWorkflowStart,
    onWorkflowStop,
    onAgentSelect,
    refreshInterval = 1000
}) => {
    const [agents, setAgents] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [orchestratorStatus, setOrchestratorStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    
    // Refresh data periodically
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchOrchestratorStatus, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval]);
    
    // Initial data fetch
    useEffect(() => {
        fetchOrchestratorStatus();
    }, []);
    
    const fetchOrchestratorStatus = async () => {
        try {
            const response = await fetch('/api/orchestrator/status');
            const data = await response.json();
            
            if (response.ok) {
                setOrchestratorStatus(data);
                setAgents(data.agents || []);
                setWorkflows(data.workflows || []);
            } else {
                console.error('Failed to fetch orchestrator status:', data.error);
            }
        } catch (error) {
            console.error('Error fetching orchestrator status:', error);
        }
    };
    
    const createWorkflow = async (workflowDefinition) => {
        setLoading(true);
        try {
            const response = await fetch('/api/orchestrator/workflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowDefinition)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                await fetchOrchestratorStatus();
                if (onWorkflowStart) {
                    onWorkflowStart(result.workflow);
                }
                return result.workflow;
            } else {
                throw new Error(result.error || 'Failed to create workflow');
            }
        } catch (error) {
            console.error('Error creating workflow:', error);
            alert('Failed to create workflow: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const executeWorkflow = async (workflowId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/orchestrator/workflows/${workflowId}/execute`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                await fetchOrchestratorStatus();
                return result;
            } else {
                throw new Error(result.error || 'Failed to execute workflow');
            }
        } catch (error) {
            console.error('Error executing workflow:', error);
            alert('Failed to execute workflow: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const stopWorkflow = async (workflowId) => {
        try {
            const response = await fetch(`/api/orchestrator/workflows/${workflowId}/stop`, {
                method: 'POST'
            });
            
            if (response.ok) {
                await fetchOrchestratorStatus();
                if (onWorkflowStop) {
                    onWorkflowStop(workflowId);
                }
            }
        } catch (error) {
            console.error('Error stopping workflow:', error);
        }
    };
    
    const getStatusIcon = (status) => {
        switch (status) {
            case 'running':
                return <Activity className="text-blue-500" size={16} />;
            case 'completed':
                return <CheckCircle className="text-green-500" size={16} />;
            case 'error':
                return <AlertCircle className="text-red-500" size={16} />;
            case 'ready':
                return <CheckCircle className="text-green-400" size={16} />;
            case 'created':
                return <Clock className="text-yellow-500" size={16} />;
            default:
                return <Clock className="text-gray-400" size={16} />;
        }
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'running':
                return '#3b82f6';
            case 'completed':
                return '#10b981';
            case 'error':
                return '#ef4444';
            case 'ready':
                return '#22c55e';
            case 'created':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };
    
    const formatDuration = (ms) => {
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
    };
    
    const getWorkflowProgress = (workflow) => {
        if (!workflow.definition?.steps) return 0;
        
        const totalSteps = workflow.definition.steps.length;
        const completedSteps = workflow.currentStep || 0;
        
        return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    };
    
    return (
        <div className=\"agent-workflow\" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8f9fa'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} />
                    <h3 style={{ margin: 0 }}>Agent Workflow Manager</h3>
                    {orchestratorStatus && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginLeft: '1rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}>
                            <Activity size={14} />
                            {orchestratorStatus.metrics.activeWorkflows} active
                        </div>
                    )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        style={{
                            padding: '0.5rem',
                            backgroundColor: autoRefresh ? '#10b981' : '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <RotateCcw size={14} />
                        Auto-refresh
                    </button>
                    
                    <button
                        onClick={fetchOrchestratorStatus}
                        disabled={loading}
                        style={{
                            padding: '0.5rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Refresh
                    </button>
                </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex' }}>
                {/* Agents Panel */}
                <div style={{
                    width: '300px',
                    backgroundColor: 'white',
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e0e0e0',
                        fontWeight: 'bold'
                    }}>
                        Registered Agents ({agents.length})
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {agents.length === 0 ? (
                            <div style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}>
                                No agents registered
                            </div>
                        ) : (
                            agents.map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => {
                                        setSelectedAgent(agent);
                                        if (onAgentSelect) onAgentSelect(agent);
                                    }}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        backgroundColor: selectedAgent?.id === agent.id ? '#e3f2fd' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedAgent?.id !== agent.id) {
                                            e.target.style.backgroundColor = '#f8f9fa';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedAgent?.id !== agent.id) {
                                            e.target.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <span style={{ fontWeight: '500' }}>{agent.id}</span>
                                        {getStatusIcon(agent.status?.state)}
                                    </div>
                                    
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        <div>State: {agent.status?.state}</div>
                                        <div>Tasks: {agent.status?.activeTasks}</div>
                                        <div>Uptime: {formatDuration(agent.status?.uptime)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* Workflows Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'white'
                    }}>
                        <span style={{ fontWeight: 'bold' }}>
                            Active Workflows ({workflows.length})
                        </span>
                        
                        <button
                            onClick={() => {
                                // Create a simple workflow for demonstration
                                const workflow = {
                                    id: `workflow_${Date.now()}`,
                                    definition: {
                                        name: 'Sample Workflow',
                                        steps: [
                                            {
                                                name: 'step1',
                                                agentId: agents[0]?.id,
                                                taskType: 'process',
                                                taskData: { message: 'Hello from workflow' }
                                            }
                                        ]
                                    }
                                };
                                createWorkflow(workflow);
                            }}
                            disabled={loading || agents.length === 0}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: agents.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Play size={14} />
                            New Workflow
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {workflows.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                color: '#6b7280'
                            }}>
                                <Activity size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <div>No active workflows</div>
                                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    Create a workflow to see it here
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {workflows.map(workflow => (
                                    <div
                                        key={workflow.id}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            border: '1px solid #e0e0e0',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <span style={{ fontWeight: 'bold' }}>{workflow.id}</span>
                                                {getStatusIcon(workflow.status)}
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: getStatusColor(workflow.status) + '20',
                                                    color: getStatusColor(workflow.status),
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {workflow.status}
                                                </span>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {workflow.status === 'created' && (
                                                    <button
                                                        onClick={() => executeWorkflow(workflow.id)}
                                                        disabled={loading}
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        <Play size={12} />
                                                    </button>
                                                )}
                                                
                                                {workflow.status === 'running' && (
                                                    <button
                                                        onClick={() => stopWorkflow(workflow.id)}
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        <Square size={12} />
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => setSelectedWorkflow(
                                                        selectedWorkflow?.id === workflow.id ? null : workflow
                                                    )}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <Eye size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.25rem',
                                                fontSize: '0.875rem'
                                            }}>
                                                <span>Progress</span>
                                                <span>
                                                    {workflow.currentStep || 0} / {workflow.totalSteps || 0} steps
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '6px',
                                                backgroundColor: '#e0e0e0',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    backgroundColor: getStatusColor(workflow.status),
                                                    width: `${getWorkflowProgress(workflow)}%`,
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>
                                        
                                        {/* Workflow Details */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                            gap: '1rem',
                                            fontSize: '0.875rem',
                                            color: '#6b7280'
                                        }}>
                                            <div>
                                                <strong>Started:</strong><br />
                                                {workflow.startTime 
                                                    ? new Date(workflow.startTime).toLocaleTimeString()
                                                    : 'Not started'
                                                }
                                            </div>
                                            <div>
                                                <strong>Duration:</strong><br />
                                                {workflow.startTime 
                                                    ? formatDuration(
                                                        (workflow.endTime || Date.now()) - workflow.startTime
                                                    )
                                                    : '0s'
                                                }
                                            </div>
                                            <div>
                                                <strong>Errors:</strong><br />
                                                {workflow.errors || 0}
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Details */}
                                        {selectedWorkflow?.id === workflow.id && (
                                            <div style={{
                                                marginTop: '1rem',
                                                padding: '1rem',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '4px',
                                                fontSize: '0.875rem'
                                            }}>
                                                <strong>Workflow Definition:</strong>
                                                <pre style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.5rem',
                                                    backgroundColor: '#ffffff',
                                                    borderRadius: '4px',
                                                    overflow: 'auto',
                                                    maxHeight: '200px'
                                                }}>
                                                    {JSON.stringify(workflow.definition, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Footer Stats */}
            {orchestratorStatus && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderTop: '1px solid #e0e0e0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.875rem'
                }}>
                    <div>
                        <strong>Tasks Completed:</strong><br />
                        {orchestratorStatus.metrics.tasksCompleted}
                    </div>
                    <div>
                        <strong>Tasks Failed:</strong><br />
                        <span style={{ color: '#dc3545' }}>
                            {orchestratorStatus.metrics.tasksError}
                        </span>
                    </div>
                    <div>
                        <strong>Avg Execution Time:</strong><br />
                        {formatDuration(orchestratorStatus.metrics.averageExecutionTime)}
                    </div>
                    <div>
                        <strong>Queue Length:</strong><br />
                        {orchestratorStatus.taskQueue}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentWorkflow;