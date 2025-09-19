/**
 * Orchestrator pour le système multi-agent
 * Gère les deux phases du workflow et coordonne les agents
 */

const PromptRefinementAgent = require('../PromptRefinementAgent');
const DistributionAgent = require('../DistributionAgent');
const CollectionAgent = require('../CollectionAgent');
const InnovationAgent = require('../InnovationAgent');
const VerificationAgent = require('../VerificationAgent');
const SynthesisAgent = require('../SynthesisAgent');

class Orchestrator {
    constructor() {
        this.agents = {
            promptRefinement: new PromptRefinementAgent(),
            distribution: new DistributionAgent(),
            collection: new CollectionAgent(),
            innovation: new InnovationAgent(),
            verification: new VerificationAgent(),
            synthesis: new SynthesisAgent()
        };
        
        this.workflowState = {
            currentPhase: null,
            currentAgent: null,
            startTime: null,
            results: {},
            errors: []
        };
        
        this.listeners = new Map(); // Pour les événements de progression
    }

    /**
     * Point d'entrée principal du workflow
     * @param {string} prompt - Prompt utilisateur
     * @param {Object} options - Options de traitement
     * @returns {Promise<Object>} - Résultat final du workflow
     */
    async processRequest(prompt, options = {}) {
        try {
            this.workflowState.startTime = new Date();
            this.log('🚀 Démarrage du workflow multi-agent');
            
            // Validation des paramètres d'entrée
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Prompt requis et doit être une chaîne de caractères');
            }

            const workflowOptions = {
                taskType: options.taskType || 'general',
                innovationLevel: options.innovationLevel || 'moderate',
                maxSources: options.maxSources || 3,
                timeout: options.timeout || 30000,
                ...options
            };

            // Phase 1: Analyse et Collecte
            this.workflowState.currentPhase = 'phase1';
            this.emitProgress('phase1_start', { phase: 'Phase 1: Analyse et Collecte' });
            
            const phase1Results = await this.executePhase1(prompt, workflowOptions);

            // Phase 2: Innovation et Synthèse
            this.workflowState.currentPhase = 'phase2';
            this.emitProgress('phase2_start', { phase: 'Phase 2: Innovation et Synthèse' });
            
            const phase2Results = await this.executePhase2(phase1Results, workflowOptions);

            // Compilation du résultat final
            const finalResult = this.compileFinalResult(prompt, phase1Results, phase2Results, workflowOptions);

            this.log('✅ Workflow terminé avec succès');
            this.emitProgress('workflow_complete', { 
                result: finalResult, 
                duration: Date.now() - this.workflowState.startTime 
            });

            return finalResult;

        } catch (error) {
            this.logError(`Erreur dans le workflow: ${error.message}`);
            this.workflowState.errors.push(error);
            this.emitProgress('workflow_error', { error: error.message });
            
            // Retourner un résultat d'erreur plutôt que de lancer
            return this.createErrorResult(prompt, error, options);
        }
    }

    /**
     * Phase 1: Affinement, Distribution et Collecte
     * @param {string} prompt - Prompt utilisateur
     * @param {Object} options - Options
     * @returns {Promise<Object>} - Résultats de la phase 1
     */
    async executePhase1(prompt, options) {
        const phase1Results = {};

        try {
            // Étape 1.1: Affinement du prompt
            this.workflowState.currentAgent = 'promptRefinement';
            this.emitProgress('agent_start', { agent: 'PromptRefinementAgent', description: 'Affinement du prompt...' });
            
            phase1Results.promptRefinement = await this.agents.promptRefinement.execute({
                prompt: prompt,
                context: { domain: options.taskType },
                options: { level: options.innovationLevel }
            });
            
            this.emitProgress('agent_complete', { 
                agent: 'PromptRefinementAgent', 
                status: 'success',
                confidence: phase1Results.promptRefinement.confidence 
            });

            // Étape 1.2: Distribution vers les sources
            this.workflowState.currentAgent = 'distribution';
            this.emitProgress('agent_start', { agent: 'DistributionAgent', description: 'Distribution vers les sources...' });
            
            phase1Results.distributionResults = await this.agents.distribution.execute({
                refinedPrompt: phase1Results.promptRefinement.refinedPrompt,
                taskType: options.taskType,
                maxSources: options.maxSources,
                timeout: options.timeout / 3
            });
            
            this.emitProgress('agent_complete', { 
                agent: 'DistributionAgent', 
                status: 'success',
                sourcesUsed: phase1Results.distributionResults.sourcesUsed.length 
            });

            // Étape 1.3: Collecte et agrégation
            this.workflowState.currentAgent = 'collection';
            this.emitProgress('agent_start', { agent: 'CollectionAgent', description: 'Collecte et agrégation...' });
            
            phase1Results.collectionSynthesis = await this.agents.collection.execute({
                distributionResults: phase1Results.distributionResults,
                originalPrompt: prompt,
                taskType: options.taskType
            });
            
            this.emitProgress('agent_complete', { 
                agent: 'CollectionAgent', 
                status: 'success',
                keyFindings: phase1Results.collectionSynthesis.keyFindings.length 
            });

            this.emitProgress('phase1_complete', { 
                results: phase1Results,
                summary: this.createPhase1Summary(phase1Results) 
            });

            return phase1Results;

        } catch (error) {
            this.logError(`Erreur en Phase 1: ${error.message}`);
            throw new Error(`Phase 1 échouée: ${error.message}`);
        }
    }

    /**
     * Phase 2: Innovation, Vérification et Synthèse
     * @param {Object} phase1Results - Résultats de la phase 1
     * @param {Object} options - Options
     * @returns {Promise<Object>} - Résultats de la phase 2
     */
    async executePhase2(phase1Results, options) {
        const phase2Results = {};

        try {
            // Étape 2.1: Innovation et amélioration
            this.workflowState.currentAgent = 'innovation';
            this.emitProgress('agent_start', { agent: 'InnovationAgent', description: 'Analyse d\'innovation...' });
            
            phase2Results.innovations = await this.agents.innovation.execute({
                collectionSynthesis: phase1Results.collectionSynthesis,
                originalPrompt: phase1Results.promptRefinement.originalPrompt,
                taskType: options.taskType,
                innovationLevel: options.innovationLevel
            });
            
            this.emitProgress('agent_complete', { 
                agent: 'InnovationAgent', 
                status: 'success',
                improvements: phase2Results.innovations.improvements.length 
            });

            // Étape 2.2: Vérification et validation
            this.workflowState.currentAgent = 'verification';
            this.emitProgress('agent_start', { agent: 'VerificationAgent', description: 'Vérification et validation...' });
            
            phase2Results.verification = await this.agents.verification.execute({
                innovations: phase2Results.innovations,
                collectionSynthesis: phase1Results.collectionSynthesis,
                originalPrompt: phase1Results.promptRefinement.originalPrompt,
                taskType: options.taskType
            });
            
            this.emitProgress('agent_complete', { 
                agent: 'VerificationAgent', 
                status: 'success',
                verificationScore: phase2Results.verification.verification_summary.score 
            });

            // Étape 2.3: Synthèse finale
            this.workflowState.currentAgent = 'synthesis';
            this.emitProgress('agent_start', { agent: 'SynthesisAgent', description: 'Synthèse finale...' });
            
            phase2Results.synthesis = await this.agents.synthesis.execute({
                originalPrompt: phase1Results.promptRefinement.originalPrompt,
                promptRefinement: phase1Results.promptRefinement,
                distributionResults: phase1Results.distributionResults,
                collectionSynthesis: phase1Results.collectionSynthesis,
                innovations: phase2Results.innovations,
                verification: phase2Results.verification,
                taskType: options.taskType
            });
            
            this.emitProgress('agent_complete', { 
                agent: 'SynthesisAgent', 
                status: 'success',
                confidence: phase2Results.synthesis.quality_metrics.overall_confidence 
            });

            this.emitProgress('phase2_complete', { 
                results: phase2Results,
                summary: this.createPhase2Summary(phase2Results) 
            });

            return phase2Results;

        } catch (error) {
            this.logError(`Erreur en Phase 2: ${error.message}`);
            throw new Error(`Phase 2 échouée: ${error.message}`);
        }
    }

    /**
     * Compile le résultat final du workflow
     * @param {string} originalPrompt - Prompt original
     * @param {Object} phase1Results - Résultats phase 1
     * @param {Object} phase2Results - Résultats phase 2
     * @param {Object} options - Options
     * @returns {Object} - Résultat final compilé
     */
    compileFinalResult(originalPrompt, phase1Results, phase2Results, options) {
        const endTime = new Date();
        const totalDuration = endTime - this.workflowState.startTime;

        return {
            // Métadonnées du workflow
            workflow_metadata: {
                request_id: this.generateRequestId(),
                timestamp: endTime.toISOString(),
                original_prompt: originalPrompt,
                options_used: options,
                total_duration_ms: totalDuration,
                phases_completed: ['phase1', 'phase2'],
                agents_executed: Object.keys(this.agents)
            },

            // Réponse principale (issue de la synthèse)
            response: phase2Results.synthesis.final_response,

            // Résumé exécutif
            executive_summary: phase2Results.synthesis.final_response.executive_summary,

            // Métriques de qualité
            quality_metrics: {
                ...phase2Results.synthesis.quality_metrics,
                workflow_efficiency: this.calculateWorkflowEfficiency(totalDuration),
                data_completeness: this.calculateDataCompleteness(phase1Results, phase2Results)
            },

            // Détails du workflow (pour debugging/analyse)
            workflow_details: {
                phase1_results: this.sanitizePhaseResults(phase1Results),
                phase2_results: this.sanitizePhaseResults(phase2Results),
                workflow_analysis: phase2Results.synthesis.workflow_analysis,
                processing_summary: phase2Results.synthesis.processing_summary
            },

            // Recommandations et prochaines étapes
            recommendations: phase2Results.synthesis.final_response.recommendations,
            implementation_roadmap: phase2Results.synthesis.final_response.implementation_roadmap,

            // Statut final
            status: {
                success: true,
                final_score: phase2Results.verification.verification_summary.score,
                confidence_level: phase2Results.synthesis.quality_metrics.overall_confidence,
                approval_status: phase2Results.verification.final_validation.final_status
            }
        };
    }

    /**
     * Crée un résultat d'erreur en cas d'échec du workflow
     * @param {string} prompt - Prompt original
     * @param {Error} error - Erreur survenue
     * @param {Object} options - Options
     * @returns {Object} - Résultat d'erreur
     */
    createErrorResult(prompt, error, options) {
        return {
            workflow_metadata: {
                request_id: this.generateRequestId(),
                timestamp: new Date().toISOString(),
                original_prompt: prompt,
                options_used: options,
                total_duration_ms: Date.now() - (this.workflowState.startTime || Date.now()),
                error: true
            },

            response: {
                executive_summary: {
                    original_request: { prompt: prompt },
                    solution_overview: { approach: 'Error handling - partial processing' },
                    confidence_level: 0.1
                },
                main_content: {
                    direct_answer: `Désolé, une erreur s'est produite lors du traitement de votre demande: ${error.message}`,
                    recommended_solutions: {
                        primary_solution: 'Veuillez reformuler votre demande ou contacter le support'
                    }
                }
            },

            quality_metrics: {
                overall_confidence: 0.1,
                technical_quality: 0.0,
                response_completeness: 0.2
            },

            status: {
                success: false,
                error_message: error.message,
                phase_reached: this.workflowState.currentPhase,
                agent_failed: this.workflowState.currentAgent
            },

            workflow_details: {
                errors: this.workflowState.errors.map(err => ({
                    message: err.message,
                    stack: err.stack
                })),
                partial_results: this.workflowState.results
            }
        };
    }

    // Méthodes utilitaires

    /**
     * Système d'événements pour suivre la progression
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Émet un événement de progression
     * @param {string} event - Nom de l'événement
     * @param {Object} data - Données associées
     */
    emitProgress(event, data) {
        const timestamp = new Date().toISOString();
        const progressData = { ...data, timestamp, workflow_id: this.generateRequestId() };
        
        // Log de progression
        this.log(`📊 ${event}: ${JSON.stringify(progressData, null, 2)}`);
        
        // Émettre aux listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(progressData);
                } catch (error) {
                    this.logError(`Erreur dans le listener ${event}: ${error.message}`);
                }
            });
        }
        
        // Listener global
        if (this.listeners.has('all')) {
            this.listeners.get('all').forEach(callback => {
                try {
                    callback(event, progressData);
                } catch (error) {
                    this.logError(`Erreur dans le listener global: ${error.message}`);
                }
            });
        }
    }

    createPhase1Summary(phase1Results) {
        return {
            prompt_refined: !!phase1Results.promptRefinement?.refinedPrompt,
            sources_consulted: phase1Results.distributionResults?.sourcesUsed?.length || 0,
            key_findings: phase1Results.collectionSynthesis?.keyFindings?.length || 0,
            data_quality: phase1Results.collectionSynthesis?.qualityAssessment?.overall_quality || 0,
            phase_status: 'completed'
        };
    }

    createPhase2Summary(phase2Results) {
        return {
            improvements_identified: phase2Results.innovations?.improvements?.length || 0,
            verification_score: phase2Results.verification?.verification_summary?.score || 0,
            final_confidence: phase2Results.synthesis?.quality_metrics?.overall_confidence || 0,
            synthesis_quality: phase2Results.synthesis?.workflow_analysis?.overall_quality || 0,
            phase_status: 'completed'
        };
    }

    calculateWorkflowEfficiency(totalDuration) {
        // Efficacité basée sur la durée (mock)
        const targetDuration = 15000; // 15 secondes cible
        const efficiency = Math.max(0.1, Math.min(1, targetDuration / totalDuration));
        
        return {
            efficiency_score: efficiency,
            duration_ms: totalDuration,
            target_duration_ms: targetDuration,
            performance_level: efficiency > 0.8 ? 'excellent' : efficiency > 0.6 ? 'good' : 'needs_improvement'
        };
    }

    calculateDataCompleteness(phase1Results, phase2Results) {
        const requiredData = [
            'promptRefinement',
            'distributionResults', 
            'collectionSynthesis',
            'innovations',
            'verification',
            'synthesis'
        ];
        
        const availableData = [
            phase1Results.promptRefinement,
            phase1Results.distributionResults,
            phase1Results.collectionSynthesis,
            phase2Results.innovations,
            phase2Results.verification,
            phase2Results.synthesis
        ];
        
        const completenessScore = availableData.filter(Boolean).length / requiredData.length;
        
        return {
            completeness_score: completenessScore,
            available_components: availableData.filter(Boolean).length,
            total_components: requiredData.length,
            completeness_level: completenessScore === 1 ? 'complete' : completenessScore > 0.8 ? 'mostly_complete' : 'partial'
        };
    }

    sanitizePhaseResults(results) {
        // Fonction pour nettoyer/réduire les résultats pour l'inclusion dans la réponse finale
        const sanitized = {};
        
        Object.entries(results).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
                sanitized[key] = {
                    agent: value.agent,
                    processingTime: value.processingTime,
                    // Inclure seulement les métriques importantes
                    summary: this.extractSummaryMetrics(value)
                };
            }
        });
        
        return sanitized;
    }

    extractSummaryMetrics(agentResult) {
        const commonMetrics = {
            processing_time: agentResult.processingTime,
            agent_name: agentResult.agent
        };
        
        // Métriques spécifiques par agent
        if (agentResult.confidence) commonMetrics.confidence = agentResult.confidence;
        if (agentResult.sourcesUsed) commonMetrics.sources_used = agentResult.sourcesUsed.length;
        if (agentResult.keyFindings) commonMetrics.key_findings_count = agentResult.keyFindings.length;
        if (agentResult.improvements) commonMetrics.improvements_count = agentResult.improvements.length;
        if (agentResult.verification_summary) commonMetrics.verification_score = agentResult.verification_summary.score;
        if (agentResult.quality_metrics) commonMetrics.overall_confidence = agentResult.quality_metrics.overall_confidence;
        
        return commonMetrics;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Méthode pour obtenir le statut actuel du workflow
     * @returns {Object} - Statut actuel
     */
    getWorkflowStatus() {
        return {
            current_phase: this.workflowState.currentPhase,
            current_agent: this.workflowState.currentAgent,
            start_time: this.workflowState.startTime,
            elapsed_time: this.workflowState.startTime ? Date.now() - this.workflowState.startTime : 0,
            errors_count: this.workflowState.errors.length,
            agents_status: Object.keys(this.agents).reduce((status, agentName) => {
                status[agentName] = this.agents[agentName].getInfo();
                return status;
            }, {})
        };
    }

    /**
     * Méthode pour arrêter le workflow en cours
     */
    stopWorkflow() {
        this.log('🛑 Arrêt du workflow demandé');
        this.emitProgress('workflow_stopped', { 
            phase: this.workflowState.currentPhase,
            agent: this.workflowState.currentAgent 
        });
        
        // Reset de l'état
        this.workflowState = {
            currentPhase: null,
            currentAgent: null,
            startTime: null,
            results: {},
            errors: []
        };
    }

    /**
     * Méthode pour obtenir des métriques de performance
     * @returns {Object} - Métriques de performance
     */
    getPerformanceMetrics() {
        return {
            agents_count: Object.keys(this.agents).length,
            listeners_count: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            current_workflow_duration: this.workflowState.startTime ? Date.now() - this.workflowState.startTime : 0,
            error_rate: this.workflowState.errors.length,
            memory_usage: process.memoryUsage ? process.memoryUsage() : 'non disponible'
        };
    }

    // Méthodes de logging
    log(message) {
        console.log(`[Orchestrator] ${message}`);
    }

    logError(message) {
        console.error(`[Orchestrator] ERREUR: ${message}`);
    }
}

module.exports = Orchestrator;