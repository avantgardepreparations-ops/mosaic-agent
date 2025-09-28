/**
 * Base Agent Class
 * Provides common functionality for all agents in the system
 */
export class BaseAgent {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.isProcessing = false;
    this.lastProcessedAt = null;
    this.errors = [];
  }

  /**
   * Process input data - to be implemented by derived classes
   * @param {any} input - Input data to process
   * @returns {Promise<any>} - Processed output
   */
  async process(input) {
    throw new Error('Process method must be implemented by derived class');
  }

  /**
   * Validate input data
   * @param {any} input - Input to validate
   * @returns {boolean} - True if valid
   */
  validateInput(input) {
    return input !== null && input !== undefined;
  }

  /**
   * Log agent activity
   * @param {string} message - Log message
   * @param {string} level - Log level (info, warn, error)
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`);
  }

  /**
   * Handle errors during processing
   * @param {Error} error - Error to handle
   * @param {any} input - Input that caused the error
   */
  handleError(error, input) {
    this.errors.push({
      error: error.message,
      input,
      timestamp: new Date().toISOString()
    });
    this.log(`Error processing input: ${error.message}`, 'error');
    throw error;
  }

  /**
   * Execute the agent processing with error handling
   * @param {any} input - Input data
   * @returns {Promise<any>} - Processed output
   */
  async execute(input) {
    if (!this.validateInput(input)) {
      throw new Error(`Invalid input provided to ${this.name}`);
    }

    this.isProcessing = true;
    this.log(`Starting processing...`);

    try {
      const result = await this.process(input);
      this.lastProcessedAt = new Date().toISOString();
      this.log(`Processing completed successfully`);
      return result;
    } catch (error) {
      this.handleError(error, input);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get agent status
   * @returns {object} - Agent status information
   */
  getStatus() {
    return {
      name: this.name,
      description: this.description,
      isProcessing: this.isProcessing,
      lastProcessedAt: this.lastProcessedAt,
      errorCount: this.errors.length
    };
  }
}