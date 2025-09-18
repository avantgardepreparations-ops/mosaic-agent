# 🧠 Mosaic Agent - Interface Codage IA

Une interface web locale qui centralise et intègre les meilleurs outils d'IA open source pour créer une IA personnelle évolutive. Spécialement optimisé pour **MacBook Pro 2015 (macOS 12.7.6, 8GB RAM, CPU Intel)**.

## 🎯 Objectif

Créer une **application unique** qui rassemble tous les outils d'IA sophistiqués dans une interface de contrôle centralisée, permettant d'expérimenter, configurer et connecter ces modules entre eux facilement.

## ✨ Fonctionnalités

- 🎛️ **Tableau de bord unifié** pour tous vos outils IA
- 🔧 **Gestion des services** (démarrage/arrêt en un clic)
- 📊 **Monitoring système** en temps réel (RAM, CPU, services actifs)
- ⚙️ **Configuration optimisée** pour MacBook Pro 2015
- 📚 **Documentation intégrée** et guides d'installation
- 🔗 **Intégration API** pour tous les services
- 📱 **Interface responsive** moderne avec Tailwind CSS

## 🛠️ Outils IA Intégrés

| Outil | Statut | Description | Compatibilité Mac 2015 |
|-------|--------|-------------|-------------------------|
| **Ollama** | ✅ | Serveur LLM local (LLaMA, Mistral, CodeLlama) | Excellent avec modèles quantifiés |
| **Whisper.cpp** | ✅ | Transcription audio locale ultra-rapide | Optimal sur CPU Intel |
| **ChromaDB** | ✅ | Base de données vectorielle pour embeddings | Compatible, mémoire optimisée |
| **LangChain** | ✅ | Framework pour agents IA et chaînes de prompts | Parfait pour expérimentation |
| **JupyterLab** | ✅ | IDE interactif pour développement IA | Idéal pour prototypage |
| **LM Studio** | ⚠️ | Interface GUI pour LLM (limité sans GPU) | Utilisable mais Ollama recommandé |
| **Stable Diffusion** | ❌ | Génération d'images (trop lent sur CPU) | Cloud recommandé |
| **Docker** | ✅ | Conteneurisation pour isolation des services | Essentiel pour gestion propre |

## 🚀 Installation Rapide

```bash
# 1. Cloner le projet
git clone https://github.com/avantgardepreparations-ops/mosaic-agent.git
cd mosaic-agent

# 2. Installer les dépendances Python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Installer Ollama (LLM local)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2:7b-chat-q4_0  # Modèle recommandé pour votre Mac

# 4. Lancer l'interface
python app.py

# 5. Ouvrir dans le navigateur
open http://localhost:5000
```

## 🎛️ Interface

### Tableau de bord principal
- **Statistiques système** : RAM/CPU en temps réel
- **Services actifs** : État de tous les outils IA
- **Modèles chargés** : LLM disponibles
- **Actions rapides** : Démarrage/arrêt des services

### Cartes d'outils IA
Chaque outil dispose de sa propre carte avec :
- **État de compatibilité** (✅ Compatible, ⚠️ Limité, ❌ Cloud requis)
- **Configuration recommandée** pour votre Mac
- **Liens documentation** et installation
- **Boutons d'action** (Démarrer/Arrêter/Configurer)

### Configuration et optimisation
- **Recommandations système** spécifiques à votre MacBook
- **Modèles optimisés** (quantifiés, taille appropriée)
- **Paramètres performance** (RAM, CPU, cache)

## 📋 Prérequis Système

- **OS** : macOS 12.0+ (testé sur 12.7.6)
- **RAM** : 8GB (4GB disponibles recommandés)
- **CPU** : Intel Core i5 ou supérieur
- **Stockage** : 50GB libres pour modèles IA
- **Python** : 3.11+

## 🔧 Configuration Optimisée MacBook Pro 2015

### Modèles LLM recommandés
```bash
# Ultra-léger (1-2GB) - Tests rapides
ollama pull tinyllama:1.1b-chat

# Optimal (3-4GB) - Usage quotidien
ollama pull llama2:7b-chat-q4_0
ollama pull mistral:7b-instruct-q4_K_M
ollama pull codellama:7b-code-q4_0
```

### Variables d'optimisation
```bash
export OLLAMA_NUM_PARALLEL=1        # Un modèle à la fois
export OLLAMA_MAX_LOADED_MODELS=1   # Limite mémoire
export OLLAMA_FLASH_ATTENTION=1     # Optimisation Intel
```

## 🎯 Cas d'Usage

### Développement IA Personnel
- **Prototypage rapide** avec JupyterLab + Ollama
- **Agents conversationnels** avec LangChain
- **Mémoire persistante** avec ChromaDB
- **Transcription audio** avec Whisper

### Assistance au Codage
- **Génération de code** avec CodeLlama
- **Révision et debugging** avec Mistral
- **Documentation automatique**
- **Tests unitaires** générés par IA

### Expérimentation IA
- **Test de nouveaux modèles** facilement
- **Comparaison de performances**
- **Fine-tuning léger** (LoRA, adapters)
- **Évaluation qualitative**

## 📊 Architecture

```
┌─────────────────────────────────────┐
│           Interface Web             │
│        (HTML + Tailwind)            │
├─────────────────────────────────────┤
│          Backend Flask              │
│       (Gestion services)            │
├─────────────────────────────────────┤
│     Services IA Locaux              │
│  ┌─────────┬─────────┬─────────┐    │
│  │ Ollama  │ Whisper │ Jupyter │    │
│  │  :11434 │   CLI   │  :8888  │    │
│  └─────────┴─────────┴─────────┘    │
├─────────────────────────────────────┤
│       Système macOS 12.7.6         │
│     8GB RAM | Intel CPU            │
└─────────────────────────────────────┘
```

## 📚 Documentation

- **[Guide d'Installation Complet](INSTALL.md)** - Instructions détaillées
- **[API Documentation](docs/API.md)** - Référence des endpoints
- **[Optimisations MacBook](docs/OPTIMIZATION.md)** - Conseils performance
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Résolution de problèmes

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/awesome-feature`)
3. Commit les changements (`git commit -m 'Add awesome feature'`)
4. Push vers la branche (`git push origin feature/awesome-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🎓 Inspirations et Remerciements

- **Ollama** pour la simplicité d'usage des LLM locaux
- **Whisper.cpp** pour les performances CPU exceptionnelles
- **LangChain** pour le framework d'agents flexible
- **Tailwind CSS** pour l'interface moderne et responsive

## 🔮 Roadmap

- [ ] **v1.1** : Intégration Stable Diffusion cloud
- [ ] **v1.2** : Agents LangChain prédéfinis
- [ ] **v1.3** : Interface de fine-tuning LoRA
- [ ] **v1.4** : Support GPU externe (eGPU)
- [ ] **v2.0** : Mode distribué multi-machines

---

**Note** : Ce projet est spécialement optimisé pour MacBook Pro 2015. Pour d'autres configurations, consultez la documentation d'optimisation.