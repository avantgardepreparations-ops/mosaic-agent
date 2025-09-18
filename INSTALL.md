# Guide d'Installation et de Déploiement - Mosaic Agent

## 🎯 Aperçu

Mosaic Agent est une interface web locale qui centralise et intègre les meilleurs outils d'IA open source pour créer une IA personnelle évolutive. Optimisé spécifiquement pour **MacBook Pro 2015 (macOS 12.7.6, 8GB RAM, CPU Intel)**.

## 📋 Prérequis Système

### Configuration minimale
- **OS**: macOS 12.0+ (optimisé pour 12.7.6)
- **RAM**: 8GB (4GB disponibles recommandés)
- **CPU**: Intel Core i5 ou supérieur
- **Stockage**: 50GB libres (pour modèles IA)
- **Connexion**: Internet pour téléchargement initial

### Vérifications préalables
```bash
# Vérifier la version macOS
sw_vers

# Vérifier l'espace disque disponible
df -h

# Vérifier la RAM
system_profiler SPHardwareDataType | grep "Memory:"
```

## 🛠️ Installation

### 1. Installation des outils de base

#### Homebrew (gestionnaire de paquets)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Python 3.11+
```bash
brew install python@3.11
brew install git
```

#### Xcode Command Line Tools (si nécessaire)
```bash
xcode-select --install
```

### 2. Installation de Mosaic Agent

#### Cloner le projet
```bash
git clone https://github.com/avantgardepreparations-ops/mosaic-agent.git
cd mosaic-agent
```

#### Créer un environnement virtuel Python
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Installer les dépendances
```bash
pip install -r requirements.txt
```

### 3. Installation des outils IA

#### Ollama (Serveur LLM local)
```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Télécharger un modèle recommandé pour votre Mac
ollama pull llama2:7b-chat-q4_0    # 4GB - Recommandé
ollama pull tinyllama:1.1b-chat    # 1.2GB - Ultra-rapide pour tests
```

#### Whisper.cpp (Transcription audio)
```bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# Télécharger le modèle base (recommandé pour votre Mac)
bash ./models/download-ggml-model.sh base
cd ..
```

#### JupyterLab (IDE IA)
```bash
pip install jupyterlab
pip install ipywidgets  # Pour les widgets interactifs
```

#### ChromaDB (Base vectorielle)
```bash
pip install chromadb
```

#### LangChain (Framework d'agents)
```bash
pip install langchain
pip install langchain-community
```

#### Docker (Optionnel mais recommandé)
```bash
# Télécharger et installer Docker Desktop pour Mac
# https://www.docker.com/products/docker-desktop/
```

## 🚀 Démarrage

### 1. Lancer Mosaic Agent
```bash
cd mosaic-agent
source venv/bin/activate
python app.py
```

### 2. Ouvrir l'interface
Ouvrir dans votre navigateur : **http://localhost:5000**

### 3. Vérification des services
L'interface affichera automatiquement l'état de chaque service :
- ✅ **Vert** : Service fonctionnel sur votre Mac
- ⚠️ **Orange** : Service limité, optimisation requise
- ❌ **Rouge** : Service non compatible, cloud recommandé

## ⚙️ Configuration et Optimisation

### Optimisation mémoire pour 8GB RAM

#### 1. Configuration système
```bash
# Augmenter le swap (optionnel)
sudo sysctl vm.swapusage

# Fermer les applications non-essentielles
osascript -e 'quit app "Safari"'
osascript -e 'quit app "Chrome"'
```

#### 2. Configuration Ollama optimisée
```bash
# Variables d'environnement pour optimiser Ollama
export OLLAMA_NUM_PARALLEL=1        # Un seul modèle à la fois
export OLLAMA_MAX_LOADED_MODELS=1   # Limite de modèles chargés
export OLLAMA_FLASH_ATTENTION=1     # Optimisation attention
```

#### 3. Modèles recommandés par taille
```bash
# Ultra-léger (1-2GB) - Tests rapides
ollama pull tinyllama:1.1b-chat
ollama pull phi:2.7b-chat-q4_K_M

# Léger (3-4GB) - Usage quotidien
ollama pull llama2:7b-chat-q4_0
ollama pull mistral:7b-instruct-q4_K_M
ollama pull codellama:7b-code-q4_0

# Éviter (>6GB) - Trop lourd pour votre Mac
# llama2:13b, llama2:70b, etc.
```

