import { CollectionAgent } from '../collection/CollectionAgent.js';
import { VerificationAgent } from '../verification/VerificationAgent.js';
import { FormattingAgent } from '../formatting/FormattingAgent.js';

/**
 * Agent Orchestrator
 * Manages the complete workflow from user prompt to formatted response
 * Coordinates the flow: CollectionAgent -> VerificationAgent -> FormattingAgent
 */
export class AgentOrchestrator {
  constructor() {
    this.name = 'AgentOrchestrator';
    this.description = 'Orchestrates the complete agent workflow from prompt to formatted response';
    
    // Initialize agents
    this.collectionAgent = new CollectionAgent();
    this.verificationAgent = new VerificationAgent();
    this.formattingAgent = new FormattingAgent();
    
    // Workflow state
    this.isRunning = false;
    this.currentStep = null;
    this.workflowHistory = [];
    this.errors = [];
    
    // Performance metrics
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      averageProcessingTime: 0,
      stepPerformance: {
        collection: { count: 0, totalTime: 0 },
        verification: { count: 0, totalTime: 0 },
        formatting: { count: 0, totalTime: 0 }
      }
    };
    
    this.log('Orchestrator initialized with all agents');
    this.initializeAgents();
  }

  /**
   * Initialize agents with default configurations
   */
  initializeAgents() {
    // Configure verification agent with some basic rules
    this.verificationAgent.addVerificationRule(
      'basic_safety',
      (data) => ({ score: 1.0, issues: [], corrections: [] }),
      'Basic safety check for content'
    );
    
    // Configure collection agent with default sources
    this.collectionAgent.addDataSource('user_input', { priority: 'high' });
    
    this.log('Agents configured with default settings');
  }

  /**
   * Log orchestrator activity
   * @param {string} message - Log message
   * @param {string} level - Log level (info, warn, error)
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`);
  }

  /**
   * Handle errors during orchestration
   * @param {Error} error - Error to handle
   * @param {string} step - Current step where error occurred
   * @param {any} input - Input that caused the error
   */
  handleError(error, step, input) {
    const errorInfo = {
      error: error.message,
      step,
      input: typeof input === 'object' ? JSON.stringify(input).substring(0, 100) : String(input).substring(0, 100),
      timestamp: new Date().toISOString()
    };
    
    this.errors.push(errorInfo);
    this.log(`Error in step ${step}: ${error.message}`, 'error');
    
    // Update metrics
    this.metrics.totalRuns++;
    
    throw new Error(`Orchestration failed at ${step}: ${error.message}`);
  }

  /**
   * Validate input before processing
   * @param {any} input - Input to validate
   * @returns {boolean} - True if valid
   */
  validateInput(input) {
    if (!input) {
      return false;
    }
    
    if (typeof input === 'string' && input.trim().length === 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Prepare workflow context
   * @param {any} input - Initial input
   * @param {object} options - Processing options
   * @returns {object} - Workflow context
   */
  prepareWorkflowContext(input, options = {}) {
    return {
      workflowId: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date().toISOString(),
      input,
      options: {
        outputFormat: options.outputFormat || 'markdown',
        strictVerification: options.strictVerification !== false,
        includeMetadata: options.includeMetadata !== false,
        maxRetries: options.maxRetries || 2,
        ...options
      },
      steps: {
        collection: { status: 'pending', startTime: null, endTime: null, result: null, error: null },
        verification: { status: 'pending', startTime: null, endTime: null, result: null, error: null },
        formatting: { status: 'pending', startTime: null, endTime: null, result: null, error: null }
      },
      metadata: {
        agentVersions: {
          collection: '1.0.0',
          verification: '1.0.0',
          formatting: '1.0.0',
          orchestrator: '1.0.0'
        }
      }
    };
  }

  /**
   * Execute collection step
   * @param {object} context - Workflow context
   * @returns {Promise<object>} - Updated context
   */
  async executeCollectionStep(context) {
    this.currentStep = 'collection';
    this.log(`Starting collection step for workflow ${context.workflowId}`);
    
    context.steps.collection.status = 'running';
    context.steps.collection.startTime = new Date().toISOString();
    
    try {
      const startTime = Date.now();
      
      const collectionResult = await this.collectionAgent.execute(context.input);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      context.steps.collection.result = collectionResult;
      context.steps.collection.status = 'completed';
      context.steps.collection.endTime = new Date().toISOString();
      context.steps.collection.processingTime = processingTime;
      
      // Update metrics
      this.metrics.stepPerformance.collection.count++;
      this.metrics.stepPerformance.collection.totalTime += processingTime;
      
      this.log(`Collection step completed in ${processingTime}ms`);
      return context;
      
    } catch (error) {
      context.steps.collection.status = 'failed';
      context.steps.collection.error = error.message;
      context.steps.collection.endTime = new Date().toISOString();
      
      this.handleError(error, 'collection', context.input);
    }
  }

  /**
   * Execute verification step
   * @param {object} context - Workflow context
   * @returns {Promise<object>} - Updated context
   */
  async executeVerificationStep(context) {
    this.currentStep = 'verification';
    this.log(`Starting verification step for workflow ${context.workflowId}`);
    
    context.steps.verification.status = 'running';
    context.steps.verification.startTime = new Date().toISOString();
    
    try {
      const startTime = Date.now();
      
      const collectionResult = context.steps.collection.result;
      if (!collectionResult) {
        throw new Error('No collection result available for verification');
      }
      
      const verificationResult = await this.verificationAgent.execute(collectionResult);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      context.steps.verification.result = verificationResult;
      context.steps.verification.status = 'completed';
      context.steps.verification.endTime = new Date().toISOString();
      context.steps.verification.processingTime = processingTime;
      
      // Update metrics
      this.metrics.stepPerformance.verification.count++;
      this.metrics.stepPerformance.verification.totalTime += processingTime;
      
      // Check if verification passed if strict mode is enabled
      if (context.options.strictVerification && !verificationResult.verificationReport.passed) {
        this.log('Verification failed in strict mode', 'warn');
        context.metadata.verificationWarning = 'Content failed strict verification checks';
      }
      
      this.log(`Verification step completed in ${processingTime}ms. Score: ${verificationResult.verificationReport.overallScore}`);
      return context;
      
    } catch (error) {
      context.steps.verification.status = 'failed';
      context.steps.verification.error = error.message;
      context.steps.verification.endTime = new Date().toISOString();
      
      this.handleError(error, 'verification', context.steps.collection.result);
    }
  }

  /**
   * Execute formatting step
   * @param {object} context - Workflow context
   * @returns {Promise<object>} - Updated context
   */
  async executeFormattingStep(context) {
    this.currentStep = 'formatting';
    this.log(`Starting formatting step for workflow ${context.workflowId}`);
    
    context.steps.formatting.status = 'running';
    context.steps.formatting.startTime = new Date().toISOString();
    
    try {
      const startTime = Date.now();
      
      const verificationResult = context.steps.verification.result;
      if (!verificationResult) {
        throw new Error('No verification result available for formatting');
      }
      
      const formattingResult = await this.formattingAgent.execute(
        verificationResult,
        context.options.outputFormat
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      context.steps.formatting.result = formattingResult;
      context.steps.formatting.status = 'completed';
      context.steps.formatting.endTime = new Date().toISOString();
      context.steps.formatting.processingTime = processingTime;
      
      // Update metrics
      this.metrics.stepPerformance.formatting.count++;
      this.metrics.stepPerformance.formatting.totalTime += processingTime;
      
      this.log(`Formatting step completed in ${processingTime}ms. Format: ${formattingResult.outputFormat}`);
      return context;
      
    } catch (error) {
      context.steps.formatting.status = 'failed';
      context.steps.formatting.error = error.message;
      context.steps.formatting.endTime = new Date().toISOString();
      
      this.handleError(error, 'formatting', context.steps.verification.result);
    }
  }

  /**
   * Prepare final response
   * @param {object} context - Workflow context
   * @returns {object} - Final response object
   */
  prepareFinalResponse(context) {
    const endTime = new Date().toISOString();
    const totalProcessingTime = Date.now() - new Date(context.startTime).getTime();
    
    const response = {
      workflowId: context.workflowId,
      success: true,
      output: context.steps.formatting.result.finalOutput,
      metadata: {
        ...context.metadata,
        processingTime: {
          total: totalProcessingTime,
          collection: context.steps.collection.processingTime || 0,
          verification: context.steps.verification.processingTime || 0,
          formatting: context.steps.formatting.processingTime || 0
        },
        outputFormat: context.steps.formatting.result.outputFormat,
        verificationScore: context.steps.verification.result?.verificationReport?.overallScore || 0,
        verificationPassed: context.steps.verification.result?.verificationReport?.passed || false,
        contentStats: context.steps.formatting.result?.formattingMetadata?.contentStats || {},
        startTime: context.startTime,
        endTime: endTime
      },
      workflow: {
        steps: context.steps,
        options: context.options
      }
    };
    
    // Add warnings if any
    const warnings = [];
    if (context.metadata.verificationWarning) {
      warnings.push(context.metadata.verificationWarning);
    }
    
    if (context.steps.verification.result?.verificationReport?.issues?.length > 0) {
      warnings.push(`${context.steps.verification.result.verificationReport.issues.length} verification issues detected`);
    }
    
    if (warnings.length > 0) {
      response.warnings = warnings;
    }
    
    // Include full workflow details if requested
    if (context.options.includeMetadata) {
      response.fullWorkflowData = {
        collectionResult: context.steps.collection.result,
        verificationResult: context.steps.verification.result,
        formattingResult: context.steps.formatting.result
      };
    }
    
    return response;
  }

  /**
   * Main run method - executes the complete workflow
   * @param {any} input - User input (typically a prompt string)
   * @param {object} options - Processing options
   * @returns {Promise<object>} - Final formatted response
   */
  async run(input, options = {}) {
    if (this.isRunning) {
      throw new Error('Orchestrator is already running. Please wait for the current workflow to complete.');
    }
    
    this.log('Starting new workflow execution');
    
    if (!this.validateInput(input)) {
      throw new Error('Invalid input provided to orchestrator');
    }
    
    this.isRunning = true;
    this.metrics.totalRuns++;
    
    let context = null;
    
    try {
      // Prepare workflow context
      context = this.prepareWorkflowContext(input, options);
      this.log(`Workflow ${context.workflowId} initialized`);
      
      // Execute workflow steps sequentially
      context = await this.executeCollectionStep(context);
      context = await this.executeVerificationStep(context);
      context = await this.executeFormattingStep(context);
      
      // Prepare final response
      const response = this.prepareFinalResponse(context);
      
      // Update success metrics
      this.metrics.successfulRuns++;
      this.updateAverageProcessingTime(
        context.steps.collection.processingTime +
        context.steps.verification.processingTime +
        context.steps.formatting.processingTime
      );
      
      // Store in history
      this.workflowHistory.push({
        workflowId: context.workflowId,
        success: true,
        processingTime: response.metadata.processingTime.total,
        outputFormat: response.metadata.outputFormat,
        verificationScore: response.metadata.verificationScore,
        timestamp: context.startTime
      });
      
      this.log(`Workflow ${context.workflowId} completed successfully in ${response.metadata.processingTime.total}ms`);
      return response;
      
    } catch (error) {
      this.log(`Workflow failed: ${error.message}`, 'error');
      
      // Store failed workflow in history
      if (context) {
        this.workflowHistory.push({
          workflowId: context.workflowId,
          success: false,
          error: error.message,
          failedAt: this.currentStep,
          timestamp: context.startTime
        });
      }
      
      throw error;
      
    } finally {
      this.isRunning = false;
      this.currentStep = null;
    }
  }

  /**
   * Update average processing time metric
   * @param {number} processingTime - Processing time for this run
   */
  updateAverageProcessingTime(processingTime) {
    const currentAverage = this.metrics.averageProcessingTime;
    const totalRuns = this.metrics.successfulRuns;
    
    this.metrics.averageProcessingTime = 
      ((currentAverage * (totalRuns - 1)) + processingTime) / totalRuns;
  }

  /**
   * Run workflow with retry logic
   * @param {any} input - Input data
   * @param {object} options - Processing options
   * @returns {Promise<object>} - Final response with retry information
   */
  async runWithRetry(input, options = {}) {
    const maxRetries = options.maxRetries || 2;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        this.log(`Attempt ${attempt}/${maxRetries + 1} for workflow execution`);
        const result = await this.run(input, { ...options, attempt });
        
        if (attempt > 1) {
          result.metadata.retryInfo = {
            totalAttempts: attempt,
            succeededOnAttempt: attempt
          };
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.log(`Attempt ${attempt} failed: ${error.message}`, 'warn');
        
        if (attempt <= maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          this.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw new Error(`Workflow failed after ${maxRetries + 1} attempts. Last error: ${lastError.message}`);
  }

  /**
   * Process multiple inputs in batch
   * @param {Array} inputs - Array of inputs to process
   * @param {object} options - Processing options
   * @returns {Promise<Array>} - Array of results
   */
  async batch(inputs, options = {}) {
    this.log(`Starting batch processing of ${inputs.length} inputs`);
    
    const results = [];
    const batchId = `batch_${Date.now()}`;
    const batchOptions = { ...options, batchId };
    
    for (let i = 0; i < inputs.length; i++) {
      try {
        this.log(`Processing batch item ${i + 1}/${inputs.length}`);
        const result = await this.run(inputs[i], { ...batchOptions, batchIndex: i });
        results.push({ index: i, success: true, result });
      } catch (error) {
        this.log(`Batch item ${i + 1} failed: ${error.message}`, 'error');
        results.push({ index: i, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    this.log(`Batch processing completed. ${successCount}/${inputs.length} successful`);
    
    return {
      batchId,
      total: inputs.length,
      successful: successCount,
      failed: inputs.length - successCount,
      results,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Get orchestrator status
   * @returns {object} - Current status and metrics
   */
  getStatus() {
    return {
      name: this.name,
      description: this.description,
      isRunning: this.isRunning,
      currentStep: this.currentStep,
      agents: {
        collection: this.collectionAgent.getStatus(),
        verification: this.verificationAgent.getStatus(),
        formatting: this.formattingAgent.getStatus()
      },
      metrics: {
        ...this.metrics,
        successRate: this.metrics.totalRuns > 0 ? 
          this.metrics.successfulRuns / this.metrics.totalRuns : 0,
        averageStepTimes: {
          collection: this.metrics.stepPerformance.collection.count > 0 ?
            this.metrics.stepPerformance.collection.totalTime / this.metrics.stepPerformance.collection.count : 0,
          verification: this.metrics.stepPerformance.verification.count > 0 ?
            this.metrics.stepPerformance.verification.totalTime / this.metrics.stepPerformance.verification.count : 0,
          formatting: this.metrics.stepPerformance.formatting.count > 0 ?
            this.metrics.stepPerformance.formatting.totalTime / this.metrics.stepPerformance.formatting.count : 0
        }
      },
      recentErrors: this.errors.slice(-5), // Last 5 errors
      workflowHistory: this.workflowHistory.slice(-10) // Last 10 workflows
    };
  }

  /**
   * Get available output formats from formatting agent
   * @returns {Array} - Available output formats
   */
  getAvailableFormats() {
    return this.formattingAgent.getAvailableFormats();
  }

  /**
   * Preview what the output would look like without full processing
   * @param {string} input - Input to preview
   * @param {string} format - Output format
   * @returns {string} - Preview of formatted output
   */
  async previewOutput(input, format = 'markdown') {
    // Create a simplified mock of what the output would look like
    const mockContent = {
      title: `Preview: ${input.substring(0, 50)}...`,
      summary: `This is a preview of how your request would be processed`,
      mainContent: `**Original Request:** ${input}\n\n**Processing:** This would be processed through collection, verification, and formatting steps.`,
      warnings: [],
      metadata: { verificationScore: 0.85, verificationPassed: true }
    };
    
    return this.formattingAgent.previewFormatting(mockContent, format);
  }

  /**
   * Clear workflow history and reset metrics
   */
  reset() {
    this.workflowHistory = [];
    this.errors = [];
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      averageProcessingTime: 0,
      stepPerformance: {
        collection: { count: 0, totalTime: 0 },
        verification: { count: 0, totalTime: 0 },
        formatting: { count: 0, totalTime: 0 }
      }
    };
    this.log('Orchestrator metrics and history reset');
  }

  /**
   * Configure agent settings
   * @param {string} agentName - Name of agent to configure
   * @param {object} config - Configuration options
   */
  configureAgent(agentName, config) {
    switch (agentName) {
      case 'collection':
        if (config.dataSources) {
          config.dataSources.forEach(source => {
            this.collectionAgent.addDataSource(source.type, source.config);
          });
        }
        break;
      case 'verification':
        if (config.rules) {
          config.rules.forEach(rule => {
            this.verificationAgent.addVerificationRule(rule.type, rule.function, rule.description);
          });
        }
        break;
      case 'formatting':
        if (config.rules) {
          config.rules.forEach(rule => {
            this.formattingAgent.addFormattingRule(rule.name, rule.function, rule.description);
          });
        }
        if (config.formats) {
          config.formats.forEach(format => {
            this.formattingAgent.addOutputFormat(format.name, format.config);
          });
        }
        break;
      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }
    
    this.log(`Configured agent: ${agentName}`);
  }
}