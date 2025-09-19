/**
 * DistributionAgent.js
 * Agent responsable de la distribution des tâches vers différents modèles/ressources
 * Soumet les prompts affinés à diverses sources d'information
 */

const AgentBase = require('./base/AgentBase');

class DistributionAgent extends AgentBase {
    constructor() {
        super(
            'DistributionAgent',
            'Architecte de Distribution Multi-Sources',
            ['task_distribution', 'load_balancing', 'resource_management', 'parallel_processing']
        );
        
        // Configuration mock des sources disponibles
        this.availableSources = [
            { id: 'llama3', name: 'LLaMA 3', type: 'language_model', status: 'active', priority: 1 },
            { id: 'mistral', name: 'Mistral', type: 'language_model', status: 'active', priority: 2 },
            { id: 'codegemma', name: 'CodeGemma', type: 'code_model', status: 'active', priority: 3 },
            { id: 'knowledge_base', name: 'Base de Connaissances', type: 'database', status: 'active', priority: 4 },
            { id: 'web_search', name: 'Recherche Web', type: 'search_engine', status: 'inactive', priority: 5 }
        ];
    }

    /**
     * Distribue une tâche vers les sources appropriées
     * @param {Object} input - Contient le prompt affiné et les paramètres de distribution
     * @returns {Promise<Object>} - Résultats agrégés de toutes les sources
     */
    async process(input) {
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
            taskType: taskType,
            sourcesUsed: selectedSources.map(s => s.name),
            distributionResults: distributionResults,
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
    selectSources(taskType, maxSources) {
        let availableSources = this.availableSources.filter(source => source.status === 'active');

        // Filtrage par type de tâche
        switch (taskType) {
            case 'code':
                availableSources = availableSources.filter(s => 
                    s.type === 'code_model' || s.type === 'language_model'
                ).sort((a, b) => {
                    if (a.type === 'code_model') return -1;
                    if (b.type === 'code_model') return 1;
                    return a.priority - b.priority;
                });
                break;
            
            case 'research':
                availableSources = availableSources.filter(s => 
                    s.type === 'database' || s.type === 'search_engine' || s.type === 'language_model'
                );
                break;
            
            case 'general':
            default:
                availableSources = availableSources.sort((a, b) => a.priority - b.priority);
                break;
        }

        return availableSources.slice(0, maxSources);
    }

    /**
     * Distribue la tâche vers les sources sélectionnées
     * @param {string} prompt - Prompt à traiter
     * @param {Array} sources - Sources sélectionnées
     * @param {number} timeout - Timeout en millisecondes
     * @returns {Promise<Array>} - Résultats de chaque source
     */
    async distributeToSources(prompt, sources, timeout) {
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
     * Simule une requête vers une source externe
     * @param {Object} source - Source à interroger
     * @param {string} prompt - Prompt à envoyer
     * @param {number} timeout - Timeout
     * @returns {Promise<Object>} - Réponse de la source
     */
    async querySource(source, prompt, timeout) {
        // Simulation d'une requête asynchrone
        return new Promise((resolve, reject) => {
            const processingTime = Math.random() * 3000 + 500; // 500-3500ms
            
            if (processingTime > timeout) {
                reject(new Error(`Timeout pour ${source.name}`));
                return;
            }

            setTimeout(() => {
                // Simulation de réponses différenciées par type de source
                const response = this.generateMockResponse(source, prompt);
                resolve(response);
            }, processingTime);
        });
    }

    /**
     * Génère une réponse mock basée sur le type de source
     * @param {Object} source - Source interrogée
     * @param {string} prompt - Prompt original
     * @returns {Object} - Réponse mock
     */
    generateMockResponse(source, prompt) {
        const responses = {
            'language_model': {
                type: 'text_generation',
                content: `Réponse générée par ${source.name}: ${this.generateTextResponse(prompt)}`,
                confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
                tokens_used: Math.floor(Math.random() * 500 + 100)
            },
            'code_model': {
                type: 'code_generation',
                content: `Code généré par ${source.name}:\n${this.generateCodeResponse(prompt)}`,
                confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
                syntax_validated: true,
                language_detected: 'javascript'
            },
            'database': {
                type: 'knowledge_retrieval',
                content: `Informations trouvées dans ${source.name}: ${this.generateKnowledgeResponse(prompt)}`,
                relevance_score: Math.random() * 0.4 + 0.6,
                sources_count: Math.floor(Math.random() * 10 + 1)
            },
            'search_engine': {
                type: 'web_search',
                content: `Résultats de recherche via ${source.name}`,
                results_count: Math.floor(Math.random() * 20 + 5),
                freshness: 'recent'
            }
        };

        return responses[source.type] || { type: 'unknown', content: 'Réponse générique', confidence: 0.5 };
    }

    generateTextResponse(prompt) {
        return `Analyse détaillée de votre demande "${prompt.substring(0, 30)}..." avec recommandations spécifiques.`;
    }

    generateCodeResponse(prompt) {
        return `// Code example based on: ${prompt.substring(0, 20)}...\nfunction example() {\n    return "Mock implementation";\n}`;
    }

    generateKnowledgeResponse(prompt) {
        return `Documentation et exemples pertinents pour "${prompt.substring(0, 25)}..." trouvés dans la base de connaissances.`;
    }

    /**
     * Agrège les résultats de toutes les sources
     * @param {Array} results - Résultats de distribution
     * @returns {Object} - Résultat agrégé
     */
    aggregateResults(results) {
        const successfulResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);

        const aggregated = {
            summary: this.createSummary(successfulResults),
            successful_sources: successfulResults.length,
            failed_sources: failedResults.length,
            average_response_time: this.calculateAverageResponseTime(successfulResults),
            highest_confidence: this.getHighestConfidence(successfulResults),
            combined_content: this.combineContent(successfulResults),
            reliability_score: this.calculateReliabilityScore(results)
        };

        return aggregated;
    }

    createSummary(results) {
        if (results.length === 0) return "Aucun résultat obtenu";
        
        const types = [...new Set(results.map(r => r.data.type))];
        return `${results.length} sources ont répondu avec succès. Types: ${types.join(', ')}`;
    }

    calculateAverageResponseTime(results) {
        if (results.length === 0) return 0;
        const total = results.reduce((sum, r) => sum + r.responseTime, 0);
        return Math.round(total / results.length);
    }

    getHighestConfidence(results) {
        const confidences = results
            .map(r => r.data.confidence)
            .filter(c => typeof c === 'number');
        
        return confidences.length > 0 ? Math.max(...confidences) : 0;
    }

    combineContent(results) {
        return results.map((r, index) => ({
            source: r.source.name,
            type: r.data.type,
            content: r.data.content.substring(0, 200) + (r.data.content.length > 200 ? '...' : '')
        }));
    }

    calculateReliabilityScore(results) {
        const successRate = results.filter(r => r.success).length / results.length;
        const avgResponseTime = this.calculateAverageResponseTime(results.filter(r => r.success));
        const timeScore = Math.max(0, 1 - (avgResponseTime / 5000)); // Pénalise les temps > 5s
        
        return Math.round((successRate * 0.7 + timeScore * 0.3) * 100) / 100;
    }

    calculateEfficiency(results) {
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

    getProcessingTime() {
        return Math.random() * 1000 + 500; // 500-1500ms
    }
}

module.exports = DistributionAgent;