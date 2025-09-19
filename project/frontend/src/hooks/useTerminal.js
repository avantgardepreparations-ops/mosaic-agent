import { useState, useEffect, useCallback, useRef } from 'react';
import { terminalService } from '../services/terminalService';

export const useTerminal = () => {
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/terminal/connect`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Terminal WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Terminal WebSocket disconnected');
        setConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connectWebSocket();
          }, delay);
        } else {
          setError('Connection lost. Please refresh the page to reconnect.');
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Terminal WebSocket error:', error);
        setError('WebSocket connection error');
      };
      
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to terminal service');
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'command_start':
        setLoading(true);
        setError(null);
        addToOutput({
          type: 'command',
          command: data.command,
          timestamp: data.timestamp,
          status: 'running'
        });
        break;
        
      case 'command_complete':
        setLoading(false);
        updateLastCommand({
          output: data.output,
          error: data.error,
          exitCode: data.exitCode,
          executionTime: data.executionTime,
          status: 'completed'
        });
        break;
        
      case 'error':
        setLoading(false);
        setError(data.message);
        break;
        
      case 'history':
        setHistory(data.history || []);
        break;
        
      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };

  // Add output to the terminal
  const addToOutput = (item) => {
    setOutput(prev => [...prev, item]);
  };

  // Update the last command in output
  const updateLastCommand = (updates) => {
    setOutput(prev => {
      const newOutput = [...prev];
      const lastIndex = newOutput.length - 1;
      
      if (lastIndex >= 0 && newOutput[lastIndex].type === 'command') {
        newOutput[lastIndex] = { ...newOutput[lastIndex], ...updates };
      }
      
      return newOutput;
    });
  };

  // Execute command via HTTP API (fallback when WebSocket is not available)
  const executeCommandHTTP = async (command, workingDir = './') => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    addToOutput({
      type: 'command',
      command,
      timestamp: new Date().toISOString(),
      status: 'running'
    });
    
    try {
      const result = await terminalService.executeCommand(command, workingDir);
      
      updateLastCommand({
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        executionTime: Date.now() - startTime,
        workingDir: result.workingDir,
        status: 'completed'
      });
      
      return result;
    } catch (err) {
      setError(err.message || 'Command execution failed');
      updateLastCommand({
        error: err.message,
        exitCode: -1,
        executionTime: Date.now() - startTime,
        status: 'error'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Execute command (WebSocket preferred, HTTP fallback)
  const executeCommand = async (command, workingDir = './') => {
    if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
      // Use WebSocket for real-time output
      try {
        wsRef.current.send(JSON.stringify({
          type: 'command',
          payload: { command, workingDir }
        }));
      } catch (err) {
        console.error('WebSocket send failed, falling back to HTTP:', err);
        return executeCommandHTTP(command, workingDir);
      }
    } else {
      // Fallback to HTTP API
      return executeCommandHTTP(command, workingDir);
    }
  };

  // Clear terminal output
  const clearOutput = () => {
    setOutput([]);
    setError(null);
  };

  // Get command history
  const getHistory = async () => {
    try {
      const result = await terminalService.getHistory();
      setHistory(result.history || []);
      return result.history || [];
    } catch (err) {
      console.error('Failed to get history:', err);
      return [];
    }
  };

  // Get available commands
  const getCommands = async () => {
    try {
      return await terminalService.getCommands();
    } catch (err) {
      console.error('Failed to get commands:', err);
      return [];
    }
  };

  // Validate command
  const validateCommand = async (command) => {
    try {
      return await terminalService.validateCommand(command);
    } catch (err) {
      console.error('Failed to validate command:', err);
      return { valid: false, errors: [err.message] };
    }
  };

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Load initial history
  useEffect(() => {
    getHistory();
  }, []);

  return {
    output,
    loading,
    error,
    connected,
    history,
    executeCommand,
    clearOutput,
    getHistory,
    getCommands,
    validateCommand,
    reconnect: connectWebSocket
  };
};