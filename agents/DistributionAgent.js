/**
 * DistributionAgent.js
 * Agent responsable de la distribution des tâches vers différents modèles/ressources
 * Soumet les prompts affinés à diverses sources d'information avec intégrations API externes
 */

const AgentBase = require('./base/AgentBase');
const axios = require('axios');

class DistributionAgent extends AgentBase {
  constructor () {
    super(
      'DistributionAgent',
      'Architecte de Distribution Multi-Sources',
      ['task_distribution', 'load_balancing', 'resource_management', 'parallel_processing']
    );

    // Configuration des sources externes avec vraies APIs
    this.availableSources = [
      {
        id: 'ollama_llama3',
        name: 'Ollama LLaMA 3',
        type: 'language_model',
        status: 'active',
        priority: 1,
        apiUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: 'llama3',
        external: true
      },
      {
        id: 'ollama_mistral',
        name: 'Ollama Mistral',
        type: 'language_model',
        status: 'active',
        priority: 2,
        apiUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: 'mistral',
        external: true
      },
      {
        id: 'ollama_codegemma',
        name: 'Ollama CodeGemma',
        type: 'code_model',
        status: 'active',
        priority: 3,
        apiUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: 'codegemma',
        external: true
      },
      {
        id: 'openai_gpt4',
        name: 'OpenAI GPT-4',
        type: 'language_model',
        status: process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        priority: 4,
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        external: true,
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      },
      {
        id: 'huggingface_inference',
        name: 'Hugging Face Inference',
        type: 'language_model',
        status: process.env.HUGGINGFACE_API_KEY ? 'active' : 'inactive',
        priority: 5,
        apiUrl: 'https://api-inference.huggingface.co/models/',
        model: 'microsoft/DialoGPT-medium',
        external: true,
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      },
      {
        id: 'knowledge_base',
        name: 'Base de Connaissances',
        type: 'database',
        status: 'active',
        priority: 6,
        external: false // Locale
      },
      {
        id: 'chromadb',
        name: 'ChromaDB Vector Search',
        type: 'vector_database',
        status: 'active',
        priority: 7,
        apiUrl: process.env.CHROMADB_URL || 'http://localhost:8000',
        external: true
      }
    ];

    // Configuration des timeouts par type d'API
    this.apiTimeouts = {
      ollama: 30000, // 30 secondes pour Ollama local
      openai: 60000, // 60 secondes pour OpenAI
      huggingface: 45000, // 45 secondes pour HuggingFace
      chromadb: 15000 // 15 secondes pour ChromaDB
    };
  }

  /**
     * Distribue une tâche vers les sources appropriées
     * @param {Object} input - Contient le prompt affiné et les paramètres de distribution
     * @returns {Promise<Object>} - Résultats agrégés de toutes les sources
     */
  async process (input) {
    const { refinedPrompt, taskType = 'general', maxSources = 3, timeout = 10000 } = input;

    if (!refinedPrompt) {
      throw new Error('Prompt affiné requis pour la distribution');
    }

    this.log(`Distribution de la tâche: ${taskType}`);

    // Sélection des sources appropriées
    const selectedSources = this.selectSources(taskType, maxSources);

    // Distribution parallèle (simulation)
    const distributionResults = await this.distributeToSources(refinedPrompt, selectedSources, timeout);

    // Agrégation des résultats
    const aggregatedResults = this.aggregateResults(distributionResults);

    const result = {
      originalPrompt: refinedPrompt,
      taskType,
      sourcesUsed: selectedSources.map(s => s.name),
      distributionResults,
      aggregatedResult: aggregatedResults,
      processingTime: this.getProcessingTime(),
      efficiency: this.calculateEfficiency(distributionResults),
      agent: this.name
    };

    this.log(`Tâche distribuée vers ${selectedSources.length} sources avec succès`);
    return result;
  }

