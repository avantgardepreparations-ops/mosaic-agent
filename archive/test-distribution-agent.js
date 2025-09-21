/**
 * Test script for DistributionAgent with external API integrations
 */

const DistributionAgent = require('../agents/DistributionAgent');

async function testDistributionAgent() {
    console.log('🧪 Testing DistributionAgent with external API integrations...\n');
    
    const agent = new DistributionAgent();
    
    // Test 1: General task with mixed sources
    console.log('📝 Test 1: General task distribution');
    try {
        const result1 = await agent.process({
            refinedPrompt: 'Explain the benefits of microservices architecture',
            taskType: 'general',
            maxSources: 3,
            timeout: 5000
        });
        
        console.log('✅ General task completed');
        console.log('Sources used:', result1.sourcesUsed);
        console.log('Success rate:', `${result1.aggregatedResult.successful_sources}/${result1.aggregatedResult.successful_sources + result1.aggregatedResult.failed_sources}`);
        if (result1.aggregatedResult.api_health) {
            console.log('API Health:', result1.aggregatedResult.api_health.status);
        }
        console.log('---\n');
    } catch (error) {
        console.error('❌ General task failed:', error.message);
        console.log('---\n');
    }
    
    // Test 2: Code-specific task
    console.log('💻 Test 2: Code generation task');
    try {
        const result2 = await agent.process({
            refinedPrompt: 'Write a Python function to calculate fibonacci numbers',
            taskType: 'code',
            maxSources: 2,
            timeout: 5000
        });
        
        console.log('✅ Code task completed');
        console.log('Sources used:', result2.sourcesUsed);
        console.log('Combined results:');
        result2.aggregatedResult.combined_content.forEach((content, idx) => {
            console.log(`  ${idx + 1}. ${content.source} (${content.provider}): ${content.confidence ? `confidence: ${content.confidence.toFixed(2)}` : ''}`);
        });
        console.log('---\n');
    } catch (error) {
        console.error('❌ Code task failed:', error.message);
        console.log('---\n');
    }
    
    // Test 3: Research task
    console.log('🔍 Test 3: Research task');
    try {
        const result3 = await agent.process({
            refinedPrompt: 'Find information about latest AI developments in 2024',
            taskType: 'research',
            maxSources: 3,
            timeout: 5000
        });
        
        console.log('✅ Research task completed');
        console.log('Sources used:', result3.sourcesUsed);
        console.log('Diversity score:', result3.aggregatedResult.diversity_score);
        console.log('---\n');
    } catch (error) {
        console.error('❌ Research task failed:', error.message);
        console.log('---\n');
    }
    
    // Test 4: Source selection for different task types
    console.log('🎯 Test 4: Source selection strategies');
    const codeSelection = agent.selectSources('code', 5);
    const researchSelection = agent.selectSources('research', 5);
    const creativieSelection = agent.selectSources('creative', 5);
    
    console.log('Code task sources:', codeSelection.map(s => `${s.name} (${s.external ? 'external' : 'local'})`));
    console.log('Research task sources:', researchSelection.map(s => `${s.name} (${s.external ? 'external' : 'local'})`));
    console.log('Creative task sources:', creativieSelection.map(s => `${s.name} (${s.external ? 'external' : 'local'})`));
    console.log('---\n');
    
    console.log('🎉 All tests completed!');
}

// Run tests
testDistributionAgent().catch(console.error);