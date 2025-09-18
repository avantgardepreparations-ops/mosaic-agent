#!/bin/bash

# Mosaic Agent - Installation & Validation Script
# Tests all components and validates the setup

echo "🧪 Mosaic Agent - Installation & Validation"
echo "============================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name: $message"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name: $message"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "🔍 Testing System Prerequisites..."

# Test Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    print_test_result "Python 3" "PASS" "$PYTHON_VERSION"
else
    print_test_result "Python 3" "FAIL" "Not installed. Run: brew install python"
fi

# Test pip
if command -v pip3 &> /dev/null; then
    print_test_result "pip3" "PASS" "Available"
else
    print_test_result "pip3" "FAIL" "Not available"
fi

# Test Git
if command -v git &> /dev/null; then
    print_test_result "Git" "PASS" "Available"
else
    print_test_result "Git" "FAIL" "Not installed"
fi

echo ""
echo "📦 Testing Python Dependencies..."

# Test Flask installation
if python3 -c "import flask" 2>/dev/null; then
    FLASK_VERSION=$(python3 -c "import flask; print(flask.__version__)" 2>/dev/null)
    print_test_result "Flask" "PASS" "Version $FLASK_VERSION"
else
    print_test_result "Flask" "FAIL" "Run: pip install -r requirements.txt"
fi

# Test other dependencies
DEPS=("requests" "psutil")
for dep in "${DEPS[@]}"; do
    if python3 -c "import $dep" 2>/dev/null; then
        print_test_result "$dep" "PASS" "Installed"
    else
        print_test_result "$dep" "FAIL" "Missing dependency"
    fi
done

echo ""
echo "🛠️ Testing AI Tools..."

# Test Ollama
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null | head -1)
    print_test_result "Ollama" "PASS" "$OLLAMA_VERSION"
    
    # Test Ollama models
    if ollama list 2>/dev/null | grep -q "NAME"; then
        MODEL_COUNT=$(ollama list 2>/dev/null | tail -n +2 | wc -l)
        print_test_result "Ollama Models" "PASS" "$MODEL_COUNT models installed"
    else
        print_test_result "Ollama Models" "FAIL" "No models found. Run: ollama pull tinyllama"
    fi
else
    print_test_result "Ollama" "FAIL" "Not installed. Run: brew install ollama"
fi

# Test Docker
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_test_result "Docker" "PASS" "$DOCKER_VERSION"
    else
        print_test_result "Docker" "FAIL" "Docker daemon not running"
    fi
else
    print_test_result "Docker" "FAIL" "Not installed. Run: brew install --cask docker"
fi

# Test Jupyter
if command -v jupyter &> /dev/null; then
    print_test_result "Jupyter" "PASS" "Available"
else
    print_test_result "Jupyter" "FAIL" "Run: pip install jupyterlab"
fi

# Test Whisper
if command -v whisper &> /dev/null; then
    print_test_result "Whisper" "PASS" "Command line tool available"
elif python3 -c "import whisper" 2>/dev/null; then
    print_test_result "Whisper" "PASS" "Python package available"
else
    print_test_result "Whisper" "FAIL" "Run: pip install openai-whisper"
fi

echo ""
echo "🌐 Testing Backend API..."

# Start backend briefly to test
echo "Starting backend for testing..."
python3 app.py &
BACKEND_PID=$!
sleep 5

# Test health endpoint
if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
    print_test_result "Backend API" "PASS" "Health endpoint responding"
else
    print_test_result "Backend API" "FAIL" "Health endpoint not responding"
fi

# Test system info endpoint
if curl -s http://localhost:5000/api/system/info | grep -q "system"; then
    print_test_result "System Info API" "PASS" "Endpoint responding"
else
    print_test_result "System Info API" "FAIL" "Endpoint not responding"
fi

# Stop backend
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null

echo ""
echo "📊 Testing Frontend..."

# Test HTML file exists and is valid
if [ -f "index.html" ]; then
    if grep -q "Mosaic Agent" index.html; then
        print_test_result "Frontend HTML" "PASS" "Main page exists and contains expected content"
    else
        print_test_result "Frontend HTML" "FAIL" "Content validation failed"
    fi
else
    print_test_result "Frontend HTML" "FAIL" "index.html not found"
fi

# Test JavaScript file
if [ -f "app.js" ]; then
    if grep -q "aiTools" app.js; then
        print_test_result "Frontend JS" "PASS" "JavaScript contains expected functions"
    else
        print_test_result "Frontend JS" "FAIL" "JavaScript validation failed"
    fi
else
    print_test_result "Frontend JS" "FAIL" "app.js not found"
fi

echo ""
echo "📁 Testing Project Structure..."

# Check required files
REQUIRED_FILES=("README.md" "requirements.txt" "app.py" "index.html" "app.js" "Dockerfile" "docker-compose.yml")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_test_result "File: $file" "PASS" "Exists"
    else
        print_test_result "File: $file" "FAIL" "Missing"
    fi
done

# Check directories
if [ -d "docs" ]; then
    print_test_result "Documentation" "PASS" "docs/ directory exists"
else
    print_test_result "Documentation" "FAIL" "docs/ directory missing"
fi

echo ""
echo "🧠 System Compatibility Analysis..."

# Check RAM
TOTAL_RAM=$(python3 -c "import psutil; print(round(psutil.virtual_memory().total / (1024**3), 1))")
if (( $(echo "$TOTAL_RAM >= 8.0" | bc -l) )); then
    print_test_result "RAM" "PASS" "${TOTAL_RAM}GB (sufficient for AI tools)"
else
    print_test_result "RAM" "FAIL" "${TOTAL_RAM}GB (may be limited for some AI tools)"
fi

# Check CPU
CPU_COUNT=$(python3 -c "import psutil; print(psutil.cpu_count())")
if [ "$CPU_COUNT" -ge 2 ]; then
    print_test_result "CPU Cores" "PASS" "$CPU_COUNT cores (adequate)"
else
    print_test_result "CPU Cores" "FAIL" "$CPU_COUNT cores (may be limited)"
fi

# Check disk space
FREE_SPACE=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
if (( $(echo "$FREE_SPACE >= 10" | bc -l) )); then
    print_test_result "Disk Space" "PASS" "${FREE_SPACE}GB free"
else
    print_test_result "Disk Space" "FAIL" "${FREE_SPACE}GB free (need 10GB+ for AI models)"
fi

echo ""
echo "📋 Test Summary"
echo "==============="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(python3 -c "print(round(($TESTS_PASSED / $TOTAL_TESTS) * 100, 1))" 2>/dev/null || echo "0")
echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"

echo ""
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Mosaic Agent is ready to use.${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Run: python app.py"
    echo "2. Open: index.html in your browser"
    echo "3. Start exploring AI tools!"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the failed items above.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "• Install missing dependencies: pip install -r requirements.txt"
    echo "• Install Ollama: brew install ollama"
    echo "• Install Docker: brew install --cask docker"
    echo "• Download AI models: ollama pull tinyllama"
fi

echo ""
echo "📖 For detailed setup instructions, see README.md"
echo "🔧 For MacBook optimization tips, see docs/macbook-optimization.md"