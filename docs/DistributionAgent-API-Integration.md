# DistributionAgent External API Integration

## Overview

The DistributionAgent has been enhanced with external API integrations for parallel AI inference. It now supports real external AI services while maintaining backwards compatibility with mock responses for development and testing.

## Supported External APIs

### 1. Ollama (Local LLM Server)
- **Models**: LLaMA 3, Mistral, CodeGemma
- **URL**: `http://localhost:11434` (configurable via `OLLAMA_URL` env var)
- **Use case**: Local AI inference with high privacy

### 2. OpenAI GPT-4
- **Model**: GPT-4
- **URL**: `https://api.openai.com/v1/chat/completions`
- **Requires**: `OPENAI_API_KEY` environment variable
- **Use case**: High-quality text generation and reasoning

### 3. Hugging Face Inference API
- **Models**: Various models (default: microsoft/DialoGPT-medium)
- **URL**: `https://api-inference.huggingface.co/models/`
- **Requires**: `HUGGINGFACE_API_KEY` environment variable
- **Use case**: Diverse model selection and experimentation

### 4. ChromaDB Vector Search
- **URL**: `http://localhost:8000` (configurable via `CHROMADB_URL` env var)
- **Use case**: Vector similarity search and knowledge retrieval

## Environment Configuration

Create a `.env` file with the following variables:

```bash
# Local services
OLLAMA_URL=http://localhost:11434
CHROMADB_URL=http://localhost:8000

# External API keys (optional)
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

## Features

### Parallel AI Inference
- Distributes prompts to multiple AI sources simultaneously
- Uses `Promise.allSettled()` for concurrent execution
- Configurable timeouts per API type

### Intelligent Source Selection
- **Code tasks**: Prioritizes code-specialized models (CodeGemma, GPT-4)
- **Research tasks**: Favors vector databases and knowledge sources
- **Creative tasks**: Prefers advanced language models like GPT-4
- **General tasks**: Balanced mix of available sources

### Error Handling & Fallbacks
- Graceful handling of API failures
- Automatic fallback responses when external APIs are unavailable
- Detailed error logging and monitoring

### Health Monitoring
- API health scoring based on success rates
- Provider diversity tracking
- Response time monitoring
- Confidence scoring across sources

## Usage Example

```javascript
const DistributionAgent = require('./agents/DistributionAgent');

const agent = new DistributionAgent();

// Code generation task
const result = await agent.process({
    refinedPrompt: 'Write a Python function to calculate fibonacci numbers',
    taskType: 'code',
    maxSources: 3,
    timeout: 10000
});

console.log('Sources used:', result.sourcesUsed);
console.log('API Health:', result.aggregatedResult.api_health);
console.log('Combined results:', result.aggregatedResult.combined_content);
```

## Task Types

1. **general**: Balanced use of all available sources
2. **code**: Prioritizes code-specialized models
3. **research**: Focuses on databases and knowledge sources
4. **creative**: Uses advanced language models for creative tasks

## Response Structure

```javascript
{
    originalPrompt: "...",
    taskType: "code",
    sourcesUsed: ["Ollama CodeGemma", "OpenAI GPT-4"],
    distributionResults: [...],
    aggregatedResult: {
        summary: "2 sources responded successfully...",
        successful_sources: 2,
        failed_sources: 0,
        external_sources: 2,
        api_health: {
            score: 1.0,
            status: "excellent"
        },
        diversity_score: {
            providers_count: 2,
            types_count: 1
        },
        combined_content: [...]
    }
}
```

## Testing

Run the test script to verify the implementation:

```bash
node test-distribution-agent.js
```

This will test various task types and demonstrate the source selection strategies, error handling, and parallel inference capabilities.