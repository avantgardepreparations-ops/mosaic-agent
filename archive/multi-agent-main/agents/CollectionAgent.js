/**
 * CollectionAgent - Agent de Collecte et d'Agrégation
 * 
 * ATTENTION: NE JAMAIS MELANGER AVEC MOSAICMIND
 * Cet agent est strictement séparé de MOSAICMIND
 */

class CollectionAgent {
    constructor(config = {}) {
        this.name = 'CollectionAgent';
        this.config = {
            maxDataSources: config.maxDataSources || 5,
            aggregationStrategy: config.aggregationStrategy || 'weighted',
            enableDataCleaning: config.enableDataCleaning !== false,
            enableDataValidation: config.enableDataValidation !== false,
            timeout: config.timeout || 30000,
            ...config
        };
        
        this.collectedData = [];
        this.dataMetrics = {
            totalSources: 0,
            successfulCollections: 0,
            failedCollections: 0,
            cleanedRecords: 0
        };

        // Validation de séparation MOSAICMIND
        this.validateSeparation();
    }

    /**
     * Valide que cet agent est strictement séparé de MOSAICMIND
     */
    validateSeparation() {
        const blockedTerms = ['MOSAICMIND', 'mosaicmind', 'MosaicMind'];
        const agentSource = this.constructor.toString();
        
        for (const term of blockedTerms) {
            if (agentSource.includes(term) && !agentSource.includes('NE JAMAIS MELANGER')) {
                throw new Error(`❌ ERREUR DE SÉPARATION: Agent contaminé par ${term}`);
            }
        }
    }

    /**
     * Point d'entrée principal - collecte et agrège les données
     */
    async collectAndAggregate(refinedPrompt, distributionData, context = {}) {
        try {
            console.log('📊 CollectionAgent: Début de la collecte et agrégation');
            
            // Validation d'entrée
            this.validateInput(refinedPrompt, distributionData);
            
            // Réinitialisation des métriques
            this.resetMetrics();
            
            // Collecte des données
            const rawData = await this.collectFromDistribution(distributionData);
            
            // Nettoyage des données
            const cleanedData = this.config.enableDataCleaning 
                ? this.cleanData(rawData)
                : rawData;
            
            // Validation des données
            const validatedData = this.config.enableDataValidation
                ? this.validateData(cleanedData)
                : cleanedData;
            
            // Agrégation des données
            const aggregatedData = this.aggregateData(validatedData, refinedPrompt);
            
            // Formation de la structure unifiée
            const unifiedStructure = this.createUnifiedStructure(aggregatedData, refinedPrompt);

            const result = {
                collectedData: unifiedStructure,
                metrics: this.dataMetrics,
                summary: this.generateSummary(unifiedStructure),
                recommendations: this.generateRecommendations(unifiedStructure),
                metadata: {
                    agent: this.name,
                    timestamp: new Date().toISOString(),
                    separationValidated: true,
                    processingTime: Date.now()
                }
            };

            console.log('✅ CollectionAgent: Collecte et agrégation terminées avec succès');
            return result;

        } catch (error) {
            console.error('❌ CollectionAgent: Erreur lors de la collecte:', error);
            throw new Error(`Échec de la collecte de données: ${error.message}`);
        }
    }

    /**
     * Valide les entrées
     */
    validateInput(refinedPrompt, distributionData) {
        if (!refinedPrompt || typeof refinedPrompt !== 'object') {
            throw new Error('Le prompt affiné doit être un objet valide');
        }

        if (!distributionData || !Array.isArray(distributionData)) {
            throw new Error('Les données de distribution doivent être un tableau');
        }

        if (distributionData.length > this.config.maxDataSources) {
            throw new Error(`Trop de sources de données: ${distributionData.length} > ${this.config.maxDataSources}`);
        }

        // Vérification de séparation MOSAICMIND
        const dataString = JSON.stringify(distributionData).toLowerCase();
        if (dataString.includes('mosaicmind')) {
            throw new Error('❌ ERREUR: Données contaminées par MOSAICMIND');
        }
    }

    /**
     * Réinitialise les métriques de collecte
     */
    resetMetrics() {
        this.dataMetrics = {
            totalSources: 0,
            successfulCollections: 0,
            failedCollections: 0,
            cleanedRecords: 0,
            startTime: Date.now()
        };
        this.collectedData = [];
    }