### Configuration des ports par défaut
```
Mosaic Agent:     http://localhost:5000
Ollama API:       http://localhost:11434
JupyterLab:       http://localhost:8888
ChromaDB:         http://localhost:8000
```

## 📊 Utilisation

### Interface principale
1. **Tableau de bord** : Vue d'ensemble des services et performances
2. **Outils IA** : Gestion de chaque application
3. **Configuration** : Optimisations et paramètres
4. **Documentation** : Guides et exemples

### Démarrage rapide
1. Cliquer sur "Démarrer" pour Ollama
2. Attendre le chargement du modèle (~30s)
3. Tester avec l'API ou JupyterLab
4. Ajouter d'autres services selon les besoins

### Exemples d'utilisation

#### Test rapide Ollama
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2:7b-chat-q4_0",
  "prompt": "Écris une fonction Python pour trier une liste",
  "stream": false
}'
```

#### Intégration Python
```python
import requests

def query_ollama(prompt, model="llama2:7b-chat-q4_0"):
    response = requests.post('http://localhost:11434/api/generate', 
                           json={'model': model, 'prompt': prompt, 'stream': False})
    return response.json()['response']

# Test
result = query_ollama("Explique les algorithmes de tri en Python")
print(result)
```

## 🔧 Dépannage

### Problèmes courants

#### Ollama ne démarre pas
```bash
# Vérifier si le port est utilisé
lsof -i :11434

# Redémarrer Ollama
pkill ollama
ollama serve
```

#### Manque de mémoire
```bash
# Vérifier l'usage RAM
top -l 1 | grep "PhysMem:"

# Libérer la mémoire
sudo purge

# Utiliser un modèle plus petit
ollama pull tinyllama:1.1b-chat
```

#### Erreur Python/pip
```bash
# Recréer l'environnement virtuel
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Limitations connues sur MacBook Pro 2015

| Outil | Limite | Solution |
|-------|--------|----------|
| **Stable Diffusion** | 15-30min par image | Utiliser services cloud (Replicate, HF Spaces) |
| **Fine-tuning LLM** | Impossible sans GPU | Cloud (Google Colab, RunPod) |
| **Modèles >7B** | Trop lent | Rester sur modèles 7B quantifiés max |
| **Embeddings lourds** | RAM limitée | Utiliser des modèles d'embeddings légers |

## 🎛️ Configuration avancée

### Automatisation du démarrage
```bash
# Créer un script de démarrage
cat > ~/start-mosaic.sh << 'EOF'
#!/bin/bash
cd ~/mosaic-agent
source venv/bin/activate
python app.py
EOF

chmod +x ~/start-mosaic.sh
```

### Variables d'environnement
```bash
# Ajouter à ~/.zshrc ou ~/.bash_profile
export MOSAIC_AGENT_PORT=5000
export OLLAMA_HOST=localhost:11434
export JUPYTER_PORT=8888
```

### Service systemd/launchd (optionnel)
Pour macOS, créer un LaunchAgent pour démarrage automatique.

## 📚 Ressources supplémentaires

### Documentation officielle
- [Ollama](https://ollama.ai/docs)
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [LangChain](https://python.langchain.com/)
- [ChromaDB](https://docs.trychroma.com/)

### Modèles recommandés
- [Ollama Library](https://ollama.ai/library)
- [Hugging Face](https://huggingface.co/models)

### Optimisations CPU Intel
- [Intel AI Tools](https://software.intel.com/content/www/us/en/develop/tools/ai-tools.html)
- [MKLDNN optimizations](https://github.com/intel/mkl-dnn)

## 🆘 Support

### Logs et diagnostic
```bash
# Logs Mosaic Agent
tail -f mosaic-agent.log

# Logs Ollama
ollama logs

# État système
system_profiler SPSoftwareDataType
```

### Communauté
- GitHub Issues pour bugs et features
- Discussions pour questions générales
- Wiki pour documentation communautaire

---

**Note**: Cette installation est optimisée pour votre configuration spécifique (MacBook Pro 2015). Pour d'autres configurations, ajustez les paramètres de mémoire et de CPU en conséquence.