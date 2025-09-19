import { AgentOrchestrator } from './orchestrator/index.js';

/**
 * Example usage of the Mosaic Agent System
 * Demonstrates how to use the orchestrated agent workflow
 */

// Create orchestrator instance
const orchestrator = new AgentOrchestrator();

// Example function to demonstrate agent usage
async function demonstrateAgentSystem() {
  console.log('🤖 Mosaic Agent System Demo');
  console.log('============================\n');

  try {
    // Example 1: Simple question
    console.log('📝 Example 1: Simple Question');
    const result1 = await orchestrator.run(
      'What is machine learning and how does it work?',
      { outputFormat: 'markdown' }
    );
    
    console.log('Result:');
    console.log(result1.output);
    console.log(`\nMetadata: Verification Score: ${result1.metadata.verificationScore}, Processing Time: ${result1.metadata.processingTime.total}ms\n`);
    
    // Example 2: Code request
    console.log('💻 Example 2: Code Request');
    const result2 = await orchestrator.run(
      'Create a Python function to sort a list of dictionaries by a specific key',
      { outputFormat: 'html' }
    );
    
    console.log('HTML Output Generated (truncated):');
    console.log(result2.output.substring(0, 300) + '...\n');
    
    // Example 3: Complex analysis request
    console.log('🔍 Example 3: Analysis Request');
    const result3 = await orchestrator.run(
      'Analyze the differences between REST and GraphQL APIs, including pros and cons',
      { 
        outputFormat: 'json',
        includeMetadata: true,
        strictVerification: true
      }
    );
    
    console.log('JSON Output:');
    const jsonOutput = JSON.parse(result3.output);
    console.log(`Title: ${jsonOutput.title}`);
    console.log(`Content Length: ${jsonOutput.content.length} characters`);
    console.log(`Warnings: ${jsonOutput.warnings.length}\n`);
    
    // Example 4: Batch processing
    console.log('📦 Example 4: Batch Processing');
    const batchInputs = [
      'What is Node.js?',
      'Explain async/await in JavaScript',
      'How to handle errors in React?'
    ];
    
    const batchResult = await orchestrator.batch(batchInputs, {
      outputFormat: 'plain'
    });
    
    console.log(`Batch Results: ${batchResult.successful}/${batchResult.total} successful`);
    batchResult.results.forEach((result, index) => {
      if (result.success) {
        console.log(`  ✅ Input ${index + 1}: Generated ${result.result.output.length} characters`);
      } else {
        console.log(`  ❌ Input ${index + 1}: ${result.error}`);
      }
    });
    
    // Show system status
    console.log('\n📊 System Status:');
    const status = orchestrator.getStatus();
    console.log(`Total Runs: ${status.metrics.totalRuns}`);
    console.log(`Success Rate: ${(status.metrics.successRate * 100).toFixed(1)}%`);
    console.log(`Average Processing Time: ${status.metrics.averageProcessingTime.toFixed(0)}ms`);
    
    console.log('\n✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Command line interface
async function handleCommandLine() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node example.js [command] [options]');
    console.log('Commands:');
    console.log('  demo                    - Run the demo');
    console.log('  run <prompt>           - Process a single prompt');
    console.log('  preview <prompt>       - Preview output format');
    console.log('  formats                - List available formats');
    console.log('  status                 - Show system status');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'demo':
      await demonstrateAgentSystem();
      break;
      
    case 'run':
      if (args.length < 2) {
        console.log('Usage: node example.js run "<your prompt>" [--format <format>]');
        return;
      }
      
      // Parse arguments properly
      let prompt = '';
      let format = 'markdown';
      
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--format' && i + 1 < args.length) {
          format = args[i + 1];
          i++; // Skip the format value
        } else {
          prompt += (prompt ? ' ' : '') + args[i];
        }
      }
      
      try {
        console.log(`Processing: "${prompt}"`);
        const result = await orchestrator.run(prompt, { outputFormat: format });
        console.log('\nResult:');
        console.log(result.output);
        console.log(`\nProcessing time: ${result.metadata.processingTime.total}ms`);
      } catch (error) {
        console.error('Error:', error.message);
      }
      break;
      
    case 'preview':
      if (args.length < 2) {
        console.log('Usage: node example.js preview "<your prompt>" [--format <format>]');
        return;
      }
      
      // Parse arguments properly
      let previewPrompt = '';
      let previewFormat = 'markdown';
      
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--format' && i + 1 < args.length) {
          previewFormat = args[i + 1];
          i++; // Skip the format value
        } else {
          previewPrompt += (previewPrompt ? ' ' : '') + args[i];
        }
      }
      
      try {
        const preview = await orchestrator.previewOutput(previewPrompt, previewFormat);
        console.log('Preview:');
        console.log(preview);
      } catch (error) {
        console.error('Error:', error.message);
      }
      break;
      
    case 'formats':
      const formats = orchestrator.getAvailableFormats();
      console.log('Available output formats:');
      formats.forEach(format => {
        console.log(`  ${format.name} (.${format.extension}) - ${format.description}`);
      });
      break;
      
    case 'status':
      const status = orchestrator.getStatus();
      console.log('System Status:');
      console.log(`  Running: ${status.isRunning}`);
      console.log(`  Current Step: ${status.currentStep || 'None'}`);
      console.log(`  Total Runs: ${status.metrics.totalRuns}`);
      console.log(`  Successful Runs: ${status.metrics.successfulRuns}`);
      console.log(`  Success Rate: ${(status.metrics.successRate * 100).toFixed(1)}%`);
      console.log(`  Average Processing Time: ${status.metrics.averageProcessingTime.toFixed(0)}ms`);
      
      console.log('\nAgent Status:');
      console.log(`  Collection Agent: ${status.agents.collection.isProcessing ? 'Processing' : 'Idle'}`);
      console.log(`  Verification Agent: ${status.agents.verification.isProcessing ? 'Processing' : 'Idle'}`);
      console.log(`  Formatting Agent: ${status.agents.formatting.isProcessing ? 'Processing' : 'Idle'}`);
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Use "node example.js" to see available commands.');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  handleCommandLine().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { demonstrateAgentSystem, orchestrator };