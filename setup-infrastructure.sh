#!/bin/bash

# Mosaic Agent Infrastructure Setup Script
echo "🚀 Setting up Mosaic Agent Infrastructure..."
echo "================================================"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data/uploads
mkdir -p data/temp
mkdir -p data/logs

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating environment configuration..."
    cat > .env << EOL
# Mosaic Agent Infrastructure Configuration
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Enable Docker sandbox (requires Docker)
ENABLE_SANDBOX=false

# Static files path
STATIC_PATH=frontend

# Security settings
MAX_FILE_SIZE=10485760
MAX_COMMAND_LENGTH=1000

# Rate limiting
RATE_LIMIT_GENERAL=100
RATE_LIMIT_UPLOAD=10
RATE_LIMIT_TERMINAL=30
RATE_LIMIT_AGENTS=50
EOL
    echo "✅ Environment file created (.env)"
else
    echo "✅ Environment file exists"
fi

# Check for Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker is available - sandbox features can be enabled"
    echo "   To enable sandbox: set ENABLE_SANDBOX=true in .env"
else
    echo "⚠️  Docker not found - sandbox features will be disabled"
    echo "   Install Docker to enable secure code execution sandbox"
fi

# Test separation validation
echo "🔒 Validating separation requirements..."
cd multi-agent-main && npm test

# Return to main directory
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo "================================================"
echo ""
echo "🚀 To start the infrastructure server:"
echo "   npm start"
echo ""
echo "🔧 Development mode with auto-restart:"
echo "   npm run dev"
echo ""
echo "🌐 Server will be available at:"
echo "   http://localhost:8000"
echo ""
echo "📋 Health check endpoint:"
echo "   http://localhost:8000/health"
echo ""
echo "🔒 Security policies:"
echo "   http://localhost:8000/api/security/policies"
echo ""
echo "✅ Infrastructure ready for use!"