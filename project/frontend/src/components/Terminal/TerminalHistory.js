import React from 'react';

const TerminalHistory = ({ history, onSelectCommand, onClearHistory }) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  const formatExecutionTime = (ms) => {
    if (!ms) return '';
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (exitCode) => {
    if (exitCode === 0) return '✅';
    if (exitCode === -1) return '💥';
    return '❌';
  };

  const groupHistoryByDate = (history) => {
    const groups = {};
    
    history.forEach(item => {
      const date = item.timestamp ? 
        new Date(item.timestamp).toDateString() : 
        'Unknown Date';
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    
    return groups;
  };

  const groupedHistory = groupHistoryByDate(history);
  const dates = Object.keys(groupedHistory).sort((a, b) => 
    new Date(b) - new Date(a)
  );

  if (history.length === 0) {
    return (
      <div className="history-panel">
        <div className="history-header">
          <h3 className="history-title">Command History</h3>
        </div>
        <div className="history-empty">
          No commands executed yet.
          <br />
          Start typing commands to see them here.
        </div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3 className="history-title">
          Command History ({history.length})
        </h3>
        <button 
          className="history-clear"
          onClick={onClearHistory}
          title="Clear all history"
        >
          Clear
        </button>
      </div>
      
      <div className="history-list">
        {dates.map(date => (
          <div key={date}>
            <div className="history-date-group">
              <div className="history-date-header">
                {date === new Date().toDateString() ? 'Today' : date}
              </div>
              
              {groupedHistory[date].map((item, index) => (
                <div
                  key={`${date}-${index}`}
                  className="history-item"
                  onClick={() => onSelectCommand(item.command)}
                  title={`Click to use this command\nExit code: ${item.exitCode}\nExecution time: ${formatExecutionTime(item.executionTime)}`}
                >
                  <div className="history-item-header">
                    <span className="history-item-status">
                      {getStatusIcon(item.exitCode)}
                    </span>
                    <span className="history-item-command">
                      {item.command}
                    </span>
                  </div>
                  
                  <div className="history-item-details">
                    <div className="history-item-time">
                      {formatTimestamp(item.timestamp)}
                    </div>
                    
                    {item.executionTime && (
                      <div className="history-item-duration">
                        {formatExecutionTime(item.executionTime)}
                      </div>
                    )}
                    
                    {item.workingDir && (
                      <div className="history-item-dir">
                        📁 {item.workingDir}
                      </div>
                    )}
                  </div>
                  
                  {item.output && (
                    <div className="history-item-preview">
                      {item.output.split('\n')[0].substring(0, 50)}
                      {item.output.length > 50 ? '...' : ''}
                    </div>
                  )}
                  
                  {item.error && (
                    <div className="history-item-error">
                      ❌ {item.error.split('\n')[0].substring(0, 50)}
                      {item.error.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .history-date-group {
          margin-bottom: 1rem;
        }
        
        .history-date-header {
          color: #48bb78;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(72, 187, 120, 0.1);
          border-radius: 4px;
          border-left: 3px solid #48bb78;
        }
        
        .history-item-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        
        .history-item-status {
          font-size: 0.875rem;
          min-width: 20px;
        }
        
        .history-item-command {
          font-family: 'Courier New', Monaco, monospace;
          font-weight: 600;
          flex: 1;
          word-break: break-word;
        }
        
        .history-item-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          font-size: 0.75rem;
          color: #a0aec0;
          margin-bottom: 0.25rem;
        }
        
        .history-item-duration {
          color: #4299e1;
        }
        
        .history-item-dir {
          color: #ed8936;
          font-family: 'Courier New', Monaco, monospace;
        }
        
        .history-item-preview {
          font-size: 0.75rem;
          color: #68d391;
          font-family: 'Courier New', Monaco, monospace;
          background: rgba(104, 211, 145, 0.1);
          padding: 0.25rem;
          border-radius: 3px;
          margin-top: 0.25rem;
          border-left: 2px solid #68d391;
        }
        
        .history-item-error {
          font-size: 0.75rem;
          color: #f56565;
          font-family: 'Courier New', Monaco, monospace;
          background: rgba(245, 101, 101, 0.1);
          padding: 0.25rem;
          border-radius: 3px;
          margin-top: 0.25rem;
          border-left: 2px solid #f56565;
        }
        
        .history-item:hover .history-item-command {
          color: #48bb78;
        }
        
        .history-item:hover .history-item-preview {
          background: rgba(104, 211, 145, 0.2);
        }
        
        .history-item:hover .history-item-error {
          background: rgba(245, 101, 101, 0.2);
        }
      `}</style>
    </div>
  );
};

export default TerminalHistory;