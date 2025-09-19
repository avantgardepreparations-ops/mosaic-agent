# Mosaic Agent System

A comprehensive JavaScript-based agent system that orchestrates data collection, verification, and formatting for AI-powered content generation.

## Architecture

The system consists of four main components:

1. **CollectionAgent** - Aggregates data from multiple sources
2. **VerificationAgent** - Verifies factualness, consistency, and relevance
3. **FormattingAgent** - Formats output according to predefined standards  
4. **AgentOrchestrator** - Manages the complete workflow

## Workflow

```
User Input → CollectionAgent → VerificationAgent → FormattingAgent → Formatted Output
```

## Quick Start

### Installation

```bash
cd agents
npm install
```

### Basic Usage

```javascript
import { AgentOrchestrator } from './orchestrator/index.js';

const orchestrator = new AgentOrchestrator();

// Process a simple prompt
const result = await orchestrator.run('What is machine learning?', {
  outputFormat: 'markdown'
});

console.log(result.output);
```

### Command Line Usage

```bash
# Run the demo
node example.js demo

# Process a single prompt
node example.js run "Explain REST APIs"

# Preview output format
node example.js preview "How to use JavaScript async/await" --format html

# List available formats
node example.js formats

# Check system status
node example.js status
```

## Features

### Output Formats

- **Markdown** - Clean markdown with headers, code blocks, and lists
- **HTML** - Semantic HTML with styling
- **JSON** - Structured data format
- **Plain Text** - Simple text format

### Verification Features

- Factual accuracy checking
- Internal consistency validation
- Relevance assessment
- Source credibility evaluation
- Temporal consistency verification

### Formatting Features

- Citation formatting
- Code block highlighting
- List standardization
- Header hierarchy
- Emphasis application

## API Reference

### AgentOrchestrator

#### Methods

##### `run(input, options)`

Executes the complete workflow for a single input.

**Parameters:**
- `input` (string) - User input prompt
- `options` (object) - Processing options
  - `outputFormat` (string) - Output format ('markdown', 'html', 'json', 'plain')
  - `strictVerification` (boolean) - Enable strict verification mode
  - `includeMetadata` (boolean) - Include full workflow metadata
  - `maxRetries` (number) - Maximum retry attempts

**Returns:** Promise\<object\> - Result with formatted output and metadata

```javascript
const result = await orchestrator.run('Explain Node.js', {
  outputFormat: 'html',
  strictVerification: true,
  includeMetadata: true
});
```

##### `batch(inputs, options)`

Process multiple inputs in batch.

**Parameters:**
- `inputs` (Array\<string\>) - Array of input prompts
- `options` (object) - Processing options

**Returns:** Promise\<object\> - Batch results with success/failure status

```javascript
const results = await orchestrator.batch([
  'What is Python?',
  'Explain async programming',
  'How does HTTP work?'
], { outputFormat: 'plain' });
```

##### `runWithRetry(input, options)`

Run workflow with automatic retry logic.

```javascript
const result = await orchestrator.runWithRetry('Complex query', {
  maxRetries: 3,
  outputFormat: 'markdown'
});
```

##### `previewOutput(input, format)`

Preview what the output would look like without full processing.

```javascript
const preview = await orchestrator.previewOutput('Test input', 'markdown');
console.log(preview);
```

##### `getStatus()`

Get current system status and metrics.

```javascript
const status = orchestrator.getStatus();
console.log(`Success rate: ${status.metrics.successRate * 100}%`);
```

##### `getAvailableFormats()`

Get list of available output formats.

```javascript
const formats = orchestrator.getAvailableFormats();
formats.forEach(format => {
  console.log(`${format.name}: ${format.description}`);
});
```

##### `configureAgent(agentName, config)`

Configure individual agents.

```javascript
// Configure collection agent
orchestrator.configureAgent('collection', {
  dataSources: [
    { type: 'api', config: { url: 'https://api.example.com' } }
  ]
});

// Configure verification agent
orchestrator.configureAgent('verification', {
  rules: [
    {
      type: 'custom_check',
      function: (data) => ({ score: 1.0, issues: [], corrections: [] }),
      description: 'Custom verification rule'
    }
  ]
});
```

## Individual Agents

### CollectionAgent

Responsible for collecting and aggregating data from various sources.

```javascript
import { CollectionAgent } from './collection/CollectionAgent.js';

const collector = new CollectionAgent();
collector.addDataSource('api', { url: 'https://example.com/api' });

const result = await collector.execute('User input');
```

