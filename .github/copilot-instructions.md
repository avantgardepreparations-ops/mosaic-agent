# Mosaic Agent - GitHub Copilot Instructions

Always follow these instructions first and fallback to additional search and context gathering only if the information in the instructions is incomplete or found to be in error.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Install Python dependencies: `pip3 install -r requirements.txt` -- takes 5 seconds. Set timeout to 60+ seconds.
- Install Node.js dependencies: `npm install` -- takes 18 seconds. Set timeout to 300+ seconds (5 minutes).
- Install main directory dependencies: `cd main && npm install` -- takes 1 second. Set timeout to 60+ seconds.
- Install main Python dependencies: `cd main && pip3 install -r requirements.txt` -- may timeout due to network issues. Document as "may fail due to network timeouts".

### Running the Application
- ALWAYS run the bootstrapping steps first.
- Start the Flask backend: `python3 app.py` -- starts immediately. NEVER CANCEL. Backend runs on http://localhost:5000
- Open the frontend: Open `index.html` in your browser (static HTML file with Tailwind CSS)
- Alternative: Access via Flask at http://localhost:5000 (serves 404, use direct file access)

### Testing and Validation
- Run comprehensive validation: `./test-installation.sh` -- takes 8 seconds. NEVER CANCEL. Set timeout to 300+ seconds.
- Test Node.js separation: `cd main && node test-separation.js` -- takes 0.1 seconds. Set timeout to 30+ seconds.
- Run Python tests: `cd main && python -m pytest tests/ -v` -- requires FastAPI dependencies that may timeout during install.
- Run npm linting: `npm run lint` -- fails due to missing backend/ directory structure.
- Run npm tests: `npm test` -- exits with code 1, no tests found due to jest configuration.

## Validation

### CRITICAL Build and Test Timing
- **pip install**: 5 seconds (set 60+ second timeout)
- **npm install**: 18 seconds (set 300+ second timeout) 
- **test-installation.sh**: 8 seconds (set 300+ second timeout)
- **NEVER CANCEL** any build or test command - wait for completion

### Manual Validation Requirements
- ALWAYS manually validate any changes by running through complete user scenarios.
- Test the Flask backend API endpoints:
  - `curl -s http://localhost:5000/api/system/info` should return system information JSON
  - `curl -s http://localhost:5000/api/tools/status` should return tool status JSON
- Test the frontend by opening `index.html` in browser and verifying:
  - Tailwind CSS loads properly
  - AI tools interface displays correctly
  - JavaScript functions are present (`aiTools` object in app.js)

### End-to-End Scenario Testing
After making changes, ALWAYS test this complete scenario:
1. Run `python3 app.py` to start backend
2. Open `index.html` in browser
3. Verify system info displays correctly
4. Test at least one AI tool status check
5. Confirm API endpoints respond with valid JSON

## Common Tasks

### Installing System Dependencies
- Python 3.8+ required: Already available
- Node.js: Use system package manager
- Optional AI tools:
  - Ollama: `brew install ollama` (for macOS)
  - Docker: `brew install --cask docker` (for macOS)
  - Jupyter: `pip install jupyterlab`

### Project Structure
```
mosaic-agent/
├── app.py              # Flask backend (main entry point)
├── app.js              # Frontend JavaScript
├── index.html          # Frontend HTML (Tailwind CSS)
├── requirements.txt    # Python dependencies
├── package.json        # Node.js infrastructure dependencies
├── test-installation.sh # Comprehensive validation script
├── start.sh            # Quick start script
├── main/               # Multi-agent liaison (separated from MOSAICMIND)
│   ├── app/            # FastAPI backend components
│   ├── tests/          # Python tests (requires FastAPI)
│   └── package.json    # Separate Node.js config
├── docs/               # Documentation
├── frontend/           # Additional frontend components
└── archive/            # Experimental/non-operational content
```

### Key Configuration Files
- `requirements.txt`: Flask==2.3.3, Flask-CORS==4.0.0, requests==2.31.0, psutil==5.9.5
- `package.json`: Infrastructure dependencies including Express, Jest, ESLint
- `main/requirements.txt`: FastAPI==0.104.1, uvicorn==0.24.0, pytest==7.4.3

### Port Assignments
- Flask Backend: http://localhost:5000 (main API)
- Ollama API: http://localhost:11434 (if installed)
- Jupyter Lab: http://localhost:8888 (if installed)
- ChromaDB: http://localhost:8000 (if installed)
- FastAPI Backend: http://localhost:8000 (main/start_server.py)

## Known Issues and Workarounds

### Build Issues
- `npm run lint` fails - backend/ directory structure missing
- `npm test` finds no tests - Jest configuration issue
- `cd main && pip3 install -r requirements.txt` may timeout due to network issues
- FastAPI dependencies required for main/tests/ but may fail to install

### System Compatibility
- Optimized for macOS 12.7.6+ with 8GB+ RAM
- Docker support available but tools optional
- AI tools like Ollama require separate installation
- Some features designed for MacBook Pro 2015 constraints

### Archive Directory
- `archive/` contains experimental and non-operational content
- Do NOT use code from archive/ directory
- Focus on main application in root directory

## Application Architecture

### Backend (Flask)
- `app.py` is the main Flask application
- Provides REST API for system info and AI tool management
- Manages tool status tracking and process monitoring
- CORS enabled for frontend integration

### Frontend (Static HTML/JS)
- `index.html` provides the main interface using Tailwind CSS
- `app.js` contains AI tools management logic
- Static files, no build process required
- Responsive design optimized for development workflow

### Multi-Agent System (main/)
- Separate FastAPI-based backend in `main/` directory
- STRICTLY SEPARATED from MOSAICMIND (enforced by validation)
- Independent configuration and testing
- Run via `cd main && python start_server.py`

### Dependencies Management
- Root level: Core Flask application dependencies
- main/: FastAPI and multi-agent specific dependencies
- Node.js: Infrastructure and development tools only

## Development Workflow

### Before Making Changes
1. Run `./test-installation.sh` to verify current state
2. Start Flask backend: `python3 app.py`
3. Open `index.html` to verify frontend works
4. Test API endpoints with curl commands

### After Making Changes
1. ALWAYS run `./test-installation.sh` for comprehensive validation
2. Test Flask backend starts without errors
3. Verify frontend loads properly in browser
4. Test modified API endpoints
5. Ensure all JSON responses are well-formed

### Development Tips
- Use browser developer tools to debug frontend issues
- Flask debug mode is enabled by default (auto-restart on changes)
- Log output shows tool availability on startup
- System info endpoint useful for debugging environment issues

## Remember
- NEVER CANCEL builds or long-running commands
- ALWAYS validate changes with complete user scenarios
- Use timeouts of 300+ seconds for npm operations
- Test both frontend and backend after any modifications
- The test-installation.sh script is your primary validation tool