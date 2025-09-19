#!/usr/bin/env node

/**
 * Script de test pour le système multi-agent
 * Teste le fonctionnement de chaque agent et de l'orchestrateur
 */

const path = require('path');

// Import des agents
const AgentBase = require('./agents/base/AgentBase');
const PromptRefinementAgent = require('./agents/PromptRefinementAgent');
const DistributionAgent = require('./agents/DistributionAgent');
const CollectionAgent = require('./agents/CollectionAgent');
const InnovationAgent = require('./agents/InnovationAgent');
const VerificationAgent = require('./agents/VerificationAgent');
const SynthesisAgent = require('./agents/SynthesisAgent');
const Orchestrator = require('./agents/orchestrator');

class AgentTester {
    constructor() {
        this.testResults = [];
        this.errors = [];
    }

    /**
     * Exécute tous les tests
     */
    async runAllTests() {
        console.log('🧪 DÉMARRAGE DES TESTS DU SYSTÈME MULTI-AGENT');
        console.log('=' .repeat(50));

        try {
            // Tests individuels des agents
            await this.testAgentBase();
            await this.testPromptRefinementAgent();
            await this.testDistributionAgent();
            await this.testCollectionAgent();
            await this.testInnovationAgent();
            await this.testVerificationAgent();
            await this.testSynthesisAgent();

            // Test du workflow complet
            await this.testCompleteWorkflow();

            // Affichage des résultats
            this.displayResults();

        } catch (error) {
            console.error('❌ Erreur lors des tests:', error.message);
            this.errors.push(error);
        }
    }

    /**
     * Test de la classe de base AgentBase
     */
    async testAgentBase() {
        console.log('\n📋 Test AgentBase...');
        
        try {
            const agent = new AgentBase('TestAgent', 'Agent de test', ['test']);
            
            // Test des propriétés de base
            this.assert(agent.name === 'TestAgent', 'Nom de l\'agent correct');
            this.assert(agent.role === 'Agent de test', 'Rôle de l\'agent correct');
            this.assert(agent.status === 'inactive', 'Statut initial correct');
            
            // Test de changement de statut
            agent.setStatus('active');
            this.assert(agent.status === 'active', 'Changement de statut fonctionne');
            
            // Test de validation d'entrée
            this.assert(agent.validateInput({test: 'data'}), 'Validation d\'entrée valide');
            this.assert(!agent.validateInput(null), 'Validation d\'entrée invalide');
            
            // Test des informations de l'agent
            const info = agent.getInfo();
            this.assert(typeof info === 'object', 'getInfo retourne un objet');
            this.assert(info.name === 'TestAgent', 'Info contient le nom correct');
            
            this.addTestResult('AgentBase', true, 'Tests de base réussis');
            
        } catch (error) {
            this.addTestResult('AgentBase', false, error.message);
        }
    }

    /**
     * Test de l'agent d'affinement de prompt
     */
    async testPromptRefinementAgent() {
        console.log('\n🔧 Test PromptRefinementAgent...');
        
        try {
            const agent = new PromptRefinementAgent();
            
            const testInput = {
                prompt: 'Comment créer une API REST ?',
                context: { domain: 'code' },
                options: { level: 'moderate' }
            };
            
            const result = await agent.execute(testInput);
            
            this.assert(result.originalPrompt === testInput.prompt, 'Prompt original préservé');
            this.assert(result.refinedPrompt && result.refinedPrompt.length > 0, 'Prompt affiné généré');
            this.assert(result.analysis && typeof result.analysis === 'object', 'Analyse générée');
            this.assert(Array.isArray(result.suggestions), 'Suggestions générées');
            this.assert(typeof result.confidence === 'number', 'Score de confiance généré');
            
            this.addTestResult('PromptRefinementAgent', true, `Prompt affiné avec ${result.suggestions.length} suggestions`);
            
        } catch (error) {
            this.addTestResult('PromptRefinementAgent', false, error.message);
        }
    }

