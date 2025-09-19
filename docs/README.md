# Mosaic Agent - Web Application with File Management and Terminal

A complete web application built with React frontend and Node.js backend, featuring integrated file management and terminal functionality with security-first design.

## 🏗️ Architecture Overview

```
project/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileManager/    # File management components
│   │   │   │   ├── FileManager.js
│   │   │   │   ├── FileList.js
│   │   │   │   ├── FileUpload.js
│   │   │   │   ├── FilePreview.js
│   │   │   │   └── FileManager.css
│   │   │   └── Terminal/       # Terminal components
│   │   │       ├── Terminal.js
│   │   │       ├── TerminalTab.js
│   │   │       ├── TerminalHistory.js
│   │   │       └── Terminal.css
│   │   ├── services/           # API services
│   │   │   ├── fileService.js
│   │   │   └── terminalService.js
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useFileManager.js
│   │   │   └── useTerminal.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
└── backend/                # Node.js/Express API
    ├── routes/
    │   ├── files.js            # File management endpoints
    │   └── terminal.js         # Terminal execution endpoints
    ├── middleware/
    │   ├── security.js         # Security validation
    │   └── upload.js           # File upload handling
    ├── services/
    │   ├── fileService.js      # File operations & SQLite
    │   └── terminalService.js  # Command execution
    ├── utils/
    │   └── platformUtils.js    # Cross-platform support
    ├── server.js
    ├── package.json
    └── .env.example
```

## 🚀 Features

### File Management
- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Tree Navigation**: Browse directories with breadcrumb navigation
- **File Preview**: View images and text files with syntax highlighting
- **CRUD Operations**: Create, read, update, delete files and folders
- **Search & Filter**: Find files by name, type, or content
- **Batch Operations**: Select and operate on multiple files

### Terminal Integration
- **WebSocket Terminal**: Real-time command execution
- **Command History**: Persistent command history with search
- **Multi-tab Support**: Multiple terminal sessions
- **Auto-completion**: Tab completion for commands
- **Security Sandbox**: Whitelisted commands only

### Security Features
- **File Type Validation**: Only images, text, and code files allowed
- **Size Limits**: 50MB maximum file size
- **Command Whitelist**: Only safe commands permitted
- **Path Sanitization**: Prevent directory traversal attacks
- **Input Validation**: Comprehensive input sanitization

### Cross-Platform Support
- **Termux (Android)**: Optimized for mobile development
- **macOS/Linux**: Full desktop functionality
- **Windows**: Basic compatibility
- **Responsive Design**: Works on all screen sizes

## 🔧 Installation & Setup

### Prerequisites
- Node.js 14+ 
- npm or yarn
- SQLite3

### Backend Setup

```bash
cd project/backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the server
npm start
```

The backend will start on port 3001 by default.

### Frontend Setup

```bash
cd project/frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on port 3000 and proxy API calls to the backend.

## 📡 API Endpoints

### File Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload files (multipart/form-data) |
| GET | `/api/files?path=&recursive=` | List files and directories |
| GET | `/api/files/:id` | Get file metadata |
| GET | `/api/files/:id/preview` | Preview file content |
| GET | `/api/files/:id/download` | Download file |
| PUT | `/api/files/move` | Move/rename files |
| DELETE | `/api/files/:id` | Delete file |

### Terminal

| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/api/terminal/connect` | WebSocket connection for real-time terminal |
| POST | `/api/terminal/execute` | Execute command |
| GET | `/api/terminal/history` | Get command history |
| POST | `/api/terminal/clear-history` | Clear command history |
| GET | `/api/terminal/commands` | Get allowed commands |
| POST | `/api/terminal/validate-command` | Validate command |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## 🔒 Security Implementation

### File Upload Security
- **Type Validation**: Whitelist of allowed MIME types and extensions
- **Size Limits**: Configurable maximum file size (50MB default)
- **Path Sanitization**: Prevent directory traversal attacks
- **Virus Scanning**: Ready for integration with antivirus solutions

### Terminal Security
- **Command Whitelist**: Only predefined safe commands allowed
- **Dangerous Command Blocking**: Automatic blocking of rm -rf, sudo, etc.
- **Sandbox Execution**: Commands run in isolated environment
- **Timeout Protection**: Commands automatically killed after timeout
- **Input Sanitization**: Prevent command injection attacks

### General Security
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Secure error messages without information leakage

## 🌐 Cross-Platform Features

### Termux (Android) Support
- Optimized resource usage for mobile devices
- Termux-specific command paths and environments
- Reduced memory footprint and file size limits
- Touch-friendly interface adaptations

### macOS/Linux Optimization
- Full command set availability
- Native shell integration
- High performance file operations
- Desktop-specific UI enhancements

### Windows Compatibility
- Basic command support
- Windows-specific path handling
- PowerShell integration ready

## 🎨 UI/UX Features

### Modern Dark Theme
- Consistent color scheme across all components
- High contrast for accessibility
- Smooth animations and transitions

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly controls

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode ready

## 🧪 Testing

### Frontend Testing
```bash
cd project/frontend
npm test
```

### Backend Testing
```bash
cd project/backend
npm test
```

## 📊 Performance

### Optimizations
- Lazy loading of large file lists
- Virtual scrolling for terminal output
- Efficient WebSocket connection management
- Optimized file upload with progress tracking

### Resource Management
- Automatic cleanup of temporary files
- Memory-efficient file handling
- Connection pooling for database operations

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# File Configuration
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_PATH=./uploads

# Database
DB_PATH=./data/files.db

# Security
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing frontend framework
- Node.js community for the robust backend platform
- SQLite for the embedded database solution
- All contributors and testers

---

**Built with ❤️ for secure and efficient file management and terminal operations**