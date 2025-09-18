#!/bin/bash
# Mosaic Agent Launcher Script
# Optimized for MacBook Pro 2015 (macOS 12.7.6)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Header
clear
echo "🧠 ============================================="
echo "🚀 Mosaic Agent - Interface Codage IA"
echo "📱 Optimisé pour MacBook Pro 2015"
echo "============================================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "Cette application est optimisée pour macOS"
    exit 1
fi

# Check macOS version
print_status "Vérification de la compatibilité système..."
macos_version=$(sw_vers -productVersion)
print_status "macOS version: $macos_version"

# Check available RAM
ram_info=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2 " " $3}')
print_status "RAM disponible: $ram_info"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 n'est pas installé"
    print_status "Installation avec Homebrew:"
    print_status "brew install python@3.11"
    exit 1
fi

python_version=$(python3 --version)
print_status "Python: $python_version"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_status "Création de l'environnement virtuel Python..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activation de l'environnement virtuel..."
source venv/bin/activate

# Install requirements if needed
if [ ! -f "venv/installed" ]; then
    print_status "Installation des dépendances Python..."
    pip install -r requirements.txt
    touch venv/installed
    print_status "Dépendances installées avec succès"
fi

# Check if Ollama is installed
print_status "Vérification des services IA..."
if command -v ollama &> /dev/null; then
    print_status "✅ Ollama installé"
else
    print_warning "⚠️  Ollama non installé"
    echo "   Installation: curl -fsSL https://ollama.ai/install.sh | sh"
fi

# Check if Docker is running
if pgrep -x "Docker" > /dev/null; then
    print_status "✅ Docker en cours d'exécution"
else
    print_warning "⚠️  Docker non démarré"
fi

# Check if JupyterLab is installed
if pip show jupyterlab &> /dev/null; then
    print_status "✅ JupyterLab installé"
else
    print_warning "⚠️  JupyterLab non installé"
    echo "   Installation: pip install jupyterlab"
fi

# Set optimization environment variables
print_status "Configuration des optimisations pour MacBook Pro 2015..."
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_FLASH_ATTENTION=1

# Display system recommendations
echo ""
print_header "💡 Recommandations pour votre MacBook Pro 2015:"
echo "   • Fermez les applications non-essentielles"
echo "   • Utilisez des modèles quantifiés (Q4_0, Q4_K_M)"
echo "   • Limitez à un modèle LLM à la fois"
echo "   • Gardez 50GB+ d'espace libre"
echo ""

# Check available disk space
available_space=$(df -h . | tail -1 | awk '{print $4}')
print_status "Espace disque disponible: $available_space"

# Start the application
print_header "🚀 Démarrage de Mosaic Agent..."
echo ""
echo "📍 Interface web: http://localhost:5000"
echo "⌨️  Appuyez sur Ctrl+C pour arrêter"
echo ""

# Create a simple error handler
trap 'echo ""; print_status "👋 Arrêt de Mosaic Agent..."; exit 0' INT

# Start the Flask application
python app.py