    /**
     * Test de l'agent de distribution
     */
    async testDistributionAgent() {
        console.log('\n📡 Test DistributionAgent...');
        
        try {
            const agent = new DistributionAgent();
            
            const testInput = {
                refinedPrompt: 'Comment créer une API REST avec Node.js et Express ?',
                taskType: 'code',
                maxSources: 3,
                timeout: 5000
            };
            
            const result = await agent.execute(testInput);
            
            this.assert(result.sourcesUsed && Array.isArray(result.sourcesUsed), 'Sources utilisées listées');
            this.assert(result.distributionResults && Array.isArray(result.distributionResults), 'Résultats de distribution générés');
            this.assert(result.aggregatedResult && typeof result.aggregatedResult === 'object', 'Résultat agrégé généré');
            this.assert(typeof result.efficiency === 'object', 'Métriques d\'efficacité générées');
            
            this.addTestResult('DistributionAgent', true, `Distribué vers ${result.sourcesUsed.length} sources`);
            
        } catch (error) {
            this.addTestResult('DistributionAgent', false, error.message);
        }
    }

    /**
     * Test de l'agent de collecte
     */
    async testCollectionAgent() {
        console.log('\n📊 Test CollectionAgent...');
        
        try {
            const agent = new CollectionAgent();
            
            // Simuler des résultats de distribution
            const mockDistributionResults = {
                sourcesUsed: ['LLaMA 3', 'Mistral', 'CodeGemma'],
                distributionResults: [
                    { success: true, source: { name: 'LLaMA 3', type: 'language_model' }, data: { content: 'Test content 1', confidence: 0.8 }, responseTime: 1000 },
                    { success: true, source: { name: 'Mistral', type: 'language_model' }, data: { content: 'Test content 2', confidence: 0.9 }, responseTime: 1200 },
                    { success: true, source: { name: 'CodeGemma', type: 'code_model' }, data: { content: 'Test code content', confidence: 0.85 }, responseTime: 800 }
                ],
                aggregatedResult: {
                    reliability_score: 0.85,
                    successful_sources: 3,
                    average_response_time: 1000
                }
            };
            
            const testInput = {
                distributionResults: mockDistributionResults,
                originalPrompt: 'Comment créer une API REST ?',
                taskType: 'code'
            };
            
            const result = await agent.execute(testInput);
            
            this.assert(result.dataAnalysis && typeof result.dataAnalysis === 'object', 'Analyse des données générée');
            this.assert(result.keyFindings && Array.isArray(result.keyFindings), 'Éléments clés identifiés');
            this.assert(result.sourceCorrelation && typeof result.sourceCorrelation === 'object', 'Corrélation des sources générée');
            this.assert(result.synthesis && typeof result.synthesis === 'object', 'Synthèse générée');
            this.assert(result.qualityAssessment && typeof result.qualityAssessment === 'object', 'Évaluation qualité générée');
            
            this.addTestResult('CollectionAgent', true, `${result.keyFindings.length} éléments clés collectés`);
            
        } catch (error) {
            this.addTestResult('CollectionAgent', false, error.message);
        }
    }

    /**
     * Test de l'agent d'innovation
     */
    async testInnovationAgent() {
        console.log('\n💡 Test InnovationAgent...');
        
        try {
            const agent = new InnovationAgent();
            
            // Simuler une synthèse de collection
            const mockCollectionSynthesis = {
                synthesis: {
                    main_points: [{ point: 'API REST structure' }, { point: 'Express.js framework' }],
                    confidence_level: 0.8,
                    recommended_actions: ['Implement endpoints', 'Add middleware']
                },
                keyFindings: [
                    { category: 'code', content: 'Express.js examples', importance: 'high', confidence: 0.9 },
                    { category: 'performance', content: 'Optimization tips', importance: 'medium', confidence: 0.7 }
                ],
                qualityAssessment: {
                    overall_quality: 0.85,
                    completeness: 0.8,
                    reliability: 0.9
                }
            };
            
            const testInput = {
                collectionSynthesis: mockCollectionSynthesis,
                originalPrompt: 'Comment créer une API REST ?',
                taskType: 'code',
                innovationLevel: 'moderate'
            };
            
            const result = await agent.execute(testInput);
            
            this.assert(result.solutionAnalysis && typeof result.solutionAnalysis === 'object', 'Analyse de solution générée');
            this.assert(result.opportunities && Array.isArray(result.opportunities), 'Opportunités identifiées');
            this.assert(result.improvements && Array.isArray(result.improvements), 'Améliorations générées');
            this.assert(result.riskAnalysis && typeof result.riskAnalysis === 'object', 'Analyse des risques générée');
            this.assert(result.recommendations && typeof result.recommendations === 'object', 'Recommandations générées');
            
            this.addTestResult('InnovationAgent', true, `${result.improvements.length} améliorations proposées`);
            
        } catch (error) {
            this.addTestResult('InnovationAgent', false, error.message);
        }
    }