    /**
     * Collecte les données depuis le DistributionAgent
     */
    async collectFromDistribution(distributionData) {
        console.log('📡 Collecte des données depuis les sources de distribution...');
        
        const collectedData = [];
        this.dataMetrics.totalSources = distributionData.length;

        for (const source of distributionData) {
            try {
                const data = await this.collectFromSource(source);
                collectedData.push(data);
                this.dataMetrics.successfulCollections++;
                
                console.log(`✅ Collecte réussie depuis: ${source.sourceId || 'source inconnue'}`);
                
            } catch (error) {
                console.warn(`⚠️ Échec de collecte depuis: ${source.sourceId || 'source inconnue'}`, error.message);
                this.dataMetrics.failedCollections++;
                
                // Ajouter une entrée d'erreur pour maintenir la traçabilité
                collectedData.push({
                    sourceId: source.sourceId,
                    error: error.message,
                    status: 'failed',
                    timestamp: new Date().toISOString()
                });
            }
        }

        return collectedData;
    }

    /**
     * Collecte les données d'une source spécifique
     */
    async collectFromSource(source) {
        // Simuler le temps de collecte (dans un vrai système, ceci ferait des appels réseau)
        await this.simulateDelay(100, 500);

        if (!source || !source.data) {
            throw new Error('Source de données invalide ou données manquantes');
        }

        return {
            sourceId: source.sourceId || `source_${Date.now()}`,
            sourceType: source.sourceType || 'unknown',
            data: source.data,
            confidence: source.confidence || 0.5,
            timestamp: new Date().toISOString(),
            metadata: source.metadata || {},
            status: 'collected'
        };
    }

    /**
     * Nettoie les données collectées
     */
    cleanData(rawData) {
        console.log('🧹 Nettoyage des données...');
        
        const cleanedData = rawData.map(item => {
            if (item.status === 'failed') {
                return item; // Garder les erreurs telles quelles
            }

            const cleaned = {
                ...item,
                data: this.cleanDataContent(item.data),
                cleaningApplied: true
            };

            this.dataMetrics.cleanedRecords++;
            return cleaned;
        });

        console.log(`✅ ${this.dataMetrics.cleanedRecords} enregistrements nettoyés`);
        return cleanedData;
    }

    /**
     * Nettoie le contenu des données
     */
    cleanDataContent(data) {
        if (typeof data === 'string') {
            return data
                .trim()
                .replace(/\s+/g, ' ') // Normaliser les espaces
                .replace(/[^\w\s.,!?;:()\-\[\]{}'"]/g, '') // Supprimer caractères spéciaux
                .replace(/\n\s*\n/g, '\n'); // Supprimer lignes vides multiples
        }

        if (Array.isArray(data)) {
            return data.map(item => this.cleanDataContent(item));
        }

        if (typeof data === 'object' && data !== null) {
            const cleaned = {};
            for (const [key, value] of Object.entries(data)) {
                cleaned[key] = this.cleanDataContent(value);
            }
            return cleaned;
        }

        return data;
    }

    /**
     * Valide les données nettoyées
     */
    validateData(cleanedData) {
        console.log('✅ Validation des données...');
        
        const validatedData = cleanedData.map(item => {
            if (item.status === 'failed') {
                return item;
            }

            const validationResults = this.performDataValidation(item);
            
            return {
                ...item,
                validation: validationResults,
                isValid: validationResults.isValid
            };
        });

        const validCount = validatedData.filter(item => item.isValid).length;
        console.log(`✅ ${validCount}/${validatedData.length} sources validées`);
        
        return validatedData;
    }

    /**
     * Effectue la validation d'un élément de données
     */
    performDataValidation(item) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            score: 1.0
        };

        // Validation de la structure
        if (!item.data) {
            validation.errors.push('Données manquantes');
            validation.isValid = false;
            validation.score -= 0.5;
        }

        // Validation de la confiance
        if (item.confidence < 0.3) {
            validation.warnings.push('Niveau de confiance faible');
            validation.score -= 0.2;
        }

        // Validation du contenu
        if (typeof item.data === 'string' && item.data.length < 10) {
            validation.warnings.push('Contenu très court');
            validation.score -= 0.1;
        }

        // Validation temporelle
        const age = Date.now() - new Date(item.timestamp).getTime();
        if (age > 3600000) { // Plus d'1 heure
            validation.warnings.push('Données potentiellement obsolètes');
            validation.score -= 0.1;
        }

        return validation;
    }

    /**
     * Agrège les données validées
     */
    aggregateData(validatedData, refinedPrompt) {
        console.log('🔄 Agrégation des données...');

        const validSources = validatedData.filter(item => item.isValid !== false);
        
        if (validSources.length === 0) {
            throw new Error('Aucune source de données valide pour l\'agrégation');
        }

        const aggregation = {
            strategy: this.config.aggregationStrategy,
            sources: validSources,
            aggregatedContent: this.performAggregation(validSources, refinedPrompt),
            confidence: this.calculateOverallConfidence(validSources),
            coverage: this.assessCoverage(validSources, refinedPrompt)
        };

        console.log(`✅ Agrégation terminée: ${validSources.length} sources, confiance: ${aggregation.confidence.toFixed(2)}`);
        return aggregation;
    }

