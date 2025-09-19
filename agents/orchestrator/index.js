const DistributionAgent = require('../../DistributionAgent');
require('dotenv').config();

/**
 * Orchestrateur principal - Gère le workflow des agents et l'intégration du DistributionAgent
 */
class Orchestrator {
  constructor() {
    this.distributionAgent = new DistributionAgent();
    this.isInitialized = false;
    
    console.log('🎼 Orchestrator initializing...');
    this.initialize();
  }

  /**
   * Initialise l'orchestrateur et vérifie la configuration
   */
  initialize() {
    console.log('🔧 Checking API configurations...');
    
    const apiStatus = this.distributionAgent.getAPIStatus();
    const enabledAPIs = Object.values(apiStatus).filter(api => api.enabled);
    
    console.log(`📊 API Status:`);
    Object.entries(apiStatus).forEach(([key, status]) => {
      const icon = status.enabled ? '✅' : '❌';
      console.log(`  ${icon} ${status.name}: ${status.enabled ? 'Ready' : 'Disabled (missing token)'}`);
    });
    
    if (enabledAPIs.length === 0) {
      console.warn('⚠️ No APIs are configured. Please check your environment variables.');
      console.log('💡 Required environment variables:');
      console.log('  - HUGGINGFACE_API_TOKEN');
      console.log('  - TOGETHER_API_TOKEN');
      console.log('  - REPLICATE_API_TOKEN');
      console.log('  - OPENROUTER_API_TOKEN');
      console.log('  - GROQ_API_TOKEN');
      console.log('  - ANYSCALE_API_TOKEN');
      console.log('  - OLLAMA_URL (defaults to http://localhost:11434)');
    } else {
      console.log(`✅ ${enabledAPIs.length} API(s) ready for use`);
    }
    
    this.isInitialized = true;
    console.log('🎼 Orchestrator ready!\n');
  }

  /**
   * Traite une requête utilisateur en utilisant le DistributionAgent
   */
  async processUserRequest(userInput, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    console.log('\n🎯 Processing user request...');
    console.log('=' .repeat(50));
    
    try {
      // Phase 1: Distribution vers les APIs externes
      console.log('📡 Phase 1: Distributing query to external APIs...');
      const distributionResult = await this.distributionAgent.distributeQuery(userInput, options);
      
      if (!distributionResult.success) {
        console.error('❌ Distribution failed:', distributionResult.error);
        return {
          success: false,
          error: distributionResult.error,
          phase: 'distribution',
          results: distributionResult.results
        };
      }

      // Phase 2: Agrégation des résultats
      console.log('\n🔄 Phase 2: Aggregating responses...');
      const aggregatedResponse = this.aggregateResponses(distributionResult.results);
      
      // Phase 3: Synthèse finale
      console.log('\n✨ Phase 3: Generating final synthesis...');
      const finalResponse = this.synthesizeResponse(aggregatedResponse, distributionResult.summary);
      
      console.log('\n✅ Request processing completed!');
      console.log('=' .repeat(50));
      
      return {
        success: true,
        error: null,
        userInput: userInput,
        distributionResults: distributionResult,
        aggregatedResponse: aggregatedResponse,
        finalResponse: finalResponse,
        processingTime: distributionResult.summary.totalTime,
        apisSummary: distributionResult.summary
      };

    } catch (error) {
      console.error('💥 Error processing request:', error);
      return {
        success: false,
        error: error.message,
        phase: 'orchestration',
        userInput: userInput
      };
    }
  }