    /**
     * Test de l'agent de vérification
     */
    async testVerificationAgent() {
        console.log('\n✅ Test VerificationAgent...');
        
        try {
            const agent = new VerificationAgent();
            
            // Simuler des innovations
            const mockInnovations = {
                improvements: [
                    {
                        id: 'improvement_1',
                        title: 'Performance Optimization',
                        description: 'Optimize API response times',
                        category: 'performance',
                        priority: 'high',
                        implementation: ['Step 1', 'Step 2'],
                        expected_benefits: ['Faster responses'],
                        timeline: '2-4 weeks',
                        innovation_score: 0.8
                    }
                ],
                riskAnalysis: {
                    success_probability: 0.8
                },
                innovationMetrics: {
                    innovation_potential: 0.7
                }
            };
            
            const mockCollectionSynthesis = {
                synthesis: { confidence_level: 0.8 },
                qualityAssessment: { overall_quality: 0.85 }
            };
            
            const testInput = {
                innovations: mockInnovations,
                collectionSynthesis: mockCollectionSynthesis,
                originalPrompt: 'Comment créer une API REST ?',
                taskType: 'code'
            };
            
            const result = await agent.execute(testInput);
            
            this.assert(result.verification_summary && typeof result.verification_summary === 'object', 'Résumé de vérification généré');
            this.assert(result.coherence_check && typeof result.coherence_check === 'object', 'Vérification de cohérence effectuée');
            this.assert(result.improvement_validation && typeof result.improvement_validation === 'object', 'Validation des améliorations effectuée');
            this.assert(result.quality_tests && typeof result.quality_tests === 'object', 'Tests de qualité effectués');
            this.assert(result.final_validation && typeof result.final_validation === 'object', 'Validation finale effectuée');
            
            this.addTestResult('VerificationAgent', true, `Score de vérification: ${result.verification_summary.score}`);
            
        } catch (error) {
            this.addTestResult('VerificationAgent', false, error.message);
        }
    }

    /**
     * Test de l'agent de synthèse
     */
    async testSynthesisAgent() {
        console.log('\n📋 Test SynthesisAgent...');
        
        try {
            const agent = new SynthesisAgent();
            
            // Simuler tous les résultats précédents
            const mockInput = {
                originalPrompt: 'Comment créer une API REST ?',
                promptRefinement: {
                    originalPrompt: 'Comment créer une API REST ?',
                    refinedPrompt: 'Comment créer une API REST robuste avec Node.js et Express ?',
                    confidence: 0.8
                },
                distributionResults: {
                    sourcesUsed: ['LLaMA 3', 'Mistral'],
                    efficiency: { overall_score: 0.85 }
                },
                collectionSynthesis: {
                    synthesis: { confidence_level: 0.8 },
                    keyFindings: [{ category: 'code', content: 'Express example' }],
                    qualityAssessment: { overall_quality: 0.85 }
                },
                innovations: {
                    improvements: [{ title: 'Performance boost', innovation_score: 0.8 }],
                    innovationMetrics: { innovation_potential: 0.7 }
                },
                verification: {
                    verification_summary: { score: 85 },
                    verification_metrics: { overall_confidence: 0.8 },
                    final_validation: { overall_score: 85, final_status: 'approved' }
                },
                taskType: 'code'
            };
            
            const result = await agent.execute(mockInput);
            
            this.assert(result.synthesis_metadata && typeof result.synthesis_metadata === 'object', 'Métadonnées de synthèse générées');
            this.assert(result.final_response && typeof result.final_response === 'object', 'Réponse finale générée');
            this.assert(result.workflow_analysis && typeof result.workflow_analysis === 'object', 'Analyse du workflow générée');
            this.assert(result.quality_metrics && typeof result.quality_metrics === 'object', 'Métriques de qualité générées');
            this.assert(result.appendices && typeof result.appendices === 'object', 'Annexes générées');
            
            this.addTestResult('SynthesisAgent', true, `Confiance finale: ${Math.round(result.quality_metrics.overall_confidence * 100)}%`);
            
        } catch (error) {
            this.addTestResult('SynthesisAgent', false, error.message);
        }
    }

