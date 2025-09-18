#!/bin/bash

# Mosaic Agent - Quick Start Script
# For macOS (MacBook Pro 2015 compatible)

echo "🤖 Mosaic Agent - AI Coding Tools Interface"
echo "=========================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.8+ first."
    echo "   Install via: brew install python"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required. Please install pip first."
    exit 1
fi

echo "✅ Python 3 detected: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Check for Homebrew (recommended for macOS)
if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew not found. Some tools may require manual installation."
    echo "   Install Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
else
    echo "✅ Homebrew detected"
fi

# Check for optional tools
echo ""
echo "🔍 Checking for AI tools..."

# Check Ollama
if command -v ollama &> /dev/null; then
    echo "✅ Ollama installed: $(ollama --version 2>/dev/null | head -1)"
else
    echo "⚠️  Ollama not found. Install with: brew install ollama"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker installed: $(docker --version)"
else
    echo "⚠️  Docker not found. Install with: brew install --cask docker"
fi

# Check Jupyter
if command -v jupyter &> /dev/null; then
    echo "✅ Jupyter installed"
else
    echo "📝 Jupyter not found. Will be installed with pip install jupyterlab"
fi

echo ""
echo "🚀 Starting Mosaic Agent..."
echo "   Backend API: http://localhost:5000"
echo "   Frontend: Open index.html in your browser"
echo ""
echo "📋 Quick Commands:"
echo "   • Install Ollama: brew install ollama"
echo "   • Install Docker: brew install --cask docker"
echo "   • Install Jupyter: pip install jupyterlab"
echo "   • Pull Ollama model: ollama pull llama2:7b-chat-q4_0"
echo ""

# Start the Flask application
echo "🎯 Launching backend server..."
python app.py