# 📁 Archive - Contenu Expérimental et Versions Antérieures

## ⚠️ AVERTISSEMENT

**Ce dossier contient du contenu expérimental et des versions antérieures NON OPÉRATIONNELLES.**

La version stable et opérationnelle de Mosaic Agent se trouve sur la **branche main** dans les fichiers à la racine du dépôt.

## 📂 Contenu Archivé

### `agents/` - Système Multi-Agent Expérimental (JavaScript)
- **Description** : Implémentation expérimentale d'un système multi-agent en JavaScript
- **Statut** : Non opérationnel, expérimental
- **Contient** :
  - `PromptRefinementAgent.js` - Agent d'affinement de prompts
  - `DistributionAgent.js` - Agent de distribution multi-sources
  - `CollectionAgent.js` - Agent de collecte et agrégation
  - `InnovationAgent.js` - Agent d'innovation et amélioration
  - `VerificationAgent.js` - Agent de vérification
  - `SynthesisAgent.js` - Agent de synthèse finale
  - `test-agents.js` - Tests pour le système d'agents
  - `base/` et `orchestrator/` - Classes de base et orchestrateur

### `agentv2/` - Système Multi-Agent CrewAI (Python)
- **Description** : Implémentation alternative basée sur le framework CrewAI
- **Statut** : Non opérationnel, expérimental
- **Contient** :
  - `agents.py` - Agents utilisant CrewAI
  - `config.py` - Configuration des modèles Ollama
  - `requirements.txt` - Dépendances Python spécifiques

### `multi-agent-main/` - Application FastAPI de Liaison
- **Description** : Application de liaison multi-agent avec backend FastAPI
- **Statut** : Non opérationnel, expérimental
- **Warning** : Marqué comme devant rester séparé de MOSAICMIND
- **Contient** :
  - Application FastAPI complète
  - Data layer atomique avec JSON
  - Services de chiffrement
  - Tests unitaires pytest

### `backend/` - Infrastructure Backend Expérimentale
- **Description** : Infrastructure backend alternative pour le système
- **Statut** : Non opérationnel, expérimental
- **Contient** :
  - Serveur d'infrastructure
  - Routes d'API alternatives
  - Agents d'infrastructure

### Fichiers de Test Expérimentaux
- `test-distribution-agent.js` - Tests pour agent de distribution

## 🚨 Avertissements Importants

### Ne Pas Utiliser en Production
- Aucun des éléments de ce dossier n'est destiné à un usage opérationnel
- Ces composants peuvent contenir des bugs, des fonctionnalités incomplètes ou des dépendances non résolues
- Ils sont conservés uniquement pour référence historique et récupération potentielle

### Dépendances Potentiellement Manquantes
- Les différents projets archivés peuvent avoir des `package.json` ou `requirements.txt` spécifiques
- Les dépendances peuvent ne pas être compatibles avec la version actuelle de Mosaic Agent
- Certains fichiers de configuration peuvent référencer des chemins qui n'existent plus

### Conflits Potentiels
- Ne pas tenter d'intégrer directement ce contenu avec la version main sans analyse approfondie
- Les architectures peuvent être incompatibles entre elles et avec la version principale

## 📋 Historique d'Archivage

**Date** : Septembre 2024  
**Raison** : Organisation du dépôt principal - séparation du contenu opérationnel et expérimental  
**Action** : Déplacement vers archive/ de tout le contenu non opérationnel  

### Contenu Déplacé
- `agents/` (système multi-agent JavaScript)
- `agentv2/` (système CrewAI Python)  
- `multi-agent-main/` (application FastAPI)
- `backend/` (infrastructure expérimentale)
- Fichiers de test expérimentaux

## 🔄 Récupération Future

Si vous avez besoin de récupérer ou de référencer du contenu de ce dossier :

1. **Évaluation nécessaire** : Analysez d'abord la compatibilité avec la version actuelle
2. **Tests indispensables** : Testez dans un environnement isolé
3. **Documentation requise** : Documentez les modifications nécessaires pour l'intégration
4. **Validation de sécurité** : Vérifiez l'absence de vulnérabilités

## 📖 Version Opérationnelle

La version stable et opérationnelle de **Mosaic Agent** se trouve dans :
- `README.md` (documentation principale)
- `index.html` (interface web principale)
- `app.py` (backend Flask)
- `app.js` (frontend JavaScript)
- `requirements.txt` (dépendances Python)
- `package.json` (dépendances Node.js)

Pour utiliser Mosaic Agent, consultez le README.md principal à la racine du dépôt.