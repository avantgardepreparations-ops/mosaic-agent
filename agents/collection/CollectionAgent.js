import { BaseAgent } from '../BaseAgent.js';

/**
 * Collection Agent
 * Responsible for collecting and aggregating data from various sources
 * This agent serves as the foundation for data gathering before verification and formatting
 */
export class CollectionAgent extends BaseAgent {
  constructor() {
    super('CollectionAgent', 'Aggregates data from multiple sources for processing');
    this.dataSources = [];
    this.collectedData = [];
  }

  /**
   * Add a data source to collect from
   * @param {string} sourceType - Type of data source (api, file, user_input, etc.)
   * @param {object} sourceConfig - Configuration for the data source
   */
  addDataSource(sourceType, sourceConfig) {
    this.dataSources.push({
      type: sourceType,
      config: sourceConfig,
      addedAt: new Date().toISOString()
    });
    this.log(`Added data source: ${sourceType}`);
  }

  /**
   * Collect data from user input prompt
   * @param {string} prompt - User input prompt
   * @returns {object} - Structured data from prompt
   */
  async collectFromPrompt(prompt) {
    this.log('Collecting data from user prompt');
    
    // Analyze prompt for intent, keywords, and requirements
    const analysisResult = {
      originalPrompt: prompt,
      intent: this.analyzeIntent(prompt),
      keywords: this.extractKeywords(prompt),
      complexity: this.assessComplexity(prompt),
      requiredSources: this.identifyRequiredSources(prompt),
      metadata: {
        length: prompt.length,
        language: 'auto-detected',
        timestamp: new Date().toISOString()
      }
    };

    return analysisResult;
  }

  /**
   * Analyze the intent of the user prompt
   * @param {string} prompt - User prompt
   * @returns {string} - Detected intent
   */
  analyzeIntent(prompt) {
    const intentKeywords = {
      'question': ['what', 'how', 'why', 'when', 'where', 'who', '?'],
      'request': ['please', 'can you', 'could you', 'help me'],
      'command': ['create', 'build', 'generate', 'make', 'implement'],
      'analysis': ['analyze', 'review', 'examine', 'evaluate', 'assess']
    };

    const lowerPrompt = prompt.toLowerCase();
    let maxMatches = 0;
    let detectedIntent = 'general';

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      const matches = keywords.filter(keyword => lowerPrompt.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedIntent = intent;
      }
    }

    return detectedIntent;
  }

  /**
   * Extract keywords from the prompt
   * @param {string} prompt - User prompt
   * @returns {Array<string>} - Extracted keywords
   */
  extractKeywords(prompt) {
    // Simple keyword extraction - remove common words and split
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Return unique words
    return [...new Set(words)];
  }

  /**
   * Assess the complexity of the prompt
   * @param {string} prompt - User prompt
   * @returns {string} - Complexity level (simple, medium, complex)
   */
  assessComplexity(prompt) {
    const length = prompt.length;
    const wordCount = prompt.split(/\s+/).length;
    const hasQuestions = prompt.includes('?');
    const hasMultipleParts = prompt.includes(';') || prompt.includes(',');

    if (length < 50 && wordCount < 10 && !hasMultipleParts) {
      return 'simple';
    } else if (length < 200 && wordCount < 40) {
      return 'medium';
    } else {
      return 'complex';
    }
  }

  /**
   * Identify what sources might be needed based on the prompt
   * @param {string} prompt - User prompt
   * @returns {Array<string>} - List of potential sources needed
   */
  identifyRequiredSources(prompt) {
    const sourceIndicators = {
      'factual_data': ['fact', 'data', 'statistic', 'information', 'research'],
      'code_examples': ['code', 'example', 'implementation', 'script', 'function'],
      'documentation': ['how to', 'tutorial', 'guide', 'manual', 'documentation'],
      'current_events': ['news', 'recent', 'current', 'latest', 'today']
    };

    const lowerPrompt = prompt.toLowerCase();
    const requiredSources = [];

    for (const [source, indicators] of Object.entries(sourceIndicators)) {
      if (indicators.some(indicator => lowerPrompt.includes(indicator))) {
        requiredSources.push(source);
      }
    }

    return requiredSources.length > 0 ? requiredSources : ['general_knowledge'];
  }

  /**
   * Process input by collecting data from all configured sources
   * @param {any} input - Input data (typically a user prompt)
   * @returns {Promise<object>} - Aggregated collected data
   */
  async process(input) {
    this.log('Starting data collection process');
    
    const collectedData = {
      timestamp: new Date().toISOString(),
      sources: [],
      aggregatedContent: {}
    };

    // If input is a string (user prompt), collect from it
    if (typeof input === 'string') {
      const promptData = await this.collectFromPrompt(input);
      collectedData.sources.push({
        type: 'user_prompt',
        data: promptData
      });
      collectedData.aggregatedContent.prompt = promptData;
    }

    // Simulate collecting from other sources (in a real implementation, these would be actual API calls)
    for (const source of this.dataSources) {
      try {
        const sourceData = await this.collectFromSource(source);
        collectedData.sources.push({
          type: source.type,
          data: sourceData
        });
      } catch (error) {
        this.log(`Failed to collect from source ${source.type}: ${error.message}`, 'warn');
      }
    }

    // Create summary
    collectedData.summary = {
      totalSources: collectedData.sources.length,
      primaryContent: collectedData.aggregatedContent.prompt?.originalPrompt || 'No prompt provided',
      complexity: collectedData.aggregatedContent.prompt?.complexity || 'unknown',
      requiredProcessing: this.determineRequiredProcessing(collectedData)
    };

    this.collectedData.push(collectedData);
    this.log(`Data collection completed. Collected from ${collectedData.sources.length} sources`);
    
    return collectedData;
  }

  /**
   * Collect data from a specific source
   * @param {object} source - Source configuration
   * @returns {Promise<object>} - Data from the source
   */
  async collectFromSource(source) {
    // Simulate data collection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      sourceType: source.type,
      config: source.config,
      status: 'collected',
      timestamp: new Date().toISOString(),
      data: `Simulated data from ${source.type}`
    };
  }

  /**
   * Determine what processing will be required based on collected data
   * @param {object} collectedData - The collected data
   * @returns {Array<string>} - List of required processing steps
   */
  determineRequiredProcessing(collectedData) {
    const processing = ['verification']; // Always verify

    if (collectedData.aggregatedContent.prompt) {
      const complexity = collectedData.aggregatedContent.prompt.complexity;
      const intent = collectedData.aggregatedContent.prompt.intent;

      if (complexity === 'complex') {
        processing.push('advanced_formatting');
      } else {
        processing.push('basic_formatting');
      }

      if (intent === 'command' || intent === 'request') {
        processing.push('structured_response');
      }
    }

    return processing;
  }

  /**
   * Get collected data history
   * @returns {Array<object>} - History of collected data
   */
  getCollectedDataHistory() {
    return this.collectedData;
  }

  /**
   * Clear collected data history
   */
  clearHistory() {
    this.collectedData = [];
    this.log('Cleared collected data history');
  }
}