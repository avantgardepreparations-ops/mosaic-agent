const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// Import routes
const filesRouter = require('./routes/files');
const terminalRouter = require('./routes/terminal');

// Import middleware
const securityMiddleware = require('./middleware/security');

const app = express();
const server = http.createServer(app);

// WebSocket server for terminal
const wss = new WebSocket.Server({ server, path: '/api/terminal/connect' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);

// Routes
app.use('/api/files', filesRouter);
app.use('/api/terminal', terminalRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Serve static files for uploaded content (with security)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WebSocket handling for terminal
wss.on('connection', (ws, req) => {
  console.log('Terminal WebSocket connection established');
  
  // Import terminal service here to avoid circular dependencies
  const TerminalService = require('./services/terminalService');
  const terminalSession = new TerminalService(ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      terminalSession.handleMessage(data);
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Terminal WebSocket connection closed');
    terminalSession.cleanup();
  });
  
  ws.on('error', (error) => {
    console.error('Terminal WebSocket error:', error);
    terminalSession.cleanup();
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Mosaic Agent Server running on port ${PORT}`);
  console.log(`📁 File management API: http://localhost:${PORT}/api/files`);
  console.log(`💻 Terminal WebSocket: ws://localhost:${PORT}/api/terminal/connect`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;