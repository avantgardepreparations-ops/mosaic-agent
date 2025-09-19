import React, { useState } from 'react';
import './App.css';
import FileManager from './components/FileManager/FileManager';
import Terminal from './components/Terminal/Terminal';

function App() {
  const [currentView, setCurrentView] = useState('files');

  return (
    <div className="App">
      <header className="app-header">
        <div className="app-title">
          <h1>🗂️ Mosaic Agent</h1>
          <p>File Management & Terminal</p>
        </div>
        <nav className="app-nav">
          <button 
            className={`nav-button ${currentView === 'files' ? 'active' : ''}`}
            onClick={() => setCurrentView('files')}
          >
            📁 Files
          </button>
          <button 
            className={`nav-button ${currentView === 'terminal' ? 'active' : ''}`}
            onClick={() => setCurrentView('terminal')}
          >
            💻 Terminal
          </button>
          <button 
            className={`nav-button ${currentView === 'split' ? 'active' : ''}`}
            onClick={() => setCurrentView('split')}
          >
            🔀 Split View
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'files' && (
          <div className="single-view">
            <FileManager />
          </div>
        )}
        
        {currentView === 'terminal' && (
          <div className="single-view">
            <Terminal />
          </div>
        )}
        
        {currentView === 'split' && (
          <div className="split-view">
            <div className="split-panel">
              <FileManager />
            </div>
            <div className="split-divider"></div>
            <div className="split-panel">
              <Terminal />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="status-info">
          <span>🟢 Connected</span>
          <span>Version 1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;