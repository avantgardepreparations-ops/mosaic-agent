# Multi-Agent Liaison Application

## ⚠️ ATTENTION - SÉPARATION STRICTE REQUISE ⚠️

**NE JAMAIS MÉLANGER AVEC MOSAICMIND**

Cette application de liaison multi-agent doit rester **complètement séparée** de MOSAICMIND en toutes circonstances.

## Description

Application de liaison multi-agent conçue pour fonctionner de manière **strictement indépendante** et **jamais intégrée** avec MOSAICMIND.

### Architecture Multi-Agent Complète

Cette application implémente maintenant un système multi-agent complet avec:

- **PromptRefinementAgent** : Affine et améliore les prompts utilisateur
- **CollectionAgent** : Collecte et agrège les données de multiples sources
- **SynthesisAgent** : Synthétise les données en réponses cohérentes et bien formatées
- **MultiAgentOrchestrator** : Coordonne le workflow entre tous les agents

### Architecture FastAPI Backend

Cette application inclut également un backend FastAPI moderne avec:

- **API REST** structurée avec FastAPI
- **Data layer atomique** avec fichiers JSON et file locking
- **Services de chiffrement** pour la sécurité des données
- **Gestion des conversations** multi-utilisateurs
- **Tests unitaires** complets avec pytest

## Règles de Séparation

1. ❌ **INTERDIT**: Toute intégration avec MOSAICMIND
2. ❌ **INTERDIT**: Utilisation de dépendances MOSAICMIND
3. ❌ **INTERDIT**: Partage de code avec MOSAICMIND
4. ✅ **OBLIGATOIRE**: Maintenir une séparation complète
5. ✅ **OBLIGATOIRE**: Valider la séparation régulièrement

## Installation et Utilisation

### Backend Python (FastAPI)

```bash
# Installer les dépendances Python
pip install -r requirements.txt

# Démarrer le serveur FastAPI
python start_server.py

# Ou directement avec uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Node.js (Application originale)

```bash
# Installer les dépendances
npm install

# Valider la séparation (OBLIGATOIRE avant utilisation)
npm run validate

# Démarrer l'application
npm start
```

## API Endpoints

Le backend FastAPI expose les endpoints suivants:

### Santé et Status

- `GET /` - Information générale de l'API
- `GET /api/v1/health` - Check de santé (retourne `{"status": "ok"}`)

### Intelligence Artificielle

- `POST /api/v1/infer` - Traitement d'inférence IA
  ```json
  {
    "input": "texte à traiter",
    "userId": "identifiant-utilisateur-optionnel"
  }
  ```
  Retourne:
  ```json
  {
    "output": "résultat du traitement",
    "trace": {
      "input_length": 15,
      "user_id": "identifiant-utilisateur",
      "processing_time": "fast",
      "model_used": "demo_model"
    }
  }
  ```

### Gestion des Conversations

- `GET /api/v1/conversations` - Liste des conversations
- `GET /api/v1/conversations/{id}` - Récupérer une conversation
- `POST /api/v1/conversations` - Créer une nouvelle conversation
- `DELETE /api/v1/conversations/{id}` - Supprimer une conversation

## Scripts Disponibles

### Node.js
- `npm start`: Lance l'application avec validation automatique de la séparation
- `npm run validate`: Valide que la séparation avec MOSAICMIND est respectée
- `npm test`: Exécute les tests de séparation
- `npm run test-agents`: Teste le système multi-agent complet

### Python
- `python start_server.py`: Démarre le serveur FastAPI
- `python -m pytest tests/`: Exécute les tests Python
- `python -m app.main`: Démarre directement l'application FastAPI

## Structure du Projet

```
/
├── app/                          # Backend FastAPI
│   ├── main.py                  # Point d'entrée FastAPI
│   ├── routers/
│   │   └── brain.py             # Routes API (/health, /infer, /conversations)
│   └── services/
│       ├── storage.py           # Data layer atomique JSON
│       ├── encryption.py        # Services de chiffrement
│       └── conversation.py      # Logique métier conversations
├── data/                        # Fichiers de données JSON
│   ├── conversations.json       # Données des conversations
│   ├── users.json              # Données des utilisateurs
│   └── projects.json           # Données des projets
├── tests/                       # Tests unitaires Python
│   ├── test_api.py             # Tests des endpoints API
│   ├── test_encryption.py      # Tests de chiffrement
│   ├── test_storage.py         # Tests du storage atomique
│   └── test_conversation.py    # Tests des conversations
├── index.js                     # Application Node.js originale
├── config.json                  # Configuration de séparation
└── requirements.txt             # Dépendances Python
```

## Configuration

L'application utilise `config.json` pour enforcer la séparation:

```json
{
  "application": {
    "separation": {
      "enforce_separation": true,
      "blocked_integrations": ["MOSAICMIND", "mosaicmind", "MosaicMind"],
      "isolation_mode": "strict"
    }
  }
}
```

## Data Layer Atomique

Le système utilise un data layer JSON avec file locking pour éviter les race conditions:

- **Lecture/écriture sécurisée** avec verrous de fichiers
- **Opérations atomiques** pour les mises à jour
- **Stockage JSON** simple et lisible
- **Pas de dépendances** de base de données externes

## Tests

### Tests Python (pytest)

```bash
# Tous les tests
python -m pytest tests/ -v

