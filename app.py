#!/usr/bin/env python3
"""
Mosaic Agent - Backend API for AI Coding Tools Management
Centralizes management of various open source AI tools.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import requests
import json
import os
import psutil
import platform
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)

# Configuration
CONFIG = {
    'OLLAMA_URL': 'http://localhost:11434',
    'CHROMADB_URL': 'http://localhost:8000',
    'JUPYTER_PORT': 8888,
    'WHISPER_MODEL_PATH': './models/ggml-base.bin',
    'MODELS_DIR': './models'
}

# Tool status tracking
tool_status = {
    'ollama': {'active': False, 'port': 11434, 'process': None},
    'whisper': {'active': False, 'port': None, 'process': None},
    'chromadb': {'active': False, 'port': 8000, 'process': None},
    'langchain': {'active': False, 'port': None, 'process': None},
    'jupyter': {'active': False, 'port': 8888, 'process': None},
    'faiss': {'active': False, 'port': None, 'process': None},
    'stable-diffusion': {'active': False, 'port': None, 'process': None},
    'text-generation-webui': {'active': False, 'port': 7860, 'process': None},
    'docker': {'active': False, 'port': None, 'process': None}
}

def check_system_compatibility():
    """Check system compatibility for AI tools"""
    system_info = {
        'os': platform.system(),
        'os_version': platform.platform(),
        'architecture': platform.architecture()[0],
        'processor': platform.processor(),
        'ram_gb': round(psutil.virtual_memory().total / (1024**3), 1),
        'cpu_count': psutil.cpu_count(),
        'disk_free_gb': round(psutil.disk_usage('/').free / (1024**3), 1)
    }
    
    # MacBook Pro 2015 specific recommendations
    recommendations = []
    if system_info['ram_gb'] <= 8:
        recommendations.append("Use quantized models (GGUF, int4/int8) for better performance")
    if 'Intel' in system_info['processor']:
        recommendations.append("CPU-only inference recommended - GPU acceleration not available")
    if system_info['disk_free_gb'] < 10:
        recommendations.append("Ensure at least 10GB free space for AI models")
    
    return system_info, recommendations

def check_port_available(port):
    """Check if a port is available"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result != 0

