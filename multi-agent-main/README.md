# Multi-Agent Liaison Application

## ⚠️ ATTENTION - SÉPARATION STRICTE REQUISE ⚠️

**NE JAMAIS MÉLANGER AVEC MOSAICMIND**

Cette application de liaison multi-agent doit rester **complètement séparée** de MOSAICMIND en toutes circonstances.

## Description

Application de liaison multi-agent conçue pour fonctionner de manière **strictement indépendante** et **jamais intégrée** avec MOSAICMIND.

### Architecture FastAPI Backend

Cette application inclut maintenant un backend FastAPI moderne avec:

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
