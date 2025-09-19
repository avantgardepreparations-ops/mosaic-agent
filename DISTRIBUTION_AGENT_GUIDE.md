# DistributionAgent - Guide d'Intégration

Ce guide explique comment utiliser le nouveau `DistributionAgent` pour intégrer les APIs externes dans votre workflow.

## 📁 Structure des Fichiers

```
mosaic-agent/
├── DistributionAgent.js           # Agent de distribution des requêtes
├── agents/
│   └── orchestrator/
│       └── index.js               # Orchestrateur avec DistributionAgent
├── package.json                   # Dépendances Node.js
├── .env.example.agents           # Exemple de configuration
├── test.js                       # Tests de validation
└── integration-example.js        # Exemple d'intégration
```

## 🚀 Installation

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer les variables d'environnement :**
```bash
cp .env.example.agents .env
# Éditer .env avec vos clés d'API
```

## 🔧 APIs Supportées

Le `DistributionAgent` supporte les APIs suivantes :

- **Ollama** (local) - `OLLAMA_URL`
- **HuggingFace Inference** - `HUGGINGFACE_API_TOKEN` 
- **Together AI** - `TOGETHER_API_TOKEN`
- **Replicate** - `REPLICATE_API_TOKEN`
- **OpenRouter** - `OPENROUTER_API_TOKEN`
- **Groq** - `GROQ_API_TOKEN`
- **Anyscale** - `ANYSCALE_API_TOKEN`

## 📖 Utilisation de Base

### DistributionAgent Standalone

```javascript
const DistributionAgent = require('./DistributionAgent');

const agent = new DistributionAgent();

// Envoyer une requête à toutes les APIs disponibles
const result = await agent.distributeQuery("Explain machine learning", {
  temperature: 0.7,
  maxTokens: 200
});

console.log(result.summary); // Statistiques
console.log(result.results); // Réponses de chaque API
```

### Orchestrateur Complet

```javascript
const Orchestrator = require('./agents/orchestrator/index');

const orchestrator = new Orchestrator();

// Traiter une requête utilisateur
const response = await orchestrator.processUserRequest(
  "What are microservices?",
  { temperature: 0.7 }
);

console.log(response.finalResponse.content);
```

## 🔄 Migration depuis un Mock

Pour remplacer un mock existant :

```javascript
// Avant (Mock)
async function oldMockFunction(prompt) {
  return { response: "mock response" };
}

// Après (DistributionAgent)
const DistributionAgent = require('./DistributionAgent');
const agent = new DistributionAgent();

async function newRealFunction(prompt) {
  const result = await agent.distributeQuery(prompt);
  return result.success ? result.results : { error: result.error };
}
```

## 🛠 Fonctionnalités Avancées

### Gestion des Erreurs

```javascript
const result = await agent.distributeQuery("prompt");

if (result.success) {
  // Au moins une API a répondu
  const successful = result.results.filter(r => r.success);
  const failed = result.results.filter(r => !r.success);
} else {
  // Toutes les APIs ont échoué
  console.error("Error:", result.error);
}
```

### Configuration Personnalisée

```javascript
// Désactiver une API
agent.toggleAPI('huggingface', false);

// Modifier la configuration
agent.updateAPIConfig('ollama', {
  url: 'http://custom-ollama:11434'
});

// Vérifier le statut
const status = agent.getAPIStatus();
```

### Options de Requête

```javascript
const result = await agent.distributeQuery("prompt", {
  temperature: 0.9,        // Créativité
  maxTokens: 500,         // Longueur max
  model: 'llama3',        // Modèle spécifique (si supporté)
  maxLength: 300          // Alternative à maxTokens
});
```

## 🧪 Tests et Validation

```bash
# Tests unitaires
node test.js

# Démonstration complète
node agents/orchestrator/index.js

# Exemple d'intégration
node integration-example.js
```

## 🔐 Sécurité

- **Clés d'API** : Stockées dans `.env`, jamais dans le code
- **Timeouts** : 30 secondes par défaut pour éviter les blocages
- **Retry Logic** : 3 tentatives avec backoff exponentiel
- **Validation** : Vérification des réponses avant traitement

## 📊 Performance

- **Requêtes parallèles** : Toutes les APIs sont interrogées simultanément
- **Gestion des timeouts** : Évite les blocages sur APIs lentes
- **Métriques** : Temps de réponse et taux de succès trackés
- **Optimisation** : Priorisation des réponses par qualité et vitesse

## 🚨 Dépannage

### Aucune API disponible
```
⚠️ No APIs are configured. Please check your environment variables.
```
**Solution :** Configurer au moins une clé d'API dans `.env`

### Toutes les APIs échouent
```
❌ Distribution failed: All APIs failed
```
**Solutions :**
- Vérifier la connexion internet
- Valider les clés d'API
- Tester les endpoints individuellement

### Erreurs Ollama
```
[Ollama] Error: Error
```
**Solutions :**
- Vérifier qu'Ollama est démarré : `ollama serve`
- Vérifier l'URL : `OLLAMA_URL=http://localhost:11434`
- Installer un modèle : `ollama pull llama3`

## 🎯 Points d'Intégration

Le `DistributionAgent` peut être intégré dans :

1. **Workflows existants** - Remplacer les mocks
2. **APIs REST** - Endpoints de génération de contenu  
3. **Applications web** - Backends de chatbots
4. **Pipelines ML** - Enrichissement de données
5. **Scripts d'automatisation** - Traitement de texte

## 📈 Monitoring

```javascript
// Surveiller les performances
const result = await agent.distributeQuery("prompt");

console.log(`APIs utilisées: ${result.summary.total}`);
console.log(`Taux de succès: ${result.summary.successful}/${result.summary.total}`);
console.log(`Temps total: ${result.summary.totalTime}ms`);
console.log(`Temps moyen: ${result.summary.averageResponseTime}ms`);
```

---

**Note :** Ce DistributionAgent remplace complètement les mocks précédents et fournit une intégration robuste avec les APIs d'IA externes.