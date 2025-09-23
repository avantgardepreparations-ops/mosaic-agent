# 🤖 Mosaic Agent - Interface de Codage IA Centralisée

## ✅ VERSION STABLE ET OPÉRATIONNELLE

**Cette version sur la branche `main` est la version stable et opérationnelle de Mosaic Agent.**

Une interface web moderne et responsive pour centraliser et gérer les meilleurs outils open source d'intelligence artificielle pour le développement. Optimisé pour **MacBook Pro 2015 (macOS 12.7.6)** avec des recommandations de compatibilité détaillées.

![Interface Preview](docs/preview.png)

## ✨ Fonctionnalités

- 🎛️ **Tableau de bord centralisé** pour gérer tous vos outils IA
- 🔧 **Interface de configuration** pour chaque outil
- 📊 **Monitoring en temps réel** des services actifs
- 🖥️ **Compatibilité MacBook Pro 2015** avec notes d'optimisation
- 📚 **Documentation intégrée** avec exemples d'utilisation
- 🐳 **Support Docker** pour isolation des environnements
- 🌐 **Interface responsive** avec Tailwind CSS

## 🛠️ Outils IA Intégrés

| Outil | Type | Compatibilité Mac | Description |
|-------|------|-------------------|-------------|
| **Ollama** | LLM Local | ✅ Compatible | Exécute LLaMA, Mistral localement avec quantification |
| **Whisper.cpp** | Speech-to-Text | ✅ Excellent | Transcription audio optimisée CPU |
| **ChromaDB** | Base Vectorielle | ✅ Excellent | Stockage et recherche d'embeddings |
| **LangChain** | Framework Agents | ✅ Excellent | Chaînage de prompts et agents IA |
| **JupyterLab** | IDE Interactif | ✅ Excellent | Développement Python interactif |
| **FAISS** | Recherche Similarité | ✅ Compatible | Recherche vectorielle rapide (CPU) |
| **Stable Diffusion** | Text-to-Image | ⚠️ Limité | Génération d'images (lent sur CPU) |
| **Text Generation WebUI** | Interface LLM | ⚠️ Limité | Interface avancée pour LLMs |
| **Docker** | Conteneurisation | ✅ Excellent | Isolation des environnements |

### 📝 Légende Compatibilité
- ✅ **Excellent/Compatible** : Fonctionne parfaitement sur MacBook Pro 2015
- ⚠️ **Limité** : Fonctionnel mais performances limitées, cloud recommandé

## 🚀 Installation Rapide

### Prérequis
- **macOS 12.7.6+**
- **Python 3.8+**
- **8 Go RAM** minimum
- **Homebrew** installé

### 1. Cloner le Repository
```bash
git clone https://github.com/avantgardepreparations-ops/mosaic-agent.git
cd mosaic-agent
```

### 2. Installer les Dépendances Backend
```bash
# Installer les dépendances Python de base
pip install -r requirements.txt

# Optionnel: installer les outils IA (selon vos besoins)
pip install chromadb langchain faiss-cpu openai-whisper jupyterlab
```

### 3. Installer les Outils Système
```bash
# Ollama (recommandé)
brew install ollama

# Docker (optionnel mais recommandé)
brew install --cask docker

# Whisper.cpp (optionnel)
brew install whisper-cpp
```

### 4. Lancer l'Application
```bash
# 1. Démarrer le backend
python app.py

# 2. Ouvrir l'interface web
open index.html
# ou naviguer vers http://localhost:5000 (si vous servez via Flask)
```

## 📖 Guide d'Utilisation

### Démarrage des Services

1. **Lancer le Backend** : `python app.py`
2. **Ouvrir l'Interface** : Ouvrir `index.html` dans votre navigateur
3. **Activer les Outils** : Cliquer sur "Démarrer" pour chaque outil souhaité

### Configuration Optimisée MacBook Pro 2015

#### Pour Ollama (LLMs)
```bash
# Télécharger un modèle quantifié optimisé
ollama pull llama2:7b-chat-q4_0

# Modèles recommandés pour 8GB RAM
ollama pull tinyllama:1.1b
ollama pull mistral:7b-instruct-q4_0
```

#### Pour Stable Diffusion (si utilisé)
```python
# Utiliser la quantification pour économiser la RAM
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float32,  # Utiliser float32 sur CPU
    safety_checker=None,  # Désactiver pour économiser la RAM
)
pipe.enable_attention_slicing()  # Optimisation mémoire
```

## 🔧 Configuration Avancée

### Variables d'Environnement
Créer un fichier `.env`:
```bash
OLLAMA_URL=http://localhost:11434
CHROMADB_URL=http://localhost:8000
JUPYTER_PORT=8888
WHISPER_MODEL_PATH=./models/ggml-base.bin
MODELS_DIR=./models
```

### Docker Compose (Optionnel)
```yaml
version: '3.8'
services:
  mosaic-agent:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./models:/app/models
    environment:
      - FLASK_ENV=production
  
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
```

## 📊 API Endpoints

### Gestion des Outils
- `GET /api/tools/status` - Statut de tous les outils
- `POST /api/tools/{tool}/start` - Démarrer un outil
- `POST /api/tools/{tool}/stop` - Arrêter un outil