  /**
   * Agrège les réponses des différentes APIs
   */
  aggregateResponses(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📊 Aggregating ${successful.length} successful responses...`);
    
    if (successful.length === 0) {
      return {
        type: 'error',
        content: 'No successful responses to aggregate',
        sources: []
      };
    }

    // Grouper les réponses par source
    const responsesBySource = successful.map(result => ({
      source: result.api,
      content: result.response,
      responseTime: result.responseTime,
      quality: this.assessResponseQuality(result.response)
    }));

    // Trier par qualité et temps de réponse
    responsesBySource.sort((a, b) => {
      if (a.quality !== b.quality) {
        return b.quality - a.quality; // Meilleure qualité en premier
      }
      return a.responseTime - b.responseTime; // Plus rapide en premier
    });

    return {
      type: 'aggregated',
      content: responsesBySource,
      successCount: successful.length,
      failedCount: failed.length,
      bestResponse: responsesBySource[0],
      allResponses: responsesBySource
    };
  }

  /**
   * Évalue la qualité d'une réponse (métrique simple)
   */
  assessResponseQuality(response) {
    if (!response || typeof response !== 'string') return 0;
    
    let score = 0;
    
    // Longueur (ni trop court ni trop long)
    const length = response.length;
    if (length > 20 && length < 1000) score += 2;
    else if (length > 10) score += 1;
    
    // Contenu informatif
    if (response.includes('.') || response.includes('!') || response.includes('?')) score += 1;
    if (response.split(' ').length > 5) score += 1;
    
    // Éviter les réponses d'erreur
    if (response.toLowerCase().includes('error') || 
        response.toLowerCase().includes('sorry') ||
        response.toLowerCase().includes('unable')) {
      score -= 2;
    }
    
    return Math.max(0, score);
  }

  /**
   * Synthétise une réponse finale à partir des résultats agrégés
   */
  synthesizeResponse(aggregatedResponse, summary) {
    if (aggregatedResponse.type === 'error') {
      return {
        type: 'error',
        content: 'Je n\'ai pas pu obtenir de réponses valides des services d\'IA disponibles.',
        suggestions: [
          'Vérifiez votre connexion internet',
          'Assurez-vous que vos clés d\'API sont correctement configurées',
          'Essayez de reformuler votre question'
        ]
      };
    }

    const { bestResponse, allResponses, successCount } = aggregatedResponse;
    
    if (successCount === 1) {
      return {
        type: 'single_source',
        content: bestResponse.content,
        source: bestResponse.source,
        confidence: 'medium',
        responseTime: bestResponse.responseTime
      };
    }

    // Synthèse multi-sources
    const diverseResponses = this.selectDiverseResponses(allResponses);
    
    let synthesizedContent = `Voici une synthèse basée sur ${successCount} sources d'IA :\n\n`;
    
    // Ajouter la meilleure réponse
    synthesizedContent += `**Réponse principale** (${bestResponse.source}) :\n`;
    synthesizedContent += `${bestResponse.content}\n\n`;
    
    // Ajouter des perspectives alternatives si disponibles
    if (diverseResponses.length > 1) {
      synthesizedContent += `**Perspectives complémentaires** :\n`;
      
      diverseResponses.slice(1, 3).forEach((response, index) => {
        synthesizedContent += `\n${index + 2}. **${response.source}** :\n`;
        synthesizedContent += `${response.content}\n`;
      });
    }

    synthesizedContent += `\n---\n`;
    synthesizedContent += `*Synthèse générée à partir de ${successCount} source(s) en ${summary.totalTime}ms*`;

    return {
      type: 'synthesized',
      content: synthesizedContent,
      sources: diverseResponses.map(r => r.source),
      confidence: successCount >= 3 ? 'high' : successCount >= 2 ? 'medium' : 'low',
      totalSources: successCount,
      responseTime: summary.totalTime
    };
  }

  /**
   * Sélectionne des réponses diverses pour éviter la redondance
   */
  selectDiverseResponses(responses, maxResponses = 3) {
    if (responses.length <= maxResponses) return responses;
    
    const selected = [responses[0]]; // Toujours inclure la meilleure
    
    for (let i = 1; i < responses.length && selected.length < maxResponses; i++) {
      const candidate = responses[i];
      
      // Vérifier si cette réponse est suffisamment différente
      const isDiverse = selected.every(existing => 
        this.calculateSimilarity(candidate.content, existing.content) < 0.8
      );
      
      if (isDiverse) {
        selected.push(candidate);
      }
    }
    
    return selected;
  }

  /**
   * Calcule une similarité simple entre deux textes
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Obtient le statut de l'orchestrateur
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      apiStatus: this.distributionAgent.getAPIStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Démonstration avec un exemple de requête
   */
  async demonstrateCapabilities() {
    console.log('\n🎭 Demonstrating Orchestrator Capabilities');
    console.log('=' .repeat(50));
    
    const demoPrompt = "Explain the benefits of using microservices architecture in modern web development.";
    
    console.log(`📝 Demo prompt: ${demoPrompt}\n`);
    
    try {
      const result = await this.processUserRequest(demoPrompt, {
        temperature: 0.7,
        maxTokens: 150
      });
      
      if (result.success) {
        console.log('\n🎊 Demo completed successfully!');
        console.log('\n📋 Final Response:');
        console.log('-' .repeat(30));
        console.log(result.finalResponse.content);
        console.log('-' .repeat(30));
        console.log(`\n📊 Performance: ${result.apisSummary.successful}/${result.apisSummary.total} APIs responded in ${result.processingTime}ms`);
      } else {
        console.log('\n❌ Demo failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('\n💥 Demo error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Point d'entrée principal
async function main() {
  console.log('🚀 Starting Mosaic Agent Orchestrator\n');
  
  try {
    const orchestrator = new Orchestrator();
    
    // Afficher le statut
    const status = orchestrator.getStatus();
    console.log('📊 Current Status:', JSON.stringify(status.apiStatus, null, 2));
    
    // Lancer la démonstration si des APIs sont disponibles
    const enabledAPIs = Object.values(status.apiStatus).filter(api => api.enabled);
    
    if (enabledAPIs.length > 0) {
      console.log('\n🎯 Running demonstration...');
      await orchestrator.demonstrateCapabilities();
    } else {
      console.log('\n💡 To enable APIs, create a .env file with your API tokens:');
      console.log('HUGGINGFACE_API_TOKEN=your_token_here');
      console.log('TOGETHER_API_TOKEN=your_token_here');
      console.log('REPLICATE_API_TOKEN=your_token_here');
      console.log('OPENROUTER_API_TOKEN=your_token_here');
      console.log('GROQ_API_TOKEN=your_token_here');
      console.log('ANYSCALE_API_TOKEN=your_token_here');
      console.log('OLLAMA_URL=http://localhost:11434');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export pour utilisation en tant que module
module.exports = Orchestrator;

// Exécution directe
if (require.main === module) {
  main().catch(console.error);
}