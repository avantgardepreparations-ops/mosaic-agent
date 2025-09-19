import React, { useState, useEffect, useRef } from 'react';
import TerminalTab from './TerminalTab';
import TerminalHistory from './TerminalHistory';
import './Terminal.css';
import { useTerminal } from '../../hooks/useTerminal';

const Terminal = () => {
  const [tabs, setTabs] = useState([{ id: 1, title: 'Terminal 1', active: true }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [command, setCommand] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('./');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const tabIdCounter = useRef(2);

  const {
    output,
    loading,
    error,
    connected,
    executeCommand,
    clearOutput,
    getHistory,
    getCommands
  } = useTerminal();

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Load command history
    loadCommandHistory();
    
    // Get working directory
    getWorkingDirectory();
  }, []);

  const loadCommandHistory = async () => {
    try {
      const history = await getHistory();
      setCommandHistory(history);
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  };

  const getWorkingDirectory = async () => {
    try {
      const response = await fetch('/api/terminal/working-directory');
      const data = await response.json();
      if (response.ok) {
        setWorkingDirectory(data.workingDirectory);
      }
    } catch (error) {
      console.error('Failed to get working directory:', error);
    }
  };

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add to local history
    const newHistory = [...commandHistory, command];
    setCommandHistory(newHistory);
    setHistoryIndex(-1);
    
    // Execute command
    try {
      await executeCommand(command, workingDirectory);
      setCommand('');
    } catch (error) {
      console.error('Command execution failed:', error);
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 ? 
            commandHistory.length - 1 : 
            Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex] || '');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setCommand('');
          } else {
            setHistoryIndex(newIndex);
            setCommand(commandHistory[newIndex] || '');
          }
        }
        break;
        
      case 'Tab':
        e.preventDefault();
        handleAutoComplete();
        break;
        
      case 'Escape':
        setCommand('');
        setHistoryIndex(-1);
        break;
    }
  };

  const handleAutoComplete = async () => {
    // Simple auto-completion for commands
    try {
      const commands = await getCommands();
      const currentWord = command.split(' ').pop();
      
      if (currentWord && commands.length > 0) {
        const matches = commands.filter(cmd => 
          cmd.command.startsWith(currentWord)
        );
        
        if (matches.length === 1) {
          const parts = command.split(' ');
          parts[parts.length - 1] = matches[0].command;
          setCommand(parts.join(' ') + ' ');
        } else if (matches.length > 1) {
          // Show available options in output
          const matchList = matches.map(m => `${m.command} - ${m.description}`).join('\n');
          console.log('Available commands:\n' + matchList);
        }
      }
    } catch (error) {
      console.error('Auto-completion failed:', error);
    }
  };

  const addNewTab = () => {
    const newTab = {
      id: tabIdCounter.current++,
      title: `Terminal ${tabIdCounter.current - 1}`,
      active: false
    };
    
    setTabs(prevTabs => {
      const updatedTabs = prevTabs.map(tab => ({ ...tab, active: false }));
      return [...updatedTabs, { ...newTab, active: true }];
    });
    
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId) => {
    if (tabs.length <= 1) return; // Keep at least one tab
    
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If closing active tab, activate another one
      if (tabId === activeTabId && newTabs.length > 0) {
        newTabs[newTabs.length - 1].active = true;
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      
      return newTabs;
    });
  };

  const switchTab = (tabId) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => ({ 
        ...tab, 
        active: tab.id === tabId 
      }))
    );
    setActiveTabId(tabId);
  };

  const getPrompt = () => {
    const cwd = workingDirectory.split('/').pop() || workingDirectory;
    return `$ ${cwd} `;
  };

  return (
    <div className="terminal">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`terminal-tab ${tab.active ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
            >
              <span>{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="add-tab-btn" onClick={addNewTab}>
            +
          </button>
        </div>
        
        <div className="terminal-controls">
          <button
            className={`control-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Command History"
          >
            📜
          </button>
          <button
            className="control-btn"
            onClick={clearOutput}
            title="Clear Terminal"
          >
            🗑️
          </button>
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢' : '🔴'}
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="terminal-content">
        <div className="terminal-main">
          {/* Terminal Output */}
          <TerminalTab
            output={output}
            loading={loading}
            error={error}
            workingDirectory={workingDirectory}
          />
          
          {/* Command Input */}
          <form className="command-input-form" onSubmit={handleCommandSubmit}>
            <div className="command-line">
              <span className="prompt">{getPrompt()}</span>
              <input
                ref={inputRef}
                type="text"
                className="command-input"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                disabled={loading}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </form>
        </div>
        
        {/* Command History Sidebar */}
        {showHistory && (
          <div className="terminal-sidebar">
            <TerminalHistory
              history={commandHistory}
              onSelectCommand={(cmd) => {
                setCommand(cmd);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              onClearHistory={() => {
                setCommandHistory([]);
                // Also clear server-side history
                fetch('/api/terminal/clear-history', { method: 'POST' })
                  .catch(err => console.error('Failed to clear server history:', err));
              }}
            />
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="terminal-footer">
        <div className="terminal-info">
          <span>Working Directory: {workingDirectory}</span>
          <span>Commands: {commandHistory.length}</span>
          {loading && <span className="loading-indicator">Executing...</span>}
        </div>
        <div className="terminal-help">
          <span>↑↓ History | Tab Autocomplete | Esc Clear</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;