    /**
     * Effectue l'agrégation selon la stratégie configurée
     */
    performAggregation(validSources, refinedPrompt) {
        switch (this.config.aggregationStrategy) {
            case 'weighted':
                return this.weightedAggregation(validSources, refinedPrompt);
            case 'consensus':
                return this.consensusAggregation(validSources);
            case 'chronological':
                return this.chronologicalAggregation(validSources);
            default:
                return this.simpleAggregation(validSources);
        }
    }

    /**
     * Agrégation pondérée par confiance
     */
    weightedAggregation(sources, refinedPrompt) {
        const weightedContent = [];
        let totalWeight = 0;

        for (const source of sources) {
            const weight = source.confidence * (source.validation?.score || 1);
            weightedContent.push({
                content: source.data,
                weight: weight,
                sourceId: source.sourceId
            });
            totalWeight += weight;
        }

        // Normaliser les poids
        weightedContent.forEach(item => {
            item.normalizedWeight = item.weight / totalWeight;
        });

        return {
            type: 'weighted',
            content: weightedContent.sort((a, b) => b.normalizedWeight - a.normalizedWeight),
            totalWeight: totalWeight
        };
    }

    /**
     * Agrégation par consensus
     */
    consensusAggregation(sources) {
        const contentGroups = {};
        
        for (const source of sources) {
            const contentKey = this.generateContentKey(source.data);
            if (!contentGroups[contentKey]) {
                contentGroups[contentKey] = {
                    content: source.data,
                    sources: [],
                    confidence: 0
                };
            }
            contentGroups[contentKey].sources.push(source.sourceId);
            contentGroups[contentKey].confidence += source.confidence;
        }

        const consensus = Object.values(contentGroups)
            .sort((a, b) => b.confidence - a.confidence);

        return {
            type: 'consensus',
            content: consensus,
            agreementLevel: consensus[0] ? consensus[0].sources.length / sources.length : 0
        };
    }

    /**
     * Agrégation chronologique
     */
    chronologicalAggregation(sources) {
        const sortedSources = sources.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return {
            type: 'chronological',
            content: sortedSources.map(source => ({
                content: source.data,
                timestamp: source.timestamp,
                sourceId: source.sourceId,
                confidence: source.confidence
            }))
        };
    }

    /**
     * Agrégation simple (concaténation)
     */
    simpleAggregation(sources) {
        return {
            type: 'simple',
            content: sources.map(source => ({
                content: source.data,
                sourceId: source.sourceId,
                confidence: source.confidence
            }))
        };
    }

    /**
     * Calcule la confiance globale
     */
    calculateOverallConfidence(sources) {
        if (sources.length === 0) return 0;
        
        const totalConfidence = sources.reduce((sum, source) => sum + source.confidence, 0);
        const averageConfidence = totalConfidence / sources.length;
        
        // Bonus pour la convergence de sources multiples
        const convergenceBonus = Math.min(0.2, sources.length * 0.05);
        
        return Math.min(1.0, averageConfidence + convergenceBonus);
    }

    /**
     * Évalue la couverture du sujet
     */
    assessCoverage(sources, refinedPrompt) {
        const promptKeywords = this.extractKeywords(refinedPrompt.refined || '');
        const coveredKeywords = new Set();
        
        for (const source of sources) {
            const sourceKeywords = this.extractKeywords(JSON.stringify(source.data));
            sourceKeywords.forEach(keyword => coveredKeywords.add(keyword));
        }

        const coverage = promptKeywords.length > 0 
            ? coveredKeywords.size / promptKeywords.length 
            : 1.0;

        return {
            totalKeywords: promptKeywords.length,
            coveredKeywords: coveredKeywords.size,
            coverage: coverage,
            missingKeywords: promptKeywords.filter(k => !coveredKeywords.has(k))
        };
    }

    /**
     * Crée une structure unifiée
     */
    createUnifiedStructure(aggregatedData, refinedPrompt) {
        console.log('🏗️ Création de la structure unifiée...');

        const unifiedStructure = {
            prompt: refinedPrompt,
            aggregation: aggregatedData,
            structure: {
                mainContent: this.extractMainContent(aggregatedData),
                supportingData: this.extractSupportingData(aggregatedData),
                evidence: this.extractEvidence(aggregatedData),
                alternatives: this.extractAlternatives(aggregatedData)
            },
            quality: {
                completeness: this.assessCompleteness(aggregatedData),
                consistency: this.assessConsistency(aggregatedData),
                reliability: this.assessReliability(aggregatedData)
            },
            metadata: {
                sourceCount: aggregatedData.sources ? aggregatedData.sources.length : 0,
                confidence: aggregatedData.confidence,
                coverage: aggregatedData.coverage,
                timestamp: new Date().toISOString()
            }
        };

        console.log('✅ Structure unifiée créée avec succès');
        return unifiedStructure;
    }

