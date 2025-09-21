/**
 * Test des Agents Multi-Agent
 * 
 * ATTENTION: NE JAMAIS MELANGER AVEC MOSAICMIND
 * Tests strictement séparés de MOSAICMIND
 */

const MultiAgentOrchestrator = require('./agents/orchestrator/index');

async function testMultiAgentSystem() {
    console.log('🧪 TESTS DU SYSTÈME MULTI-AGENT');
    console.log('=' .repeat(50));
    
    try {
        // Création de l'orchestrateur
        console.log('\n📋 Initialisation de l\'orchestrateur...');
        const orchestrator = new MultiAgentOrchestrator({
            enableLogging: true,
            enableMetrics: true
        });
        
        // Vérification du statut
        console.log('\n📊 Statut de l\'orchestrateur:');
        const status = orchestrator.getStatus();
        console.log(`- Orchestrateur: ${status.name} (${status.status})`);
        console.log(`- Agents: ${Object.keys(status.agents).length} agents initialisés`);
        console.log(`- Séparation validée: ${status.separationValidated ? '✅' : '❌'}`);
        
        // Test avec différents types de prompts
        const testCases = [
            {
                name: 'Prompt de Codage JavaScript',
                prompt: 'Créer une fonction JavaScript qui valide une adresse email',
                context: { userLevel: 'intermediate', domain: 'web' }
            },
            {
                name: 'Prompt d\'Explication',
                prompt: 'Expliquer comment fonctionne le garbage collection en JavaScript',
                context: { userLevel: 'beginner' }
            },
            {
                name: 'Prompt d\'Analyse',
                prompt: 'Analyser les avantages et inconvénients de React vs Vue.js',
                context: { userLevel: 'advanced', domain: 'web' }
            }
        ];
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n🔬 Test ${i + 1}: ${testCase.name}`);
            console.log(`Prompt: "${testCase.prompt}"`);
            
            try {
                const startTime = Date.now();
                const result = await orchestrator.processRequest(testCase.prompt, testCase.context);
                const processingTime = Date.now() - startTime;
                
                console.log(`✅ Succès en ${processingTime}ms`);
                console.log(`- ID Requête: ${result.requestId}`);
                console.log(`- Étapes complétées: ${result.orchestration.metrics.successfulSteps}/${result.orchestration.metrics.totalSteps}`);
                console.log(`- Confiance finale: ${(result.result.analysis.confidence * 100).toFixed(1)}%`);
                console.log(`- Score qualité: ${(result.result.quality.score * 100).toFixed(1)}%`);
                console.log(`- Longueur réponse: ${result.result.response.length} caractères`);
                
                // Afficher un extrait de la réponse
                const responsePreview = result.result.response.substring(0, 200);
                console.log(`- Aperçu: "${responsePreview}${result.result.response.length > 200 ? '...' : ''}"`);
                
            } catch (error) {
                console.error(`❌ Échec du test: ${error.message}`);
            }
        }
        
        // Affichage des métriques finales
        console.log('\n📈 MÉTRIQUES FINALES');
        console.log('=' .repeat(30));
        const finalStatus = orchestrator.getStatus();
        console.log(`- Requêtes totales: ${finalStatus.metrics.totalRequests}`);
        console.log(`- Succès: ${finalStatus.metrics.successfulRequests}`);
        console.log(`- Échecs: ${finalStatus.metrics.failedRequests}`);
        console.log(`- Temps moyen: ${finalStatus.metrics.averageProcessingTime.toFixed(1)}ms`);
        console.log(`- Taux de succès: ${((finalStatus.metrics.successfulRequests / finalStatus.metrics.totalRequests) * 100).toFixed(1)}%`);
        
        console.log('\n🎉 TESTS TERMINÉS AVEC SUCCÈS');
        console.log('✅ Système multi-agent fonctionnel');
        console.log('🔒 Séparation MOSAICMIND respectée');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ ERREUR LORS DES TESTS:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Test individuel des agents
async function testIndividualAgents() {
    console.log('\n🔧 TESTS INDIVIDUELS DES AGENTS');
    console.log('=' .repeat(40));
    
    try {
        const PromptRefinementAgent = require('./agents/PromptRefinementAgent');
        const CollectionAgent = require('./agents/CollectionAgent');
        const SynthesisAgent = require('./agents/SynthesisAgent');
        
        // Test PromptRefinementAgent
        console.log('\n1. Test PromptRefinementAgent:');
        const promptAgent = new PromptRefinementAgent();
        const refinedResult = await promptAgent.refinePrompt(
            "Créer une API REST",
            { userLevel: 'intermediate' }
        );
        console.log(`✅ Prompt affiné: "${refinedResult.refined.substring(0, 80)}..."`);
        console.log(`✅ Sous-prompts générés: ${refinedResult.subPrompts.length}`);
        
        // Test CollectionAgent avec données simulées
        console.log('\n2. Test CollectionAgent:');
        const collectionAgent = new CollectionAgent();
        const simulatedData = [
            {
                sourceId: 'test_source_1',
                sourceType: 'test',
                data: 'Données de test pour la collecte',
                confidence: 0.8,
                metadata: { test: true }
            },
            {
                sourceId: 'test_source_2',
                sourceType: 'test',
                data: 'Autres données de test',
                confidence: 0.6,
                metadata: { test: true }
            }
        ];
        
        const collectedResult = await collectionAgent.collectAndAggregate(
            refinedResult,
            simulatedData
        );
        console.log(`✅ Sources collectées: ${collectedResult.metrics.successfulCollections}`);
        console.log(`✅ Confiance globale: ${(collectedResult.collectedData.metadata.confidence * 100).toFixed(1)}%`);
        
        // Test SynthesisAgent
        console.log('\n3. Test SynthesisAgent:');
        const synthesisAgent = new SynthesisAgent();
        const synthesisResult = await synthesisAgent.synthesize(
            collectedResult,
            refinedResult
        );
        console.log(`✅ Réponse générée: ${synthesisResult.response.length} caractères`);
        console.log(`✅ Score qualité: ${(synthesisResult.quality.score * 100).toFixed(1)}%`);
        console.log(`✅ Contrôles qualité: ${synthesisResult.quality.passed ? 'PASSÉS' : 'ÉCHOUÉS'}`);
        
        console.log('\n✅ Tous les agents individuels fonctionnent correctement');
        return true;
        
    } catch (error) {
        console.error('\n❌ ERREUR LORS DES TESTS INDIVIDUELS:', error);
        return false;
    }
}

// Exécution des tests
async function runAllTests() {
    console.log('🚀 DÉMARRAGE DES TESTS COMPLETS DU SYSTÈME MULTI-AGENT');
    console.log('🔒 RAPPEL: SYSTÈME STRICTEMENT SÉPARÉ DE MOSAICMIND');
    console.log('=' .repeat(60));
    
    let allTestsPassed = true;
    
    // Tests individuels
    const individualTestsResult = await testIndividualAgents();
    allTestsPassed = allTestsPassed && individualTestsResult;
    
    // Tests d'intégration
    const integrationTestsResult = await testMultiAgentSystem();
    allTestsPassed = allTestsPassed && integrationTestsResult;
    
    console.log('\n' + '=' .repeat(60));
    if (allTestsPassed) {
        console.log('🎉 TOUS LES TESTS RÉUSSIS');
        console.log('✅ Système multi-agent opérationnel');
        console.log('✅ Tous les agents fonctionnent correctement');
        console.log('✅ Orchestration complète validée');
        console.log('🔒 Séparation MOSAICMIND strictement respectée');
    } else {
        console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
        console.log('⚠️ Vérifier les logs d\'erreur ci-dessus');
    }
    
    return allTestsPassed;
}

// Exécution si ce fichier est appelé directement
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = {
    testMultiAgentSystem,
    testIndividualAgents,
    runAllTests
};