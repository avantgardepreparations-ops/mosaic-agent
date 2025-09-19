import React, { useEffect, useRef } from 'react';

const TerminalTab = ({ output, loading, error, workingDirectory }) => {
  const outputRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatExecutionTime = (ms) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderOutputLine = (line, index) => {
    // Detect line type based on content
    let className = 'output-line';
    
    if (line.startsWith('ERROR:') || line.startsWith('error:')) {
      className += ' error';
    } else if (line.startsWith('WARNING:') || line.startsWith('warning:')) {
      className += ' warning';
    } else if (line.startsWith('SUCCESS:') || line.startsWith('✓')) {
      className += ' success';
    } else if (line.startsWith('INFO:') || line.startsWith('ℹ')) {
      className += ' info';
    }

    return (
      <div key={index} className={className}>
        {line}
      </div>
    );
  };

  const renderCommandExecution = (execution, index) => {
    return (
      <div key={index} className="command-execution">
        <div className="command-header">
          <span>$ {execution.command}</span>
          <span className="command-timestamp">
            {formatTimestamp(execution.timestamp)}
          </span>
        </div>
        
        {execution.output && (
          <div className="command-output">
            {execution.output.split('\n').map((line, lineIndex) => 
              renderOutputLine(line, `${index}-${lineIndex}`)
            )}
          </div>
        )}
        
        {execution.error && (
          <div className="command-error">
            {execution.error.split('\n').map((line, lineIndex) => (
              <div key={lineIndex} className="output-line error">
                {line}
              </div>
            ))}
          </div>
        )}
        
        <div className="execution-info">
          <span>Exit Code: {execution.exitCode}</span>
          <span>Duration: {formatExecutionTime(execution.executionTime)}</span>
          <span>Working Dir: {execution.workingDir || workingDirectory}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="terminal-output" ref={outputRef}>
      {/* Welcome message */}
      {(!output || output.length === 0) && !loading && (
        <div className="welcome-message">
          <div className="output-line info">
            🖥️ Mosaic Agent Terminal
          </div>
          <div className="output-line">
            Welcome to the integrated terminal. You can run commands safely in a sandboxed environment.
          </div>
          <div className="output-line">
            Type commands below or use the history panel to see previous commands.
          </div>
          <div className="output-line">
            Current working directory: {workingDirectory}
          </div>
          <div className="output-line">
            ---
          </div>
        </div>
      )}

      {/* Command output */}
      {output && output.map((item, index) => {
        if (typeof item === 'string') {
          return renderOutputLine(item, index);
        } else if (item.type === 'command') {
          return renderCommandExecution(item, index);
        } else {
          return renderOutputLine(JSON.stringify(item), index);
        }
      })}

      {/* Loading indicator */}
      {loading && (
        <div className="terminal-loading">
          <div className="spinner"></div>
          <span>Executing command...</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="terminal-error">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default TerminalTab;