    /**
     * Extrait le contenu principal
     */
    extractMainContent(aggregatedData) {
        if (aggregatedData.aggregatedContent.type === 'weighted') {
            return aggregatedData.aggregatedContent.content.slice(0, 3); // Top 3 sources pondérées
        }
        
        if (aggregatedData.aggregatedContent.type === 'consensus') {
            return aggregatedData.aggregatedContent.content[0]; // Consensus principal
        }
        
        return aggregatedData.aggregatedContent.content.slice(0, 3);
    }

    /**
     * Extrait les données de support
     */
    extractSupportingData(aggregatedData) {
        const supportingData = [];
        
        if (aggregatedData.aggregatedContent.content) {
            for (const item of aggregatedData.aggregatedContent.content.slice(3)) {
                supportingData.push({
                    content: item.content,
                    role: 'supporting',
                    confidence: item.confidence || item.normalizedWeight
                });
            }
        }
        
        return supportingData;
    }

    /**
     * Extrait les preuves
     */
    extractEvidence(aggregatedData) {
        return aggregatedData.sources
            .filter(source => source.confidence > 0.7)
            .map(source => ({
                content: source.data,
                sourceId: source.sourceId,
                confidence: source.confidence,
                type: 'evidence'
            }));
    }

    /**
     * Extrait les alternatives
     */
    extractAlternatives(aggregatedData) {
        if (aggregatedData.aggregatedContent.type === 'consensus') {
            return aggregatedData.aggregatedContent.content.slice(1); // Autres options de consensus
        }
        
        return [];
    }

    /**
     * Évalue la complétude
     */
    assessCompleteness(aggregatedData) {
        const expectedFields = ['mainContent', 'evidence'];
        const coverage = aggregatedData.coverage ? aggregatedData.coverage.coverage : 0;
        const sourceCount = aggregatedData.sources ? aggregatedData.sources.length : 0;
        
        return Math.min(1.0, coverage * 0.5 + (sourceCount / this.config.maxDataSources) * 0.5);
    }

    /**
     * Évalue la cohérence
     */
    assessConsistency(aggregatedData) {
        if (aggregatedData.aggregatedContent.type === 'consensus') {
            return aggregatedData.aggregatedContent.agreementLevel || 0.5;
        }
        
        return 0.7; // Valeur par défaut pour les autres types
    }

    /**
     * Évalue la fiabilité
     */
    assessReliability(aggregatedData) {
        return aggregatedData.confidence || 0.5;
    }

    /**
     * Génère un résumé
     */
    generateSummary(unifiedStructure) {
        return {
            totalSources: this.dataMetrics.totalSources,
            successfulCollections: this.dataMetrics.successfulCollections,
            failedCollections: this.dataMetrics.failedCollections,
            overallConfidence: unifiedStructure.metadata.confidence,
            qualityScore: (
                unifiedStructure.quality.completeness + 
                unifiedStructure.quality.consistency + 
                unifiedStructure.quality.reliability
            ) / 3,
            mainFindings: unifiedStructure.structure.mainContent.length,
            evidenceCount: unifiedStructure.structure.evidence.length
        };
    }

    /**
     * Génère des recommandations
     */
    generateRecommendations(unifiedStructure) {
        const recommendations = [];

        if (unifiedStructure.quality.completeness < 0.7) {
            recommendations.push({
                type: 'completeness',
                message: 'Collecte de données supplémentaires recommandée',
                priority: 'medium'
            });
        }

        if (unifiedStructure.quality.consistency < 0.6) {
            recommendations.push({
                type: 'consistency',
                message: 'Vérification de la cohérence des sources nécessaire',
                priority: 'high'
            });
        }

        if (unifiedStructure.metadata.confidence < 0.5) {
            recommendations.push({
                type: 'confidence',
                message: 'Sources plus fiables recommandées',
                priority: 'high'
            });
        }

        return recommendations;
    }

    // Méthodes utilitaires

    /**
     * Simule un délai pour la démonstration
     */
    async simulateDelay(min, max) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Génère une clé de contenu pour le groupement
     */
    generateContentKey(content) {
        const str = JSON.stringify(content).toLowerCase();
        return str.substring(0, 50); // Simplification pour la démo
    }

    /**
     * Extrait les mots-clés d'un texte
     */
    extractKeywords(text) {
        if (typeof text !== 'string') return [];
        
        return text
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 3)
            .slice(0, 10); // Limiter à 10 mots-clés
    }

    /**
     * Obtient le statut de l'agent
     */
    getStatus() {
        return {
            name: this.name,
            status: 'ready',
            config: this.config,
            metrics: this.dataMetrics,
            separationValidated: true,
            capabilities: [
                'data_collection',
                'data_cleaning',
                'data_validation',
                'data_aggregation',
                'unified_structuring'
            ]
        };
    }
}

module.exports = CollectionAgent;