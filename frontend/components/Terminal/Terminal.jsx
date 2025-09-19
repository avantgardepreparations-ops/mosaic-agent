import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Plus, X, Settings, Play, Square } from 'lucide-react';

const Terminal = ({ 
    onCommand,
    maxTabs = 5,
    defaultWorkingDirectory = '/home/user'
}) => {
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [connected, setConnected] = useState(false);
    const [terminalSettings, setTerminalSettings] = useState({
        fontSize: 14,
        theme: 'dark',
        scrollback: 1000
    });
    
    const wsConnections = useRef(new Map());
    const terminalRefs = useRef(new Map());
    const nextTabId = useRef(1);
    
    // Initialize first tab
    useEffect(() => {
        createNewTab();
        return () => {
            // Cleanup all WebSocket connections
            wsConnections.current.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
        };
    }, []);
    
    const createNewTab = () => {
        if (tabs.length >= maxTabs) {
            alert(`Maximum ${maxTabs} tabs allowed`);
            return;
        }
        
        const tabId = nextTabId.current++;
        const newTab = {
            id: tabId,
            name: `Terminal ${tabId}`,
            workingDirectory: defaultWorkingDirectory,
            history: [],
            output: [],
            currentCommand: '',
            isRunning: false,
            pid: null
        };
        
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(tabId);
        
        // Initialize WebSocket connection for this tab
        initializeWebSocket(tabId);
    };
    
    const initializeWebSocket = (tabId) => {
        const wsUrl = `ws://localhost:8000/api/terminal/${tabId}`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log(`Terminal ${tabId} WebSocket connected`);
            setConnected(true);
            
            // Send initial setup
            ws.send(JSON.stringify({
                type: 'init',
                workingDirectory: defaultWorkingDirectory,
                environment: {
                    TERM: 'xterm-256color',
                    SHELL: '/bin/bash'
                }
            }));
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleTerminalMessage(tabId, data);
            } catch (error) {
                // Handle raw terminal output
                handleTerminalOutput(tabId, event.data);
            }
        };
        
        ws.onerror = (error) => {
            console.error(`Terminal ${tabId} WebSocket error:`, error);
            handleTerminalOutput(tabId, `\\n[ERROR] WebSocket connection failed\\n`, 'error');
        };
        
        ws.onclose = () => {
            console.log(`Terminal ${tabId} WebSocket disconnected`);
            setConnected(false);
            handleTerminalOutput(tabId, `\\n[DISCONNECTED] Terminal session ended\\n`, 'warning');
        };
        
        wsConnections.current.set(tabId, ws);
    };
    
    const handleTerminalMessage = (tabId, data) => {
        const { type, payload } = data;
        
        switch (type) {
            case 'output':
                handleTerminalOutput(tabId, payload.data, payload.stream);
                break;
            case 'command_complete':
                updateTabStatus(tabId, { isRunning: false, pid: null });
                break;
            case 'command_start':
                updateTabStatus(tabId, { isRunning: true, pid: payload.pid });
                break;
            case 'directory_change':
                updateTabDirectory(tabId, payload.directory);
                break;
            case 'error':
                handleTerminalOutput(tabId, `[ERROR] ${payload.message}\\n`, 'error');
                break;
            default:
                console.log('Unknown terminal message type:', type);
        }
    };
    
    const handleTerminalOutput = (tabId, output, stream = 'stdout') => {
        setTabs(prev => prev.map(tab => {
            if (tab.id === tabId) {
                const outputEntry = {
                    id: Date.now() + Math.random(),
                    content: output,
                    stream,
                    timestamp: new Date()
                };
                
                const newOutput = [...tab.output, outputEntry];
                
                // Limit output history to prevent memory issues
                if (newOutput.length > terminalSettings.scrollback) {
                    newOutput.splice(0, newOutput.length - terminalSettings.scrollback);
                }
                
                return { ...tab, output: newOutput };
            }
            return tab;
        }));
        
        // Auto-scroll to bottom
        setTimeout(() => {
            const terminalDiv = terminalRefs.current.get(tabId);
            if (terminalDiv) {
                terminalDiv.scrollTop = terminalDiv.scrollHeight;
            }
        }, 10);
    };
    
    const updateTabStatus = (tabId, updates) => {
        setTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, ...updates } : tab
        ));
    };
    
    const updateTabDirectory = (tabId, directory) => {
        setTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, workingDirectory: directory } : tab
        ));
    };
    
    const executeCommand = (tabId, command) => {
        const ws = wsConnections.current.get(tabId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            handleTerminalOutput(tabId, '[ERROR] Terminal not connected\\n', 'error');
            return;
        }
        
        // Validate command for security
        if (!validateCommand(command)) {
            handleTerminalOutput(tabId, '[BLOCKED] Command blocked by security policy\\n', 'error');
            return;
        }
        
        // Add command to history
        setTabs(prev => prev.map(tab => {
            if (tab.id === tabId) {
                const newHistory = [...tab.history, command];
                if (newHistory.length > 100) { // Limit history
                    newHistory.splice(0, 1);
                }
                return { 
                    ...tab, 
                    history: newHistory,
                    currentCommand: ''
                };
            }
            return tab;
        }));
        
        // Display command in output
        handleTerminalOutput(tabId, `$ ${command}\\n`, 'command');
        
        // Send command to backend
        ws.send(JSON.stringify({
            type: 'command',
            command: command.trim(),
            tabId
        }));
        
        // Notify parent component
        if (onCommand) {
            onCommand({ tabId, command, timestamp: new Date() });
        }
    };
    
    const validateCommand = (command) => {
        // Basic security validation
        const blockedCommands = [
            'rm -rf /',
            'dd if=',
            'mkfs.',
            'format',
            'fdisk',
            ':(){ :|:& };:',  // Fork bomb
            'sudo rm',
            'chmod 777 /'
        ];
        
        const cmd = command.toLowerCase().trim();
        return !blockedCommands.some(blocked => cmd.includes(blocked));
    };
    
    const handleKeyDown = (tabId, event) => {
        const tab = tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        if (event.key === 'Enter') {
            event.preventDefault();
            if (tab.currentCommand.trim()) {
                executeCommand(tabId, tab.currentCommand);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            // Navigate command history
            if (tab.history.length > 0) {
                const lastCommand = tab.history[tab.history.length - 1];
                setTabs(prev => prev.map(t => 
                    t.id === tabId ? { ...t, currentCommand: lastCommand } : t
                ));
            }
        } else if (event.key === 'Tab') {
            event.preventDefault();
            // Basic tab completion (can be enhanced)
            const commands = ['ls', 'cd', 'pwd', 'cat', 'grep', 'find', 'ps', 'top'];
            const partial = tab.currentCommand.toLowerCase();
            const matches = commands.filter(cmd => cmd.startsWith(partial));
            if (matches.length === 1) {
                setTabs(prev => prev.map(t => 
                    t.id === tabId ? { ...t, currentCommand: matches[0] + ' ' } : t
                ));
            }
        }
    };
    
    const handleCommandChange = (tabId, value) => {
        setTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, currentCommand: value } : tab
        ));
    };
    
    const closeTab = (tabId) => {
        if (tabs.length <= 1) {
            return; // Don't close the last tab
        }
        
        // Close WebSocket connection
        const ws = wsConnections.current.get(tabId);
        if (ws) {
            ws.close();
            wsConnections.current.delete(tabId);
        }
        
        // Remove tab
        setTabs(prev => prev.filter(tab => tab.id !== tabId));
        
        // Switch to another tab if the active one was closed
        if (activeTabId === tabId) {
            const remainingTabs = tabs.filter(tab => tab.id !== tabId);
            setActiveTabId(remainingTabs[0]?.id || null);
        }
        
        terminalRefs.current.delete(tabId);
    };
    
    const killProcess = (tabId) => {
        const ws = wsConnections.current.get(tabId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'kill',
                signal: 'SIGTERM'
            }));
        }
    };
    
    const clearTerminal = (tabId) => {
        setTabs(prev => prev.map(tab => 
            tab.id === tabId ? { ...tab, output: [] } : tab
        ));
    };
    
    const getOutputStyle = (stream) => {
        const baseStyle = {
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: `${terminalSettings.fontSize}px`,
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            margin: 0
        };
        
        switch (stream) {
            case 'stderr':
                return { ...baseStyle, color: '#ff6b6b' };
            case 'error':
                return { ...baseStyle, color: '#ff4757', fontWeight: 'bold' };
            case 'warning':
                return { ...baseStyle, color: '#ffa502' };
            case 'command':
                return { ...baseStyle, color: '#5f27cd', fontWeight: 'bold' };
            default:
                return { ...baseStyle, color: terminalSettings.theme === 'dark' ? '#ffffff' : '#000000' };
        }
    };
    
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    
    return (
        <div className=\"terminal-container\" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: terminalSettings.theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: terminalSettings.theme === 'dark' ? '#ffffff' : '#000000'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                backgroundColor: terminalSettings.theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                borderBottom: '1px solid #444'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TerminalIcon size={20} />
                    <span style={{ fontWeight: 'bold' }}>Terminal</span>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: connected ? '#00d26a' : '#ff4757'
                    }} />
                </div>
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setTerminalSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
                        style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: 'inherit',
                            cursor: 'pointer'
                        }}
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>
            
            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                backgroundColor: terminalSettings.theme === 'dark' ? '#2d2d2d' : '#e9ecef',
                borderBottom: '1px solid #444',
                overflowX: 'auto'
            }}>
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTabId === tab.id 
                                ? (terminalSettings.theme === 'dark' ? '#1e1e1e' : '#ffffff')
                                : 'transparent',
                            borderRight: '1px solid #444',
                            cursor: 'pointer',
                            minWidth: '120px',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ 
                            flex: 1, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem'
                        }}>
                            {tab.name}
                        </span>
                        
                        {tab.isRunning && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    killProcess(tab.id);
                                }}
                                style={{
                                    padding: '2px',
                                    backgroundColor: '#ff4757',
                                    border: 'none',
                                    borderRadius: '2px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <Square size={10} />
                            </button>
                        )}
                        
                        {tabs.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab.id);
                                }}
                                style={{
                                    padding: '2px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#666',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}
                
                <button
                    onClick={createNewTab}
                    disabled={tabs.length >= maxTabs}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: tabs.length >= maxTabs ? '#666' : 'inherit',
                        cursor: tabs.length >= maxTabs ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Plus size={16} />
                </button>
            </div>
            
            {/* Terminal Content */}
            {activeTab && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Working Directory */}
                    <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: terminalSettings.theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                        borderBottom: '1px solid #444',
                        fontSize: '0.875rem',
                        color: '#888'
                    }}>
                        Working Directory: {activeTab.workingDirectory}
                        {activeTab.isRunning && (
                            <span style={{ marginLeft: '1rem', color: '#ffa502' }}>
                                Running PID: {activeTab.pid}
                            </span>
                        )}
                    </div>
                    
                    {/* Output Area */}
                    <div
                        ref={(el) => {
                            if (el) terminalRefs.current.set(activeTab.id, el);
                        }}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            overflowY: 'auto',
                            backgroundColor: terminalSettings.theme === 'dark' ? '#1e1e1e' : '#ffffff',
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
                        }}
                    >
                        {activeTab.output.map(entry => (
                            <div key={entry.id} style={getOutputStyle(entry.stream)}>
                                {entry.content}
                            </div>
                        ))}
                        
                        {/* Command Input Line */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '0.5rem'
                        }}>
                            <span style={{ 
                                color: '#5f27cd', 
                                fontWeight: 'bold',
                                marginRight: '0.5rem'
                            }}>
                                $
                            </span>
                            <input
                                type=\"text\"
                                value={activeTab.currentCommand}
                                onChange={(e) => handleCommandChange(activeTab.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(activeTab.id, e)}
                                disabled={activeTab.isRunning}
                                style={{
                                    flex: 1,
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'inherit',
                                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                                    fontSize: `${terminalSettings.fontSize}px`
                                }}
                                placeholder={activeTab.isRunning ? 'Command running...' : 'Enter command...'}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 1rem',
                        backgroundColor: terminalSettings.theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
                        borderTop: '1px solid #444',
                        fontSize: '0.75rem',
                        color: '#888'
                    }}>
                        <div>
                            History: {activeTab.history.length} commands
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => clearTerminal(activeTab.id)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #666',
                                    borderRadius: '4px',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Clear
                            </button>
                            <span>
                                Output: {activeTab.output.length} lines
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Terminal;