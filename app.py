#!/usr/bin/env python3
"""
Mosaic Agent - Backend Flask Application
AI Coding Interface for MacBook Pro 2015
"""

import os
import sys
import json
import subprocess
import psutil
import requests
from datetime import datetime
from flask import Flask, render_template, jsonify, request, send_from_directory
from werkzeug.serving import run_simple
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mosaic-agent-2024'

# Global state for services
services_state = {
    'ollama': {'status': 'stopped', 'port': 11434, 'pid': None},
    'whisper': {'status': 'stopped', 'model': 'base', 'pid': None},
    'chromadb': {'status': 'stopped', 'port': 8000, 'pid': None},
    'jupyter': {'status': 'stopped', 'port': 8888, 'pid': None},
    'docker': {'status': 'unknown', 'pid': None}
}

system_stats = {
    'ram_total': 8.0,  # 8GB for MacBook Pro 2015
    'ram_used': 0,
    'cpu_percent': 0,
    'active_tools': 0,
    'loaded_models': 0
}

def check_macos_compatibility():
    """Check if running on macOS and get system info"""
    try:
        if sys.platform != 'darwin':
            return False, "This application is optimized for macOS"
        
        # Get macOS version
        result = subprocess.run(['sw_vers'], capture_output=True, text=True)
        return True, result.stdout
    except Exception as e:
        return False, str(e)

def get_system_stats():
    """Get current system statistics"""
    try:
        # Get memory info
        memory = psutil.virtual_memory()
        system_stats['ram_used'] = memory.used / (1024**3)  # Convert to GB
        system_stats['cpu_percent'] = psutil.cpu_percent(interval=1)
        
        # Count active services
        active_count = sum(1 for service in services_state.values() 
                          if service['status'] == 'running')
        system_stats['active_tools'] = active_count
        
        return system_stats
    except Exception as e:
        print(f"Error getting system stats: {e}")
        return system_stats

