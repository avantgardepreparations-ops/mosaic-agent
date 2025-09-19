#!/bin/bash

# Mosaic Agent Setup Script
# This script sets up both frontend and backend for the web application

set -e

echo "🗂️  Setting up Mosaic Agent - File Management & Terminal"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 14+ and try again.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo -e "${RED}❌ Node.js version 14+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"

# Move to project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/project"
cd "$PROJECT_DIR"

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend

# Install backend dependencies
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating backend .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Backend .env file created${NC}"
fi

# Create necessary directories
mkdir -p uploads data logs

echo -e "${GREEN}✅ Backend setup complete${NC}"

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd ../frontend

# Install frontend dependencies
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"

# Back to project root
cd ..

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo -e "${YELLOW}Backend (Terminal 1):${NC}"
echo "  cd project/backend"
echo "  npm start"
echo ""
echo -e "${YELLOW}Frontend (Terminal 2):${NC}"
echo "  cd project/frontend"
echo "  npm start"
echo ""
echo -e "${BLUE}The application will be available at:${NC}"
echo -e "  🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 Backend API: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}Features:${NC}"
echo "  📁 File Management with drag & drop upload"
echo "  💻 Integrated terminal with command history"
echo "  🔒 Secure command execution with whitelist"
echo "  📱 Cross-platform support (Termux, macOS, Linux)"
echo ""
echo -e "${YELLOW}For more information, see docs/README.md${NC}"