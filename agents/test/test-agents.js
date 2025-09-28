import { AgentOrchestrator } from '../orchestrator/index.js';

/**
 * Test suite for the agent system
 * Tests individual agents and the complete orchestrated workflow
 */
class AgentTestSuite {
  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  /**
   * Log test results
   * @param {string} testName - Name of the test
   * @param {boolean} passed - Whether the test passed
   * @param {string} message - Test message
   */
  logTest(testName, passed, message = '') {
    this.totalTests++;
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${testName}: PASSED ${message}`);
    } else {
      console.log(`❌ ${testName}: FAILED ${message}`);
    }
    
    this.testResults.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Test basic orchestrator functionality
   */
  async testOrchestratorBasics() {
    console.log('\n🧪 Testing Orchestrator Basics...');
    
    try {
      const status = this.orchestrator.getStatus();
      this.logTest('Orchestrator Status', 
        status.name === 'AgentOrchestrator' && !status.isRunning,
        '- Status retrieved successfully'
      );

      const formats = this.orchestrator.getAvailableFormats();
      this.logTest('Available Formats', 
        Array.isArray(formats) && formats.length > 0,
        `- Found ${formats.length} formats`
      );

    } catch (error) {
      this.logTest('Orchestrator Basics', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Test simple workflow execution
   */
  async testSimpleWorkflow() {
    console.log('\n🧪 Testing Simple Workflow...');
    
    try {
      const input = "What is machine learning?";
      const result = await this.orchestrator.run(input, { outputFormat: 'markdown' });
      
      this.logTest('Simple Workflow Execution',
        result.success && result.output && result.output.length > 0,
        `- Generated ${result.output.length} characters`
      );

      this.logTest('Workflow Metadata',
        result.metadata && result.metadata.verificationScore !== undefined,
        `- Verification score: ${result.metadata.verificationScore}`
      );

      this.logTest('Output Format',
        result.metadata.outputFormat === 'markdown',
        '- Correct output format'
      );

    } catch (error) {
      this.logTest('Simple Workflow', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Test complex workflow with code request
   */
  async testComplexWorkflow() {
    console.log('\n🧪 Testing Complex Workflow...');
    
    try {
      const input = "Create a simple Python function to calculate factorial of a number with error handling";
      const result = await this.orchestrator.run(input, { 
        outputFormat: 'html',
        includeMetadata: true 
      });
      
      this.logTest('Complex Workflow Execution',
        result.success && result.output.includes('html'),
        '- HTML output generated'
      );

      this.logTest('Code Detection',
        result.fullWorkflowData && 
        result.fullWorkflowData.formattingResult &&
        result.fullWorkflowData.formattingResult.formattedContent.codeBlocks,
        '- Code blocks detected and formatted'
      );

    } catch (error) {
      this.logTest('Complex Workflow', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Test different output formats
   */
  async testOutputFormats() {
    console.log('\n🧪 Testing Output Formats...');
    
    const input = "Explain the concept of recursion in programming";
    const formats = ['markdown', 'plain', 'json', 'html'];
    
    for (const format of formats) {
      try {
        const result = await this.orchestrator.run(input, { outputFormat: format });
        
        this.logTest(`Format: ${format}`,
          result.success && result.metadata.outputFormat === format,
          `- Output length: ${result.output.length}`
        );

      } catch (error) {
        this.logTest(`Format: ${format}`, false, `- Error: ${error.message}`);
      }
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...');
    
    try {
      // Test with empty input
      await this.orchestrator.run('');
      this.logTest('Empty Input Handling', false, '- Should have thrown error');
    } catch (error) {
      this.logTest('Empty Input Handling', true, '- Correctly rejected empty input');
    }

    try {
      // Test with null input
      await this.orchestrator.run(null);
      this.logTest('Null Input Handling', false, '- Should have thrown error');
    } catch (error) {
      this.logTest('Null Input Handling', true, '- Correctly rejected null input');
    }

    try {
      // Test with invalid format
      await this.orchestrator.run('Test', { outputFormat: 'invalid_format' });
      this.logTest('Invalid Format Handling', false, '- Should have thrown error');
    } catch (error) {
      this.logTest('Invalid Format Handling', true, '- Correctly handled invalid format');
    }
  }

  /**
   * Test workflow preview
   */
  async testPreview() {
    console.log('\n🧪 Testing Preview Functionality...');
    
    try {
      const preview = await this.orchestrator.previewOutput(
        'How to create a REST API?', 
        'markdown'
      );
      
      this.logTest('Preview Generation',
        typeof preview === 'string' && preview.length > 0,
        `- Preview length: ${preview.length}`
      );

    } catch (error) {
      this.logTest('Preview Generation', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Test batch processing
   */
  async testBatchProcessing() {
    console.log('\n🧪 Testing Batch Processing...');
    
    try {
      const inputs = [
        'What is JavaScript?',
        'Explain Python loops',
        'How does HTTP work?'
      ];
      
      const batchResult = await this.orchestrator.batch(inputs, { 
        outputFormat: 'plain' 
      });
      
      this.logTest('Batch Processing',
        batchResult.total === inputs.length && batchResult.successful > 0,
        `- ${batchResult.successful}/${batchResult.total} successful`
      );

    } catch (error) {
      this.logTest('Batch Processing', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Test agent configuration
   */
  async testAgentConfiguration() {
    console.log('\n🧪 Testing Agent Configuration...');
    
    try {
      // Configure collection agent
      this.orchestrator.configureAgent('collection', {
        dataSources: [
          { type: 'test_source', config: { enabled: true } }
        ]
      });
      
      // Configure verification agent
      this.orchestrator.configureAgent('verification', {
        rules: [
          {
            type: 'test_rule',
            function: (data) => ({ score: 1.0, issues: [], corrections: [] }),
            description: 'Test verification rule'
          }
        ]
      });
      
      // Configure formatting agent
      this.orchestrator.configureAgent('formatting', {
        rules: [
          {
            name: 'test_formatting',
            function: (content) => content,
            description: 'Test formatting rule'
          }
        ]
      });
      
      this.logTest('Agent Configuration', true, '- All agents configured successfully');

    } catch (error) {
      this.logTest('Agent Configuration', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Test performance metrics
   */
  async testPerformanceMetrics() {
    console.log('\n🧪 Testing Performance Metrics...');
    
    try {
      // Run a few workflows to generate metrics
      await this.orchestrator.run('Test input 1');
      await this.orchestrator.run('Test input 2');
      
      const status = this.orchestrator.getStatus();
      
      this.logTest('Metrics Collection',
        status.metrics.totalRuns >= 2 && 
        status.metrics.successfulRuns >= 0 &&
        typeof status.metrics.averageProcessingTime === 'number',
        `- ${status.metrics.totalRuns} total runs, ${status.metrics.successfulRuns} successful`
      );

      this.logTest('Step Performance Tracking',
        status.metrics.averageStepTimes &&
        typeof status.metrics.averageStepTimes.collection === 'number',
        '- Step timing data available'
      );

    } catch (error) {
      this.logTest('Performance Metrics', false, `- Error: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Agent System Test Suite');
    console.log('=====================================');
    
    const startTime = Date.now();
    
    // Run all test categories
    await this.testOrchestratorBasics();
    await this.testSimpleWorkflow();
    await this.testComplexWorkflow();
    await this.testOutputFormats();
    await this.testErrorHandling();
    await this.testPreview();
    await this.testBatchProcessing();
    await this.testAgentConfiguration();
    await this.testPerformanceMetrics();
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Time: ${totalTime}ms`);
    
    // Show failed tests
    const failedTests = this.testResults.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
    }
    
    // Final status
    if (this.passedTests === this.totalTests) {
      console.log('\n🎉 All tests passed! Agent system is working correctly.');
    } else {
      console.log(`\n⚠️ ${this.totalTests - this.passedTests} tests failed. Please review the implementation.`);
    }
    
    return {
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.totalTests - this.passedTests,
      successRate: (this.passedTests / this.totalTests) * 100,
      totalTime,
      results: this.testResults
    };
  }
}

// Export for use in other modules
export { AgentTestSuite };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new AgentTestSuite();
  testSuite.runAllTests()
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}