def check_service_status(service_name):
    """Check if a service is running"""
    try:
        if service_name == 'ollama':
            try:
                response = requests.get('http://localhost:11434/api/tags', timeout=2)
                if response.status_code == 200:
                    services_state['ollama']['status'] = 'running'
                    # Count loaded models
                    models = response.json().get('models', [])
                    system_stats['loaded_models'] = len(models)
                    return True
            except:
                services_state['ollama']['status'] = 'stopped'
                return False
        
        elif service_name == 'jupyter':
            # Check if jupyter is running on port 8888
            for conn in psutil.net_connections():
                if conn.laddr.port == 8888 and conn.status == 'LISTEN':
                    services_state['jupyter']['status'] = 'running'
                    return True
            services_state['jupyter']['status'] = 'stopped'
            return False
            
        elif service_name == 'docker':
            try:
                result = subprocess.run(['docker', 'info'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    services_state['docker']['status'] = 'running'
                    return True
                else:
                    services_state['docker']['status'] = 'stopped'
                    return False
            except:
                services_state['docker']['status'] = 'not_installed'
                return False
        
        return False
    except Exception as e:
        print(f"Error checking {service_name}: {e}")
        return False

def start_ollama():
    """Start Ollama service"""
    try:
        # Check if already running
        if check_service_status('ollama'):
            return True, "Ollama is already running"
        
        # Try to start ollama
        process = subprocess.Popen(['ollama', 'serve'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        
        # Wait a moment and check if it started
        time.sleep(3)
        if check_service_status('ollama'):
            services_state['ollama']['pid'] = process.pid
            return True, "Ollama started successfully"
        else:
            return False, "Failed to start Ollama"
            
    except FileNotFoundError:
        return False, "Ollama not installed. Run: curl -fsSL https://ollama.ai/install.sh | sh"
    except Exception as e:
        return False, f"Error starting Ollama: {str(e)}"

def stop_ollama():
    """Stop Ollama service"""
    try:
        if services_state['ollama']['pid']:
            process = psutil.Process(services_state['ollama']['pid'])
            process.terminate()
            services_state['ollama']['pid'] = None
        
        services_state['ollama']['status'] = 'stopped'
        return True, "Ollama stopped"
    except Exception as e:
        return False, f"Error stopping Ollama: {str(e)}"

def start_jupyter():
    """Start JupyterLab"""
    try:
        if check_service_status('jupyter'):
            return True, "JupyterLab is already running"
        
        process = subprocess.Popen(['jupyter', 'lab', '--no-browser', '--port=8888'],
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        
        time.sleep(3)
        if check_service_status('jupyter'):
            services_state['jupyter']['pid'] = process.pid
            return True, "JupyterLab started on http://localhost:8888"
        else:
            return False, "Failed to start JupyterLab"
            
    except FileNotFoundError:
        return False, "JupyterLab not installed. Run: pip install jupyterlab"
    except Exception as e:
        return False, f"Error starting JupyterLab: {str(e)}"

def get_ollama_models():
    """Get list of available Ollama models"""
    try:
        if check_service_status('ollama'):
            response = requests.get('http://localhost:11434/api/tags', timeout=5)
            if response.status_code == 200:
                return response.json().get('models', [])
    except Exception as e:
        print(f"Error getting models: {e}")
    return []

def get_recommended_models():
    """Get list of recommended models for MacBook Pro 2015"""
    return [
        {
            'name': 'llama2:7b-chat-q4_0',
            'size': '4.0GB',
            'description': 'LLaMA 2 7B quantifié, bon équilibre performance/qualité',
            'compatibility': 'excellent'
        },
        {
            'name': 'mistral:7b-instruct-q4_K_M',
            'size': '4.4GB', 
            'description': 'Mistral 7B optimisé pour le code',
            'compatibility': 'excellent'
        },
        {
            'name': 'codellama:7b-code-q4_0',
            'size': '4.0GB',
            'description': 'Code Llama spécialisé programmation',
            'compatibility': 'excellent'
        },
        {
            'name': 'tinyllama:1.1b-chat-q8_0',
            'size': '1.2GB',
            'description': 'Ultra-rapide pour les tests',
            'compatibility': 'optimal'
        }
    ]

# Routes
@app.route('/')
def index():
    """Serve the main HTML interface"""
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

@app.route('/api/system/stats')
def api_system_stats():
    """Get current system statistics"""
    stats = get_system_stats()
    
    # Check all services
    for service_name in services_state.keys():
        check_service_status(service_name)
    
    return jsonify({
        'status': 'success',
        'data': {
            'system': stats,
            'services': services_state,
            'timestamp': datetime.now().isoformat()
        }
    })

@app.route('/api/system/compatibility')
def api_system_compatibility():
    """Check macOS compatibility"""
    is_compatible, info = check_macos_compatibility()
    return jsonify({
        'status': 'success',
        'compatible': is_compatible,
        'info': info,
        'recommendations': [
            'Utilisez des modèles quantifiés (Q4_0, Q4_K_M)',
            'Limitez la RAM à 4GB par modèle',
            'Fermez les applications non-essentielles',
            'Activez les optimisations Intel MKL'
        ]
    })

@app.route('/api/services/<service_name>/start', methods=['POST'])
def api_start_service(service_name):
    """Start a specific service"""
    if service_name == 'ollama':
        success, message = start_ollama()
    elif service_name == 'jupyter':
        success, message = start_jupyter()
    else:
        return jsonify({'status': 'error', 'message': f'Unknown service: {service_name}'})
    
    return jsonify({
        'status': 'success' if success else 'error',
        'message': message,
        'service': service_name,
        'state': services_state.get(service_name, {})
    })

@app.route('/api/services/<service_name>/stop', methods=['POST'])
def api_stop_service(service_name):
    """Stop a specific service"""
    if service_name == 'ollama':
        success, message = stop_ollama()
    else:
        success, message = True, f"{service_name} stopped (simulated)"
    
    return jsonify({
        'status': 'success' if success else 'error',
        'message': message,
        'service': service_name
    })

@app.route('/api/ollama/models')
def api_ollama_models():
    """Get Ollama models"""
    models = get_ollama_models()
    recommended = get_recommended_models()
    
    return jsonify({
        'status': 'success',
        'data': {
            'installed': models,
            'recommended': recommended
        }
    })

@app.route('/api/ollama/pull', methods=['POST'])
def api_ollama_pull():
    """Pull an Ollama model"""
    data = request.get_json()
    model_name = data.get('model')
    
    if not model_name:
        return jsonify({'status': 'error', 'message': 'Model name required'})
    
    try:
        # Start pulling model in background
        process = subprocess.Popen(['ollama', 'pull', model_name],
                                 stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE)
        
        return jsonify({
            'status': 'success',
            'message': f'Downloading {model_name}...',
            'model': model_name
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/whisper/transcribe', methods=['POST'])
def api_whisper_transcribe():
    """Transcribe audio using Whisper (placeholder)"""
    return jsonify({
        'status': 'info',
        'message': 'Whisper transcription API - Implementation needed',
        'note': 'This would integrate with whisper.cpp for local transcription'
    })

@app.route('/api/tools/install', methods=['POST'])
def api_install_tool():
    """Install a tool (provides installation commands)"""
    data = request.get_json()
    tool = data.get('tool')
    
    installation_commands = {
        'ollama': 'curl -fsSL https://ollama.ai/install.sh | sh',
        'whisper': 'git clone https://github.com/ggerganov/whisper.cpp && cd whisper.cpp && make',
        'jupyter': 'pip install jupyterlab',
        'chromadb': 'pip install chromadb',
        'langchain': 'pip install langchain',
        'docker': 'Download Docker Desktop from docker.com'
    }
    
    return jsonify({
        'status': 'success',
        'tool': tool,
        'command': installation_commands.get(tool, 'Installation command not available'),
        'note': 'Run this command in your terminal'
    })

def background_monitor():
    """Background thread to monitor system and services"""
    while True:
        try:
            # Update system stats
            get_system_stats()
            
            # Check service statuses periodically
            for service_name in services_state.keys():
                check_service_status(service_name)
                
            time.sleep(30)  # Check every 30 seconds
        except Exception as e:
            print(f"Background monitor error: {e}")
            time.sleep(60)

if __name__ == '__main__':
    print("🚀 Starting Mosaic Agent...")
    print("📍 Optimized for macOS 12.7.6 (MacBook Pro 2015)")
    print("🔧 8GB RAM | Intel CPU | No GPU")
    
    # Check compatibility
    is_compatible, info = check_macos_compatibility()
    if is_compatible:
        print("✅ macOS compatibility confirmed")
    else:
        print(f"⚠️  {info}")
    
    # Start background monitoring
    monitor_thread = threading.Thread(target=background_monitor, daemon=True)
    monitor_thread.start()
    
    # Initial service check
    print("\n🔍 Checking installed services...")
    for service_name in services_state.keys():
        status = check_service_status(service_name)
        emoji = "✅" if status else "❌"
        print(f"{emoji} {service_name}: {'available' if status else 'not available'}")
    
    print(f"\n🌐 Starting web interface...")
    print(f"📱 Open http://localhost:5000 in your browser")
    print(f"⌨️  Press Ctrl+C to stop")
    
    try:
        # Use Werkzeug's development server
        run_simple('localhost', 5000, app, 
                  use_reloader=False, 
                  use_debugger=True,
                  threaded=True)
    except KeyboardInterrupt:
        print("\n👋 Shutting down Mosaic Agent...")
        sys.exit(0)