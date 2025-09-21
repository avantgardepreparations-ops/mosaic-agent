/**
 * CollectionAgent.js
 * Agent responsable de la collecte et de l'agrégation des informations
 * Rassemble les résultats de différentes sources pour former une vue d'ensemble
 */

const AgentBase = require('./base/AgentBase');

class CollectionAgent extends AgentBase {
    constructor() {
        super(
            'CollectionAgent',
            'Spécialiste en Collecte et Agrégation d\'Informations',
            ['data_collection', 'information_synthesis', 'content_aggregation', 'source_correlation']
        );
    }

    /**
     * Collecte et agrège les informations des résultats de distribution
     * @param {Object} input - Contient les résultats de distribution et métadonnées
     * @returns {Promise<Object>} - Informations collectées et synthétisées
     */
    async process(input) {
        const { distributionResults, originalPrompt, taskType = 'general' } = input;

        if (!distributionResults || !distributionResults.aggregatedResult) {
            throw new Error('Résultats de distribution requis pour la collecte');
        }

        this.log(`Collecte d'informations pour la tâche: ${taskType}`);

        // Analyse des résultats collectés
        const dataAnalysis = this.analyzeCollectedData(distributionResults);
        
        // Extraction des éléments clés
        const keyFindings = this.extractKeyFindings(distributionResults);
        
        // Corrélation entre les sources
        const sourceCorrelation = this.correlateSources(distributionResults);
        
        // Synthèse des informations
        const synthesis = this.synthesizeInformation(keyFindings, sourceCorrelation, taskType);
        
        // Évaluation de la qualité des données
        const qualityAssessment = this.assessDataQuality(distributionResults);

        const result = {
            originalPrompt: originalPrompt,
            taskType: taskType,
            dataAnalysis: dataAnalysis,
            keyFindings: keyFindings,
            sourceCorrelation: sourceCorrelation,
            synthesis: synthesis,
            qualityAssessment: qualityAssessment,
            collectionMetrics: this.calculateCollectionMetrics(distributionResults),
            processingTime: this.getProcessingTime(),
            agent: this.name
        };

        this.log(`Collecte terminée: ${keyFindings.length} éléments clés identifiés`);
        return result;
    }

    /**
     * Analyse les données collectées pour identifier les patterns
     * @param {Object} distributionResults - Résultats de la distribution
     * @returns {Object} - Analyse des données
     */
    analyzeCollectedData(distributionResults) {
        const { distributionResults: results, aggregatedResult } = distributionResults;
        
        const analysis = {
            total_sources: results.length,
            successful_sources: results.filter(r => r.success).length,
            source_types: this.categorizeSourceTypes(results),
            content_length: this.analyzeContentLength(results),
            response_times: this.analyzeResponseTimes(results),
            confidence_distribution: this.analyzeConfidenceDistribution(results),
            common_themes: this.identifyCommonThemes(results)
        };

        return analysis;
    }

