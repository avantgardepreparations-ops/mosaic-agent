/**
 * Exemple d'intégration du DistributionAgent dans un workflow existant
 * Ce script montre comment remplacer un mock par l'implémentation réelle
 */

const DistributionAgent = require('./DistributionAgent');

/**
 * Exemple d'un ancien workflow avec un mock
 */
class LegacyOrchestrator {
  constructor() {
    this.distributionAgent = null; // Anciennement un mock
  }

  // Ancienne méthode mock (à remplacer)
  async mockDistributionQuery(prompt) {
    console.log('🎭 [MOCK] Processing query:', prompt);
    return {
      success: true,
      results: [
        { api: 'MockAPI', response: 'This is a mock response', success: true }
      ],
      summary: { total: 1, successful: 1, failed: 0 }
    };
  }

  // Nouvelle méthode avec DistributionAgent réel
  async realDistributionQuery(prompt, options = {}) {
    if (!this.distributionAgent) {
      this.distributionAgent = new DistributionAgent();
    }

    console.log('🚀 [REAL] Processing query with DistributionAgent:', prompt);
    return await this.distributionAgent.distributeQuery(prompt, options);
  }

  // Méthode de transition qui permet de basculer entre mock et réel
  async processQuery(prompt, useMock = false, options = {}) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 Processing query (Mode: ${useMock ? 'MOCK' : 'REAL'})`);
    console.log('='.repeat(60));

    let result;
    if (useMock) {
      result = await this.mockDistributionQuery(prompt);
    } else {
      result = await this.realDistributionQuery(prompt, options);
    }

    // Traitement commun des résultats
    console.log('\n📊 Results Summary:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Total APIs: ${result.summary?.total || 0}`);
    console.log(`   Successful: ${result.summary?.successful || 0}`);
    console.log(`   Failed: ${result.summary?.failed || 0}`);

    if (result.success && result.results?.length > 0) {
      console.log('\n📝 Sample Response:');
      const firstSuccess = result.results.find(r => r.success);
      if (firstSuccess) {
        console.log(`   [${firstSuccess.api}]: ${firstSuccess.response?.substring(0, 100)}...`);
      }
    }

    return result;
  }
}

/**
 * Démonstration de l'intégration
 */
async function demonstrateIntegration() {
  console.log('🎯 Demonstration: Replacing Mock with Real DistributionAgent');
  console.log('================================================================\n');

  const orchestrator = new LegacyOrchestrator();
  const testPrompt = "What are the advantages of distributed systems?";

  try {
    // 1. Montrer le comportement avec mock
    console.log('Step 1: Using MOCK DistributionAgent');
    await orchestrator.processQuery(testPrompt, true);

    // 2. Montrer le comportement avec l'implémentation réelle
    console.log('\n\nStep 2: Using REAL DistributionAgent');
    await orchestrator.processQuery(testPrompt, false, {
      temperature: 0.7,
      maxTokens: 150
    });

    console.log('\n\n✅ Integration demonstration completed!');
    console.log('\n📋 Migration Steps:');
    console.log('   1. ✅ Create DistributionAgent.js with API integrations');
    console.log('   2. ✅ Update orchestrator to use real DistributionAgent');
    console.log('   3. ✅ Add environment variable management');
    console.log('   4. ✅ Test with available APIs');
    console.log('   5. ✅ Replace mock calls with real implementation');

  } catch (error) {
    console.error('\n❌ Error during demonstration:', error.message);
  }
}

// Export pour utilisation en tant que module
module.exports = { LegacyOrchestrator, demonstrateIntegration };

// Exécution directe
if (require.main === module) {
  demonstrateIntegration().catch(console.error);
}