    /**
     * Test du workflow complet via l'orchestrateur
     */
    async testCompleteWorkflow() {
        console.log('\n🎯 Test du workflow complet...');
        
        try {
            const orchestrator = new Orchestrator();
            
            // Ajouter un listener pour suivre la progression
            let progressEvents = [];
            orchestrator.on('all', (event, data) => {
                progressEvents.push({ event, data });
            });
            
            const testPrompt = 'Comment créer une API REST sécurisée avec Node.js ?';
            const options = {
                taskType: 'code',
                innovationLevel: 'moderate',
                maxSources: 2,
                timeout: 10000
            };
            
            const result = await orchestrator.processRequest(testPrompt, options);
            
            this.assert(result.workflow_metadata && typeof result.workflow_metadata === 'object', 'Métadonnées du workflow générées');
            this.assert(result.response && typeof result.response === 'object', 'Réponse principale générée');
            this.assert(result.status && result.status.success === true, 'Workflow terminé avec succès');
            this.assert(result.quality_metrics && typeof result.quality_metrics === 'object', 'Métriques de qualité générées');
            this.assert(progressEvents.length > 0, 'Événements de progression émis');
            
            // Vérifier que toutes les phases ont été exécutées
            const phaseEvents = progressEvents.filter(p => p.event.includes('phase'));
            this.assert(phaseEvents.length >= 4, 'Les deux phases ont été exécutées'); // start/complete pour chaque phase
            
            this.addTestResult('Orchestrator', true, `Workflow complet - Score: ${result.status.final_score}, Durée: ${result.workflow_metadata.total_duration_ms}ms`);
            
        } catch (error) {
            this.addTestResult('Orchestrator', false, error.message);
        }
    }

    // Méthodes utilitaires

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion échouée: ${message}`);
        }
        console.log(`  ✓ ${message}`);
    }

    addTestResult(component, success, details) {
        this.testResults.push({
            component,
            success,
            details,
            timestamp: new Date().toISOString()
        });
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${component}: ${details}`);
    }

    displayResults() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 RÉSULTATS DES TESTS');
        console.log('=' .repeat(50));

        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - successfulTests;

        console.log(`\nTests exécutés: ${totalTests}`);
        console.log(`Succès: ${successfulTests}`);
        console.log(`Échecs: ${failedTests}`);
        console.log(`Taux de réussite: ${Math.round((successfulTests / totalTests) * 100)}%`);

        if (failedTests > 0) {
            console.log('\n❌ Tests échoués:');
            this.testResults
                .filter(r => !r.success)
                .forEach(result => {
                    console.log(`  - ${result.component}: ${result.details}`);
                });
        }

        if (this.errors.length > 0) {
            console.log('\n🚨 Erreurs critiques:');
            this.errors.forEach(error => {
                console.log(`  - ${error.message}`);
            });
        }

        console.log('\n✨ Tests terminés !');
    }
}

// Exécution des tests si le script est appelé directement
if (require.main === module) {
    const tester = new AgentTester();
    tester.runAllTests().catch(error => {
        console.error('💥 Erreur fatale lors des tests:', error);
        process.exit(1);
    });
}

module.exports = AgentTester;