    /**
     * Extrait les éléments clés des résultats
     * @param {Object} distributionResults - Résultats de distribution
     * @returns {Array} - Éléments clés identifiés
     */
    extractKeyFindings(distributionResults) {
        const { distributionResults: results } = distributionResults;
        const successfulResults = results.filter(r => r.success);
        
        const keyFindings = [];

        // Extraction basée sur la confiance
        successfulResults.forEach(result => {
            const confidence = result.data.confidence || 0;
            const content = result.data.content || '';
            
            if (confidence > 0.8) {
                keyFindings.push({
                    type: 'high_confidence',
                    source: result.source.name,
                    confidence: confidence,
                    content: content.substring(0, 200),
                    category: this.categorizeContent(content),
                    importance: 'high'
                });
            } else if (confidence > 0.6) {
                keyFindings.push({
                    type: 'medium_confidence',
                    source: result.source.name,
                    confidence: confidence,
                    content: content.substring(0, 150),
                    category: this.categorizeContent(content),
                    importance: 'medium'
                });
            }
        });

        // Extraction des éléments techniques spécifiques
        const technicalFindings = this.extractTechnicalElements(successfulResults);
        keyFindings.push(...technicalFindings);

        // Tri par importance et confiance
        return keyFindings.sort((a, b) => {
            const importanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0) ||
                   (b.confidence || 0) - (a.confidence || 0);
        });
    }

    /**
     * Corrèle les informations entre différentes sources
     * @param {Object} distributionResults - Résultats de distribution
     * @returns {Object} - Corrélations identifiées
     */
    correlateSources(distributionResults) {
        const { distributionResults: results } = distributionResults;
        const successfulResults = results.filter(r => r.success);

        const correlations = {
            agreement_level: this.calculateAgreementLevel(successfulResults),
            conflicting_information: this.identifyConflicts(successfulResults),
            complementary_sources: this.findComplementarySources(successfulResults),
            redundant_information: this.identifyRedundancies(successfulResults),
            unique_contributions: this.identifyUniqueContributions(successfulResults)
        };

        return correlations;
    }

    /**
     * Synthétise les informations collectées
     * @param {Array} keyFindings - Éléments clés identifiés
     * @param {Object} correlations - Corrélations entre sources
     * @param {string} taskType - Type de tâche
     * @returns {Object} - Synthèse des informations
     */
    synthesizeInformation(keyFindings, correlations, taskType) {
        const synthesis = {
            executive_summary: this.createExecutiveSummary(keyFindings, taskType),
            main_points: this.extractMainPoints(keyFindings),
            supporting_evidence: this.identifySupportingEvidence(keyFindings, correlations),
            potential_gaps: this.identifyInformationGaps(keyFindings, correlations),
            recommended_actions: this.generateRecommendations(keyFindings, taskType),
            confidence_level: this.calculateOverallConfidence(keyFindings, correlations)
        };

        return synthesis;
    }

    /**
     * Évalue la qualité des données collectées
     * @param {Object} distributionResults - Résultats de distribution
     * @returns {Object} - Évaluation de la qualité
     */
    assessDataQuality(distributionResults) {
        const { distributionResults: results, aggregatedResult } = distributionResults;
        
        const assessment = {
            completeness: this.assessCompleteness(results),
            reliability: aggregatedResult.reliability_score || 0,
            consistency: this.assessConsistency(results),
            timeliness: this.assessTimeliness(results),
            relevance: this.assessRelevance(results),
            overall_quality: 0
        };

        // Calcul de la qualité globale
        assessment.overall_quality = Math.round(
            (assessment.completeness * 0.25 +
             assessment.reliability * 0.25 +
             assessment.consistency * 0.2 +
             assessment.timeliness * 0.15 +
             assessment.relevance * 0.15) * 100
        ) / 100;

        return assessment;
    }

    // Méthodes utilitaires pour l'analyse

    categorizeSourceTypes(results) {
        const types = {};
        results.forEach(result => {
            const type = result.source?.type || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }

    analyzeContentLength(results) {
        const lengths = results
            .filter(r => r.success && r.data?.content)
            .map(r => r.data.content.length);
        
        return {
            min: Math.min(...lengths) || 0,
            max: Math.max(...lengths) || 0,
            average: lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0
        };
    }

    analyzeResponseTimes(results) {
        const times = results
            .filter(r => r.responseTime)
            .map(r => r.responseTime);
        
        return {
            min: Math.min(...times) || 0,
            max: Math.max(...times) || 0,
            average: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
        };
    }

    analyzeConfidenceDistribution(results) {
        const confidences = results
            .filter(r => r.success && r.data?.confidence)
            .map(r => r.data.confidence);
        
        return {
            high: confidences.filter(c => c > 0.8).length,
            medium: confidences.filter(c => c > 0.6 && c <= 0.8).length,
            low: confidences.filter(c => c <= 0.6).length,
            average: confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length * 100) / 100 : 0
        };
    }

    identifyCommonThemes(results) {
        // Mock: Identification de thèmes communs dans le contenu
        const themes = ['documentation', 'exemple', 'implémentation', 'sécurité', 'performance'];
        const identifiedThemes = [];
        
        themes.forEach(theme => {
            const count = results.filter(r => 
                r.success && r.data?.content?.toLowerCase().includes(theme)
            ).length;
            
            if (count > 0) {
                identifiedThemes.push({ theme, occurrences: count });
            }
        });
        
        return identifiedThemes.sort((a, b) => b.occurrences - a.occurrences);
    }

    categorizeContent(content) {
        const categories = {
            'code': ['function', 'class', 'var', 'const', 'import'],
            'documentation': ['guide', 'tutorial', 'exemple', 'how-to'],
            'technical': ['api', 'database', 'server', 'client'],
            'conceptual': ['principe', 'concept', 'théorie', 'approche']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    extractTechnicalElements(results) {
        const technicalFindings = [];
        
        results.forEach(result => {
            const content = result.data?.content || '';
            
            // Recherche de code
            if (content.includes('function') || content.includes('class') || content.includes('import')) {
                technicalFindings.push({
                    type: 'code_snippet',
                    source: result.source.name,
                    confidence: result.data.confidence || 0.7,
                    content: content.substring(0, 100),
                    category: 'code',
                    importance: 'high'
                });
            }
            
            // Recherche d'URLs ou références
            if (content.includes('http') || content.includes('github')) {
                technicalFindings.push({
                    type: 'reference',
                    source: result.source.name,
                    confidence: 0.9,
                    content: content.substring(0, 100),
                    category: 'reference',
                    importance: 'medium'
                });
            }
        });
        
        return technicalFindings;
    }

    calculateAgreementLevel(results) {
        // Mock: Calcul du niveau d'accord entre les sources
        const themes = this.identifyCommonThemes(results);
        const totalSources = results.length;
        
        if (totalSources === 0) return 0;
        
        const agreementScore = themes.reduce((sum, theme) => 
            sum + (theme.occurrences / totalSources), 0) / themes.length;
        
        return Math.min(1, agreementScore || 0);
    }

    identifyConflicts(results) {
        // Mock: Identification de conflits dans les informations
        return [
            { type: 'methodology', description: 'Approches différentes suggérées', severity: 'low' },
            { type: 'version', description: 'Versions différentes mentionnées', severity: 'medium' }
        ];
    }

    findComplementarySources(results) {
        // Mock: Identification de sources complémentaires
        const sourceTypes = [...new Set(results.map(r => r.source.type))];
        return sourceTypes.map(type => ({
            type: type,
            contribution: `Apporte une perspective ${type}`,
            value: 'high'
        }));
    }

    identifyRedundancies(results) {
        // Mock: Identification d'informations redondantes
        return results.filter(r => r.success).slice(0, 2).map(r => ({
            source: r.source.name,
            overlap_percentage: Math.floor(Math.random() * 30 + 10),
            type: 'content_similarity'
        }));
    }

    identifyUniqueContributions(results) {
        return results.filter(r => r.success).map(r => ({
            source: r.source.name,
            unique_aspect: `Perspective unique de ${r.source.type}`,
            value: r.data.confidence > 0.8 ? 'high' : 'medium'
        }));
    }

    createExecutiveSummary(keyFindings, taskType) {
        const highConfidenceFindings = keyFindings.filter(f => f.importance === 'high').length;
        return `Collecte terminée pour tâche ${taskType}: ${keyFindings.length} éléments identifiés, dont ${highConfidenceFindings} à haute confiance.`;
    }

    extractMainPoints(keyFindings) {
        return keyFindings.slice(0, 5).map((finding, index) => ({
            point: `Point principal ${index + 1}`,
            source: finding.source,
            confidence: finding.confidence,
            category: finding.category
        }));
    }

    identifySupportingEvidence(keyFindings, correlations) {
        return {
            high_confidence_sources: keyFindings.filter(f => f.confidence > 0.8).length,
            agreement_level: correlations.agreement_level,
            source_diversity: correlations.unique_contributions.length
        };
    }

    identifyInformationGaps(keyFindings, correlations) {
        // Mock: Identification des manques d'information
        return [
            { gap: 'Manque d\'exemples pratiques', severity: 'medium' },
            { gap: 'Détails d\'implémentation incomplets', severity: 'low' }
        ];
    }

    generateRecommendations(keyFindings, taskType) {
        const recommendations = [];
        
        if (keyFindings.length < 3) {
            recommendations.push('Élargir la recherche d\'informations');
        }
        
        if (keyFindings.filter(f => f.category === 'code').length === 0 && taskType === 'code') {
            recommendations.push('Rechercher des exemples de code spécifiques');
        }
        
        recommendations.push('Valider les informations avec des sources additionnelles');
        
        return recommendations;
    }

    calculateOverallConfidence(keyFindings, correlations) {
        const avgConfidence = keyFindings.reduce((sum, f) => sum + (f.confidence || 0), 0) / keyFindings.length;
        const agreementBonus = correlations.agreement_level * 0.1;
        
        return Math.min(0.95, avgConfidence + agreementBonus);
    }

    // Méthodes d'évaluation de qualité

    assessCompleteness(results) {
        const expectedSources = 3; // Mock
        const actualSources = results.filter(r => r.success).length;
        return Math.min(1, actualSources / expectedSources);
    }

    assessConsistency(results) {
        // Mock: Évaluation de la cohérence
        return Math.random() * 0.3 + 0.7; // 0.7-1.0
    }

    assessTimeliness(results) {
        const avgResponseTime = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;
        
        return Math.max(0.1, 1 - (avgResponseTime / 5000)); // Pénalise si > 5s
    }

    assessRelevance(results) {
        // Mock: Évaluation de la pertinence
        return Math.random() * 0.2 + 0.8; // 0.8-1.0
    }

    calculateCollectionMetrics(distributionResults) {
        const results = distributionResults.distributionResults || [];
        
        return {
            sources_processed: results.length,
            successful_collections: results.filter(r => r.success).length,
            collection_efficiency: results.filter(r => r.success).length / results.length,
            average_processing_time: this.getProcessingTime(),
            data_volume: results.reduce((sum, r) => sum + (r.data?.content?.length || 0), 0)
        };
    }

    getProcessingTime() {
        return Math.random() * 800 + 300; // 300-1100ms
    }
}

module.exports = CollectionAgent;