### VerificationAgent

Verifies the factualness, consistency, and relevance of collected data.

```javascript
import { VerificationAgent } from './verification/VerificationAgent.js';

const verifier = new VerificationAgent();
verifier.addVerificationRule('safety', safetyCheckFunction, 'Safety check');

const result = await verifier.execute(collectedData);
```

### FormattingAgent

Formats verified data according to predefined standards.

```javascript
import { FormattingAgent } from './formatting/FormattingAgent.js';

const formatter = new FormattingAgent();
formatter.addFormattingRule('custom', customFormatter, 'Custom formatting');

const result = await formatter.execute(verifiedData, 'markdown');
```

## Testing

Run the test suite to verify all agents are working correctly:

```bash
# Run all tests
node test/test-agents.js

# Or using npm
npm test
```

## Error Handling

The system includes comprehensive error handling:

```javascript
try {
  const result = await orchestrator.run('Your prompt');
  console.log(result.output);
} catch (error) {
  console.error('Processing failed:', error.message);
}
```

## Performance Monitoring

The orchestrator tracks detailed performance metrics:

```javascript
const status = orchestrator.getStatus();
console.log('Performance Metrics:');
console.log(`Total runs: ${status.metrics.totalRuns}`);
console.log(`Success rate: ${status.metrics.successRate * 100}%`);
console.log(`Average time: ${status.metrics.averageProcessingTime}ms`);
console.log('Step timing:');
console.log(`  Collection: ${status.metrics.averageStepTimes.collection}ms`);
console.log(`  Verification: ${status.metrics.averageStepTimes.verification}ms`);
console.log(`  Formatting: ${status.metrics.averageStepTimes.formatting}ms`);
```

## Configuration

### Environment Variables

```bash
# Optional environment variables
AGENT_LOG_LEVEL=info          # Logging level (info, warn, error)
AGENT_MAX_RETRIES=2          # Default maximum retries
AGENT_DEFAULT_FORMAT=markdown # Default output format
```

### Custom Configuration

```javascript
// Configure the orchestrator
const orchestrator = new AgentOrchestrator();

// Add custom data sources
orchestrator.configureAgent('collection', {
  dataSources: [
    { type: 'database', config: { connectionString: 'postgresql://...' } },
    { type: 'api', config: { url: 'https://api.service.com', key: 'api-key' } }
  ]
});

// Add custom verification rules
orchestrator.configureAgent('verification', {
  rules: [
    {
      type: 'domain_specific',
      function: (data) => {
        // Your custom verification logic
        return { score: 0.9, issues: [], corrections: [] };
      },
      description: 'Domain-specific validation'
    }
  ]
});

// Add custom formatting rules
orchestrator.configureAgent('formatting', {
  rules: [
    {
      name: 'company_style',
      function: (content) => {
        // Your custom formatting logic
        return content;
      },
      description: 'Company style guide formatting'
    }
  ]
});
```

## Response Format

The orchestrator returns a structured response:

```javascript
{
  workflowId: "workflow_1234567890_abc123",
  success: true,
  output: "# Formatted content here...",
  metadata: {
    processingTime: {
      total: 1250,
      collection: 300,
      verification: 450,
      formatting: 500
    },
    outputFormat: "markdown",
    verificationScore: 0.85,
    verificationPassed: true,
    contentStats: {
      outputLength: 1024,
      codeBlocksCount: 2,
      citationsCount: 3,
      warningsCount: 0
    }
  },
  workflow: {
    steps: { /* detailed step information */ },
    options: { /* processing options used */ }
  },
  warnings: [], // Array of warning messages if any
  fullWorkflowData: { /* complete workflow data if includeMetadata: true */ }
}
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Ensure you're using Node.js 14+ and ES modules are supported
2. **"Processing failed" errors**: Check the error details in the response metadata
3. **Slow performance**: Monitor the step timing metrics to identify bottlenecks

### Debug Mode

Enable detailed logging:

```javascript
// Individual agent debugging
const collector = new CollectionAgent();
collector.log('Debug message', 'info');

// Orchestrator debugging
const status = orchestrator.getStatus();
console.log('Recent errors:', status.recentErrors);
console.log('Workflow history:', status.workflowHistory);
```

## Contributing

To extend the agent system:

1. Create new agents by extending `BaseAgent`
2. Add new verification rules or formatting rules
3. Implement custom output formats
4. Add new data sources for collection

## License

MIT License - see LICENSE file for details.