# Tests spécifiques
python -m pytest tests/test_api.py -v           # Tests API
python -m pytest tests/test_encryption.py -v   # Tests chiffrement
python -m pytest tests/test_storage.py -v      # Tests storage
python -m pytest tests/test_conversation.py -v # Tests conversations
```

### Tests Node.js (Séparation)

```bash
npm test  # Tests de validation de séparation
```

## Documentation API

Une fois le serveur démarré, la documentation interactive est disponible sur:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Validation de Séparation

L'application inclut des mécanismes de validation automatique qui:

- Vérifient l'absence de dépendances MOSAICMIND
- Contrôlent les configurations de séparation
- Alertent en cas de tentative d'intégration

## ⚠️ RAPPEL IMPORTANT

Cette application **NE DOIT JAMAIS** être mélangée, intégrée ou combinée avec MOSAICMIND sous quelque forme que ce soit.

Toute violation de cette règle peut compromettre l'intégrité de l'application.

## Système Multi-Agent

### Architecture des Agents

L'application implémente un système multi-agent complet avec les composants suivants:

#### 1. **PromptRefinementAgent**
- **Rôle**: Affine et améliore les prompts utilisateur
- **Fonctionnalités**:
  - Analyse du type et de la complexité du prompt
  - Clarification de l'intention utilisateur
  - Génération de sous-prompts si nécessaire
  - Expansion du contexte
  - Génération d'instructions pour les autres agents

#### 2. **CollectionAgent**
- **Rôle**: Collecte et agrège les données de multiples sources
- **Fonctionnalités**:
  - Collecte depuis le DistributionAgent (simulé)
  - Nettoyage et validation des données
  - Agrégation intelligente (pondérée, consensus, chronologique)
  - Création de structures unifiées
  - Évaluation de la qualité et de la couverture

#### 3. **SynthesisAgent**
- **Rôle**: Synthétise les données en réponses cohérentes
- **Fonctionnalités**:
  - Analyse des données collectées
  - Construction de réponses structurées
  - Formatage multi-format (Markdown, HTML, texte)
  - Contrôles qualité automatiques
  - Gestion de la cohérence et de la complétude

#### 4. **MultiAgentOrchestrator**
- **Rôle**: Coordonne le workflow entre tous les agents
- **Fonctionnalités**:
  - Gestion du workflow en 4 étapes
  - Coordination des agents
  - Simulation du DistributionAgent
  - Collecte de métriques
  - Gestion d'erreurs et retry

### Utilisation du Système Multi-Agent

#### Test du Système
```bash
# Tester le système complet
npm run test-agents

# Tester individuellement les agents
node test-agents.js
```

#### Utilisation Programmatique
```javascript
const MultiAgentOrchestrator = require('./agents/orchestrator/index');

// Créer l'orchestrateur
const orchestrator = new MultiAgentOrchestrator({
    enableLogging: true,
    enableMetrics: true
});

// Traiter une requête
const result = await orchestrator.processRequest(
    "Créer une fonction JavaScript qui valide une adresse email",
    { userLevel: 'intermediate', domain: 'web' }
);

// Accéder à la réponse finale
console.log(result.result.response);
```

### Workflow Multi-Agent

1. **Affinement du Prompt** (PromptRefinementAgent)
   - Analyse et améliore le prompt utilisateur
   - Génère des instructions pour les autres agents

2. **Distribution des Données** (Simulation)
   - Simule l'appel à différents modèles LLM
   - Génère des réponses variées selon le domaine

3. **Collecte et Agrégation** (CollectionAgent)
   - Collecte les données de toutes les sources
   - Nettoie, valide et agrège les informations

4. **Synthèse Finale** (SynthesisAgent)
   - Compile les données en réponse cohérente
   - Applique le formatage et les contrôles qualité

### Métriques et Monitoring

Le système collecte automatiquement:
- Temps de traitement par étape
- Taux de succès/échec
- Scores de confiance et qualité
- Métriques par agent
- Couverture des sujets

### Structure des Agents

```
agents/
├── PromptRefinementAgent.js  # 13.5KB - Agent d'affinement
├── CollectionAgent.js        # 22.7KB - Agent de collecte
├── SynthesisAgent.js         # 35.0KB - Agent de synthèse
└── orchestrator/
    └── index.js              # 24.7KB - Orchestrateur principal
```

### Séparation MOSAICMIND

Tous les agents incluent des validations strictes pour:
- ✅ Vérification de séparation à l'initialisation
- ✅ Validation des données d'entrée
- ✅ Blocage des références MOSAICMIND
- ✅ Tests de non-contamination