def check_tool_installed(tool_name):
    """Check if a tool is installed"""
    try:
        if tool_name == 'ollama':
            result = subprocess.run(['ollama', '--version'], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        elif tool_name == 'docker':
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        elif tool_name == 'whisper':
            result = subprocess.run(['whisper', '--help'], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        elif tool_name == 'jupyter':
            result = subprocess.run(['jupyter', '--version'], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        # For Python packages, check imports
        elif tool_name in ['chromadb', 'langchain', 'faiss']:
            import importlib
            try:
                if tool_name == 'faiss':
                    importlib.import_module('faiss')
                else:
                    importlib.import_module(tool_name)
                return True
            except ImportError:
                return False
    except Exception:
        return False
    return False

def start_ollama():
    """Start Ollama service"""
    try:
        if check_tool_installed('ollama'):
            # Start ollama serve in background
            process = subprocess.Popen(['ollama', 'serve'], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE)
            tool_status['ollama']['process'] = process
            tool_status['ollama']['active'] = True
            return True, "Ollama started successfully"
        else:
            return False, "Ollama not installed. Run: brew install ollama"
    except Exception as e:
        return False, f"Failed to start Ollama: {str(e)}"

def stop_ollama():
    """Stop Ollama service"""
    try:
        if tool_status['ollama']['process']:
            tool_status['ollama']['process'].terminate()
            tool_status['ollama']['process'] = None
        tool_status['ollama']['active'] = False
        return True, "Ollama stopped successfully"
    except Exception as e:
        return False, f"Failed to stop Ollama: {str(e)}"

def start_jupyter():
    """Start JupyterLab"""
    try:
        if check_tool_installed('jupyter'):
            process = subprocess.Popen(['jupyter', 'lab', '--port', str(CONFIG['JUPYTER_PORT']), '--no-browser'],
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE)
            tool_status['jupyter']['process'] = process
            tool_status['jupyter']['active'] = True
            return True, f"JupyterLab started on port {CONFIG['JUPYTER_PORT']}"
        else:
            return False, "JupyterLab not installed. Run: pip install jupyterlab"
    except Exception as e:
        return False, f"Failed to start JupyterLab: {str(e)}"

def stop_jupyter():
    """Stop JupyterLab"""
    try:
        if tool_status['jupyter']['process']:
            tool_status['jupyter']['process'].terminate()
            tool_status['jupyter']['process'] = None
        tool_status['jupyter']['active'] = False
        return True, "JupyterLab stopped successfully"
    except Exception as e:
        return False, f"Failed to stop JupyterLab: {str(e)}"

def start_chromadb():
    """Start ChromaDB server"""
    try:
        if check_tool_installed('chromadb'):
            # Start ChromaDB server
            process = subprocess.Popen(['python', '-c', 
                                      'import chromadb; chromadb.HttpClient(host="localhost", port=8000)'],
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE)
            tool_status['chromadb']['process'] = process
            tool_status['chromadb']['active'] = True
            return True, "ChromaDB started successfully"
        else:
            return False, "ChromaDB not installed. Run: pip install chromadb"
    except Exception as e:
        return False, f"Failed to start ChromaDB: {str(e)}"

def stop_chromadb():
    """Stop ChromaDB server"""
    try:
        if tool_status['chromadb']['process']:
            tool_status['chromadb']['process'].terminate()
            tool_status['chromadb']['process'] = None
        tool_status['chromadb']['active'] = False
        return True, "ChromaDB stopped successfully"
    except Exception as e:
        return False, f"Failed to stop ChromaDB: {str(e)}"

# API Routes

@app.route('/api/system/info', methods=['GET'])
def get_system_info():
    """Get system information and compatibility"""
    system_info, recommendations = check_system_compatibility()
    
    return jsonify({
        'system': system_info,
        'recommendations': recommendations,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/tools/status', methods=['GET'])
def get_tools_status():
    """Get status of all AI tools"""
    status_data = {}
    
    for tool_name, status in tool_status.items():
        status_data[tool_name] = {
            'active': status['active'],
            'installed': check_tool_installed(tool_name),
            'port': status.get('port'),
            'port_available': check_port_available(status['port']) if status.get('port') else True
        }
    
    return jsonify(status_data)

@app.route('/api/tools/<tool_name>/start', methods=['POST'])
def start_tool(tool_name):
    """Start a specific AI tool"""
    try:
        if tool_name == 'ollama':
            success, message = start_ollama()
        elif tool_name == 'jupyter':
            success, message = start_jupyter()
        elif tool_name == 'chromadb':
            success, message = start_chromadb()
        elif tool_name in ['whisper', 'langchain', 'faiss']:
            # These are libraries, not services
            tool_status[tool_name]['active'] = True
            success, message = True, f"{tool_name} activated (library mode)"
        elif tool_name == 'docker':
            # Check if Docker is running
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                tool_status['docker']['active'] = True
                success, message = True, "Docker is running"
            else:
                success, message = False, "Docker is not running. Start Docker Desktop."
        elif tool_name == 'stable-diffusion':
            # Simulate activation (would require more complex setup)
            tool_status[tool_name]['active'] = True
            success, message = True, "Stable Diffusion activated (note: performance limited on CPU)"
        elif tool_name == 'text-generation-webui':
            success, message = False, "Manual installation required - see documentation"
        else:
            success, message = False, f"Unknown tool: {tool_name}"
        
        return jsonify({
            'success': success,
            'message': message,
            'tool': tool_name,
            'active': tool_status.get(tool_name, {}).get('active', False)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Error starting {tool_name}: {str(e)}",
            'tool': tool_name,
            'active': False
        }), 500

@app.route('/api/tools/<tool_name>/stop', methods=['POST'])
def stop_tool(tool_name):
    """Stop a specific AI tool"""
    try:
        if tool_name == 'ollama':
            success, message = stop_ollama()
        elif tool_name == 'jupyter':
            success, message = stop_jupyter()
        elif tool_name == 'chromadb':
            success, message = stop_chromadb()
        elif tool_name in ['whisper', 'langchain', 'faiss', 'stable-diffusion']:
            tool_status[tool_name]['active'] = False
            success, message = True, f"{tool_name} deactivated"
        elif tool_name == 'docker':
            tool_status['docker']['active'] = False
            success, message = True, "Docker marked as inactive"
        else:
            success, message = False, f"Unknown tool: {tool_name}"
        
        return jsonify({
            'success': success,
            'message': message,
            'tool': tool_name,
            'active': tool_status.get(tool_name, {}).get('active', False)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Error stopping {tool_name}: {str(e)}",
            'tool': tool_name,
            'active': True
        }), 500

@app.route('/api/ollama/models', methods=['GET'])
def get_ollama_models():
    """Get list of available Ollama models"""
    try:
        response = requests.get(f"{CONFIG['OLLAMA_URL']}/api/tags", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            return jsonify({'error': 'Ollama not accessible'}), 503
    except Exception as e:
        return jsonify({'error': f'Failed to connect to Ollama: {str(e)}'}), 503

@app.route('/api/ollama/generate', methods=['POST'])
def ollama_generate():
    """Generate text using Ollama"""
    try:
        data = request.json
        model = data.get('model', 'llama2')
        prompt = data.get('prompt', '')
        
        response = requests.post(f"{CONFIG['OLLAMA_URL']}/api/generate", 
                               json={'model': model, 'prompt': prompt, 'stream': False},
                               timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            return jsonify({'error': 'Generation failed'}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to generate: {str(e)}'}), 500

@app.route('/api/whisper/transcribe', methods=['POST'])
def whisper_transcribe():
    """Transcribe audio using Whisper"""
    try:
        # This would handle file upload and transcription
        # For now, return a mock response
        return jsonify({
            'transcription': 'Audio transcription functionality requires file upload implementation',
            'language': 'en',
            'confidence': 0.95
        })
    except Exception as e:
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/health', methods=['GET'])
def health_alias():
    """Health check endpoint alias for frontend compatibility"""
    return health_check()

@app.route('/api/install-guide', methods=['GET'])
def get_install_guide():
    """Get installation guide for AI tools"""
    guide = {
        'ollama': {
            'command': 'brew install ollama',
            'description': 'Local LLM server for running language models',
            'post_install': [
                'ollama pull llama2:7b-chat-q4_0',
                'ollama serve'
            ]
        },
        'whisper': {
            'command': 'pip install openai-whisper',
            'description': 'Speech-to-text transcription',
            'post_install': [
                'Download model: whisper --model base audio.wav'
            ]
        },
        'chromadb': {
            'command': 'pip install chromadb',
            'description': 'Vector database for embeddings',
            'post_install': [
                'Import in Python: import chromadb'
            ]
        },
        'langchain': {
            'command': 'pip install langchain',
            'description': 'Framework for LLM applications',
            'post_install': [
                'Install additional dependencies as needed'
            ]
        },
        'jupyter': {
            'command': 'pip install jupyterlab',
            'description': 'Interactive development environment',
            'post_install': [
                'jupyter lab'
            ]
        },
        'faiss': {
            'command': 'pip install faiss-cpu',
            'description': 'Similarity search and clustering',
            'post_install': [
                'Import in Python: import faiss'
            ]
        },
        'docker': {
            'command': 'brew install --cask docker',
            'description': 'Containerization platform',
            'post_install': [
                'Start Docker Desktop application'
            ]
        },
        'stable-diffusion': {
            'command': 'pip install diffusers torch torchvision',
            'description': 'Text-to-image generation (CPU mode)',
            'post_install': [
                'Note: Very slow on CPU, consider cloud alternatives'
            ]
        }
    }
    
    return jsonify(guide)

@app.route('/api/agent/final/test', methods=['GET'])
def agent_final_test():
    """Test endpoint for Final Agent"""
    try:
        from agents.agent_final import FinalAgent, simulate_final_agent_payload
        agent = FinalAgent()
        payload = simulate_final_agent_payload()
        result = agent.run(payload)
        return result, 200
    except Exception as e:
        return jsonify({
            "error": {
                "code": "AGENT_ERROR",
                "details": [f"Failed to run Final Agent: {str(e)}"]
            }
        }), 500

def cleanup_processes():
    """Cleanup background processes on shutdown"""
    for tool_name, status in tool_status.items():
        if status.get('process'):
            try:
                status['process'].terminate()
            except:
                pass

import atexit
atexit.register(cleanup_processes)

if __name__ == '__main__':
    print("🤖 Mosaic Agent Backend starting...")
    print(f"📊 System info: {platform.platform()}")
    print(f"💾 RAM: {round(psutil.virtual_memory().total / (1024**3), 1)} GB")
    print("🚀 Starting Flask server on http://localhost:5000")
    
    # Check for required tools on startup
    print("\n🔍 Checking installed tools:")
    for tool in ['ollama', 'docker', 'jupyter']:
        installed = check_tool_installed(tool)
        status = "✅" if installed else "❌"
        print(f"   {status} {tool}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)