  /**
     * Sélectionne les sources appropriées pour le type de tâche
     * @param {string} taskType - Type de tâche ('general', 'code', 'research', etc.)
     * @param {number} maxSources - Nombre maximum de sources à utiliser
     * @returns {Array} - Sources sélectionnées
     */
  selectSources (taskType, maxSources) {
    let availableSources = this.availableSources.filter(source => source.status === 'active');

    // Filtrage par type de tâche avec priorité aux sources externes
    switch (taskType) {
      case 'code':
        availableSources = availableSources.filter(s =>
          s.type === 'code_model' || s.type === 'language_model'
        ).sort((a, b) => {
          // Prioriser les modèles de code
          if (a.type === 'code_model' && b.type !== 'code_model') return -1;
          if (b.type === 'code_model' && a.type !== 'code_model') return 1;
          // Ensuite prioriser les sources externes
          if (a.external && !b.external) return -1;
          if (b.external && !a.external) return 1;
          // Enfin par priorité
          return a.priority - b.priority;
        });
        break;

      case 'research':
        availableSources = availableSources.filter(s =>
          s.type === 'database' || s.type === 'vector_database' ||
                    s.type === 'search_engine' || s.type === 'language_model'
        ).sort((a, b) => {
          // Prioriser les bases de données pour la recherche
          if ((a.type === 'database' || a.type === 'vector_database') &&
                        (b.type !== 'database' && b.type !== 'vector_database')) return -1;
          if ((b.type === 'database' || b.type === 'vector_database') &&
                        (a.type !== 'database' && a.type !== 'vector_database')) return 1;
          return a.priority - b.priority;
        });
        break;

      case 'creative':
        // Pour les tâches créatives, privilégier les modèles avancés
        availableSources = availableSources.filter(s =>
          s.type === 'language_model'
        ).sort((a, b) => {
          // Prioriser OpenAI pour la créativité
          if (a.id.includes('openai') && !b.id.includes('openai')) return -1;
          if (b.id.includes('openai') && !a.id.includes('openai')) return 1;
          return a.priority - b.priority;
        });
        break;

      case 'general':
      default:
        // Équilibre entre sources externes et locales
        availableSources = availableSources.sort((a, b) => {
          // Mix de sources externes et locales
          return a.priority - b.priority;
        });
        break;
    }

    // Limiter au nombre maximal demandé
    const selectedSources = availableSources.slice(0, maxSources);

    this.log(`Sources sélectionnées pour tâche ${taskType}: ${selectedSources.map(s => s.name).join(', ')}`);

    return selectedSources;
  }