### Ollama Integration
- `GET /api/ollama/models` - Liste des modèles
- `POST /api/ollama/generate` - Générer du texte

### Système
- `GET /api/system/info` - Informations système
- `GET /api/health` - Vérification de santé
- `GET /api/install-guide` - Guide d'installation

## 🎯 Recommandations MacBook Pro 2015

### ✅ Outils Recommandés en Local
- **Ollama** avec modèles 2-4B quantifiés
- **Whisper** pour transcription
- **ChromaDB/FAISS** pour bases vectorielles
- **LangChain** pour agents
- **JupyterLab** pour développement

### ⚠️ Outils Nécessitant le Cloud
- **Stable Diffusion** (génération d'images)
- **Fine-tuning de LLMs** (entraînement)
- **Modèles 7B+** non quantifiés

### 🔧 Optimisations Recommandées
1. **Modèles quantifiés** : Utilisez GGUF int4/int8
2. **Taille modèle** : 2-4B paramètres maximum
3. **RAM** : Fermez les applications inutiles
4. **Stockage** : 10GB+ libres pour les modèles

## 📁 Structure du Projet

```
mosaic-agent/
├── index.html          # Interface web principale
├── app.js              # JavaScript frontend
├── app.py              # Backend Flask
├── requirements.txt    # Dépendances Python
├── README.md           # Documentation principale
├── main/               # 🆕 Système Multi-Agent ACTIF (workflow multi-agent opérationnel)
├── docs/               # Documentation supplémentaire
├── frontend/           # Composants frontend React
├── security/           # Modules de sécurité
├── tests/              # Tests principaux
├── models/             # Modèles IA (créé automatiquement)
├── archive/            # Contenu expérimental archivé (NON opérationnel)
└── docker-compose.yml  # Configuration Docker (optionnel)
```

### 🚀 Nouveau: Système Multi-Agent dans main/

Le dossier `main/` contient maintenant le **système multi-agent opérationnel** avec:
- **Workflow complet** d'orchestration d'agents IA
- **Documentation intégrée** et scripts de test fonctionnels
- **Séparation stricte** avec MOSAICMIND préservée
- **Version stable** prête pour l'utilisation

```bash
# Tester le système multi-agent
cd main/
npm install
npm run test-agents
```

## 🏁 Chaîne Multi‑Agents & Agent Final

### Pipeline Multi-Agents (Étapes 1→9)
1. Prompt initial utilisateur  
2. Affinement 1  
3. Générations parallèles  
4. Récolte  
5. Vérification faisabilité  
6. Affinement 2  
7. Assemblage  
8. Innovation  
9. **Vérification Finale (Agent Final)** ✅

### Agent Final
Produit un rapport consolidé: métriques d'amélioration, état de structure, extrait de code final, prochaines étapes.

**Endpoint de test:**
```bash
curl http://localhost:5000/api/agent/final/test | jq
```

**Exemple de réponse:**
```json
{
  "run_id": "...",
  "stage": "FINAL_REPORT",
  "report": {
    "summary": "Succès",
    "variant_count": 2,
    "improvement_ratio": 0.29
  }
}
```

### Fichiers ajoutés
- `agents/agent_final.py` - Classe FinalAgent principale
- `docs/agent-final-analysis.md` - Analyse fonctionnelle & technique
- `docs/screenshots/agent-final-overview.png` - Vue d'ensemble
- `tests/test_agent_final.py` - Tests unitaires

### Screenshot
![Agent Final Overview](docs/screenshots/agent-final-overview.png)

### TODO (Futurs)
- Sandbox Docker (exécution isolée)
- Orchestrateur (Temporal / Celery / BullMQ)
- Benchmarks automatiques
- Diff AST + signature rapport
- Couverture tests >85%

### EN (Short Placeholder)
Final Agent consolidates multi-agent pipeline outputs into a delivery report (validation + metrics). Future work: sandbox, orchestration, benchmarks.

## 🔍 Dépannage

### Problèmes Courants

**Ollama ne démarre pas**
```bash
# Vérifier l'installation
ollama --version

# Redémarrer le service
brew services restart ollama
```

**Erreur de mémoire avec Stable Diffusion**
```python
# Utiliser des optimisations mémoire
pipe.enable_attention_slicing()
pipe.enable_sequential_cpu_offload()
```

**Port déjà utilisé**
```bash
# Trouver le processus utilisant le port
lsof -i :5000

# Tuer le processus
kill -9 <PID>
```

## 🤝 Contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📁 Contenu Archivé

Le dossier `archive/` contient des versions expérimentales et du contenu non opérationnel :
- Systèmes multi-agents expérimentaux
- Implémentations alternatives (CrewAI, FastAPI)
- Infrastructures backend expérimentales

⚠️ **Attention** : Le contenu archivé n'est pas opérationnel et est conservé uniquement pour référence. Consultez `archive/README.md` pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Ollama](https://ollama.ai/) pour l'interface LLM locale
- [OpenAI Whisper](https://github.com/openai/whisper) pour la transcription
- [ChromaDB](https://www.trychroma.com/) pour la base vectorielle
- [LangChain](https://langchain.com/) pour le framework agents
- [Tailwind CSS](https://tailwindcss.com/) pour le design

---

**Développé avec ❤️ pour la communauté IA open source**