  /**
     * Distribue la tâche vers les sources sélectionnées
     * @param {string} prompt - Prompt à traiter
     * @param {Array} sources - Sources sélectionnées
     * @param {number} timeout - Timeout en millisecondes
     * @returns {Promise<Array>} - Résultats de chaque source
     */
  async distributeToSources (prompt, sources, timeout) {
    const distributionPromises = sources.map(source =>
      this.querySource(source, prompt, timeout)
    );

    try {
      const results = await Promise.allSettled(distributionPromises);
      return results.map((result, index) => ({
        source: sources[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
        responseTime: Math.random() * 2000 + 500 // Mock response time
      }));
    } catch (error) {
      this.logError(`Erreur lors de la distribution: ${error.message}`);
      throw error;
    }
  }

  /**
     * Simule une requête vers une source externe ou fait un appel API réel
     * @param {Object} source - Source à interroger
     * @param {string} prompt - Prompt à envoyer
     * @param {number} timeout - Timeout
     * @returns {Promise<Object>} - Réponse de la source
     */
  async querySource (source, prompt, timeout) {
    try {
      // Si la source est externe, utiliser l'API réelle
      if (source.external) {
        return await this.queryExternalAPI(source, prompt, timeout);
      } else {
        // Utiliser la simulation pour les sources locales
        return await this.queryMockSource(source, prompt, timeout);
      }
    } catch (error) {
      this.logError(`Erreur lors de la requête vers ${source.name}: ${error.message}`);
      throw error;
    }
  }

  /**
     * Fait un appel API réel vers une source externe
     * @param {Object} source - Source externe à interroger
     * @param {string} prompt - Prompt à envoyer
     * @param {number} timeout - Timeout
     * @returns {Promise<Object>} - Réponse de l'API externe
     */
  async queryExternalAPI (source, prompt, timeout) {
    const startTime = Date.now();

    try {
      // Déterminer le timeout approprié
      const sourceType = this.getSourceType(source);
      const apiTimeout = Math.min(timeout, this.apiTimeouts[sourceType] || timeout);

      let response;

      switch (sourceType) {
        case 'ollama':
          response = await this.queryOllamaAPI(source, prompt, apiTimeout);
          break;
        case 'openai':
          response = await this.queryOpenAIAPI(source, prompt, apiTimeout);
          break;
        case 'huggingface':
          response = await this.queryHuggingFaceAPI(source, prompt, apiTimeout);
          break;
        case 'chromadb':
          response = await this.queryChromaDBAPI(source, prompt, apiTimeout);
          break;
        default:
          throw new Error(`Type d'API non supporté: ${sourceType}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        ...response,
        responseTime,
        source: source.name,
        external: true
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // En cas d'erreur avec l'API externe, générer une réponse de fallback
      this.logError(`API externe ${source.name} échouée: ${error.message}`);

      return {
        type: 'fallback_response',
        content: `API ${source.name} temporairement indisponible. Réponse de fallback générée.`,
        confidence: 0.3,
        error: error.message,
        responseTime,
        source: source.name,
        external: true,
        fallback: true
      };
    }
  }

  /**
     * Appel API Ollama pour les modèles locaux
     */
  async queryOllamaAPI (source, prompt, timeout) {
    const requestData = {
      model: source.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      }
    };

    const response = await axios.post(
            `${source.apiUrl}/api/generate`,
            requestData,
            {
              timeout,
              headers: { 'Content-Type': 'application/json' }
            }
    );

    return {
      type: source.type === 'code_model' ? 'code_generation' : 'text_generation',
      content: response.data.response || 'Réponse vide',
      confidence: 0.85,
      tokens_used: response.data.eval_count || 0,
      model: source.model,
      provider: 'ollama'
    };
  }

  /**
     * Appel API OpenAI
     */
  async queryOpenAIAPI (source, prompt, timeout) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Clé API OpenAI non configurée');
    }

    const requestData = {
      model: source.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };

    const response = await axios.post(
      source.apiUrl,
      requestData,
      {
        timeout,
        headers: source.headers
      }
    );

    const choice = response.data.choices?.[0];

    return {
      type: 'text_generation',
      content: choice?.message?.content || 'Réponse vide',
      confidence: 0.9,
      tokens_used: response.data.usage?.total_tokens || 0,
      model: source.model,
      provider: 'openai'
    };
  }

  /**
     * Appel API Hugging Face
     */
  async queryHuggingFaceAPI (source, prompt, timeout) {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Clé API Hugging Face non configurée');
    }

    const requestData = {
      inputs: prompt,
      parameters: {
        max_length: 1000,
        temperature: 0.7,
        do_sample: true
      }
    };

    const response = await axios.post(
            `${source.apiUrl}${source.model}`,
            requestData,
            {
              timeout,
              headers: source.headers
            }
    );

    const result = Array.isArray(response.data) ? response.data[0] : response.data;

    return {
      type: 'text_generation',
      content: result.generated_text || 'Réponse vide',
      confidence: 0.8,
      model: source.model,
      provider: 'huggingface'
    };
  }

  /**
     * Appel API ChromaDB pour la recherche vectorielle
     */
  async queryChromaDBAPI (source, prompt, timeout) {
    const requestData = {
      query_texts: [prompt],
      n_results: 5
    };

    const response = await axios.post(
            `${source.apiUrl}/api/v1/collections/default/query`,
            requestData,
            {
              timeout,
              headers: { 'Content-Type': 'application/json' }
            }
    );

    const results = response.data.documents?.[0] || [];

    return {
      type: 'vector_search',
      content: `Trouvé ${results.length} documents pertinents: ${results.slice(0, 3).join(', ')}`,
      confidence: 0.75,
      results_count: results.length,
      provider: 'chromadb'
    };
  }

  /**
     * Simulation pour les sources locales (fallback)
     */
  async queryMockSource (source, prompt, timeout) {
    return new Promise((resolve, reject) => {
      const processingTime = Math.random() * 3000 + 500; // 500-3500ms

      if (processingTime > timeout) {
        reject(new Error(`Timeout pour ${source.name}`));
        return;
      }

      setTimeout(() => {
        const response = this.generateMockResponse(source, prompt);
        resolve(response);
      }, processingTime);
    });
  }

  /**
     * Détermine le type de source pour le routing des APIs
     */
  getSourceType (source) {
    if (source.apiUrl?.includes('ollama') || source.id.startsWith('ollama_')) {
      return 'ollama';
    } else if (source.apiUrl?.includes('openai') || source.id.includes('openai')) {
      return 'openai';
    } else if (source.apiUrl?.includes('huggingface') || source.id.includes('huggingface')) {
      return 'huggingface';
    } else if (source.apiUrl?.includes('chroma') || source.id.includes('chroma')) {
      return 'chromadb';
    }
    return 'unknown';
  }

  /**
     * Génère une réponse mock basée sur le type de source
     * @param {Object} source - Source interrogée
     * @param {string} prompt - Prompt original
     * @returns {Object} - Réponse mock
     */
  generateMockResponse (source, prompt) {
    const responses = {
      language_model: {
        type: 'text_generation',
        content: `Réponse générée par ${source.name}: ${this.generateTextResponse(prompt)}`,
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        tokens_used: Math.floor(Math.random() * 500 + 100)
      },
      code_model: {
        type: 'code_generation',
        content: `Code généré par ${source.name}:\n${this.generateCodeResponse(prompt)}`,
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        syntax_validated: true,
        language_detected: 'javascript'
      },
      database: {
        type: 'knowledge_retrieval',
        content: `Informations trouvées dans ${source.name}: ${this.generateKnowledgeResponse(prompt)}`,
        relevance_score: Math.random() * 0.4 + 0.6,
        sources_count: Math.floor(Math.random() * 10 + 1)
      },
      search_engine: {
        type: 'web_search',
        content: `Résultats de recherche via ${source.name}`,
        results_count: Math.floor(Math.random() * 20 + 5),
        freshness: 'recent'
      }
    };

    return responses[source.type] || { type: 'unknown', content: 'Réponse générique', confidence: 0.5 };
  }

  generateTextResponse (prompt) {
    return `Analyse détaillée de votre demande "${prompt.substring(0, 30)}..." avec recommandations spécifiques.`;
  }

  generateCodeResponse (prompt) {
    return `// Code example based on: ${prompt.substring(0, 20)}...\nfunction example() {\n    return "Mock implementation";\n}`;
  }

  generateKnowledgeResponse (prompt) {
    return `Documentation et exemples pertinents pour "${prompt.substring(0, 25)}..." trouvés dans la base de connaissances.`;
  }

  /**
     * Agrège les résultats de toutes les sources (internes et externes)
     * @param {Array} results - Résultats de distribution
     * @returns {Object} - Résultat agrégé
     */
  aggregateResults (results) {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    const externalResults = successfulResults.filter(r => r.data?.external);
    const localResults = successfulResults.filter(r => !r.data?.external);
    const fallbackResults = successfulResults.filter(r => r.data?.fallback);

    const aggregated = {
      summary: this.createSummary(successfulResults),
      successful_sources: successfulResults.length,
      failed_sources: failedResults.length,
      external_sources: externalResults.length,
      local_sources: localResults.length,
      fallback_sources: fallbackResults.length,
      average_response_time: this.calculateAverageResponseTime(successfulResults),
      highest_confidence: this.getHighestConfidence(successfulResults),
      combined_content: this.combineContent(successfulResults),
      reliability_score: this.calculateReliabilityScore(results),
      api_health: this.calculateAPIHealth(results),
      diversity_score: this.calculateDiversityScore(successfulResults)
    };

    return aggregated;
  }

  /**
     * Calcule la santé des APIs externes
     */
  calculateAPIHealth (results) {
    const externalResults = results.filter(r => r.data?.external);
    if (externalResults.length === 0) return null;

    const successfulExternal = externalResults.filter(r => r.success && !r.data?.fallback);
    const healthScore = successfulExternal.length / externalResults.length;

    return {
      score: Math.round(healthScore * 100) / 100,
      total_external: externalResults.length,
      successful_external: successfulExternal.length,
      status: healthScore >= 0.8 ? 'excellent' : healthScore >= 0.6 ? 'good' : healthScore >= 0.4 ? 'fair' : 'poor'
    };
  }

  /**
     * Calcule un score de diversité des sources
     */
  calculateDiversityScore (results) {
    const providers = [...new Set(results.map(r => r.data?.provider || 'local'))];
    const types = [...new Set(results.map(r => r.data?.type || 'unknown'))];

    return {
      providers_count: providers.length,
      types_count: types.length,
      diversity_ratio: Math.round((providers.length + types.length) / (results.length * 2) * 100) / 100
    };
  }

  createSummary (results) {
    if (results.length === 0) return 'Aucun résultat obtenu';

    const types = [...new Set(results.map(r => r.data.type))];
    const providers = [...new Set(results.map(r => r.data.provider || 'local'))];
    const externalCount = results.filter(r => r.data.external).length;
    const fallbackCount = results.filter(r => r.data.fallback).length;

    let summary = `${results.length} sources ont répondu avec succès.`;
    summary += ` Types: ${types.join(', ')}.`;

    if (providers.length > 1) {
      summary += ` Providers: ${providers.join(', ')}.`;
    }

    if (externalCount > 0) {
      summary += ` ${externalCount} API(s) externe(s) utilisée(s).`;
    }

    if (fallbackCount > 0) {
      summary += ` ${fallbackCount} réponse(s) de fallback générée(s).`;
    }

    return summary;
  }

  calculateAverageResponseTime (results) {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.responseTime, 0);
    return Math.round(total / results.length);
  }

  getHighestConfidence (results) {
    const confidences = results
      .map(r => r.data.confidence)
      .filter(c => typeof c === 'number');

    return confidences.length > 0 ? Math.max(...confidences) : 0;
  }

  combineContent (results) {
    return results.map((r, index) => ({
      source: r.source.name,
      type: r.data.type,
      provider: r.data.provider || 'local',
      external: r.data.external || false,
      fallback: r.data.fallback || false,
      confidence: r.data.confidence,
      responseTime: r.responseTime,
      content: r.data.content.substring(0, 200) + (r.data.content.length > 200 ? '...' : ''),
      tokens_used: r.data.tokens_used || null,
      model: r.data.model || null
    }));
  }

  calculateReliabilityScore (results) {
    const successRate = results.filter(r => r.success).length / results.length;
    const avgResponseTime = this.calculateAverageResponseTime(results.filter(r => r.success));
    const timeScore = Math.max(0, 1 - (avgResponseTime / 5000)); // Pénalise les temps > 5s

    return Math.round((successRate * 0.7 + timeScore * 0.3) * 100) / 100;
  }

  calculateEfficiency (results) {
    const efficiency = {
      task_completion_rate: results.filter(r => r.success).length / results.length,
      average_response_time: this.calculateAverageResponseTime(results.filter(r => r.success)),
      resource_utilization: results.length / this.availableSources.filter(s => s.status === 'active').length,
      error_rate: results.filter(r => !r.success).length / results.length
    };

    efficiency.overall_score = Math.round(
      (efficiency.task_completion_rate * 0.4 +
             (1 - efficiency.error_rate) * 0.3 +
             efficiency.resource_utilization * 0.3) * 100
    ) / 100;

    return efficiency;
  }

  getProcessingTime () {
    return Math.random() * 1000 + 500; // 500-1500ms
  }
}

module.exports = DistributionAgent;
