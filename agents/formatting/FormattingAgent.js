import { BaseAgent } from '../BaseAgent.js';

/**
 * Formatting Agent
 * Responsible for formatting synthesized responses according to predefined standards
 * Ensures output is clean, readable, and properly formatted for presentation
 */
export class FormattingAgent extends BaseAgent {
  constructor() {
    super('FormattingAgent', 'Formats responses according to predefined standards for clean presentation');
    this.formattingRules = new Map();
    this.outputFormats = new Map();
    this.formattingHistory = [];
    this.initializeDefaultFormats();
  }

  /**
   * Initialize default formatting rules and output formats
   */
  initializeDefaultFormats() {
    // Default output formats
    this.outputFormats.set('markdown', {
      name: 'Markdown',
      extension: 'md',
      formatter: this.formatAsMarkdown.bind(this),
      description: 'Clean markdown format with proper headers, lists, and code blocks'
    });

    this.outputFormats.set('plain', {
      name: 'Plain Text',
      extension: 'txt',
      formatter: this.formatAsPlainText.bind(this),
      description: 'Simple plain text format'
    });

    this.outputFormats.set('json', {
      name: 'JSON',
      extension: 'json',
      formatter: this.formatAsJSON.bind(this),
      description: 'Structured JSON format'
    });

    this.outputFormats.set('html', {
      name: 'HTML',
      extension: 'html',
      formatter: this.formatAsHTML.bind(this),
      description: 'HTML format with proper semantic markup'
    });

    // Default formatting rules
    this.formattingRules.set('citations', {
      name: 'Citation Formatting',
      rule: this.formatCitations.bind(this),
      description: 'Properly format citations and references'
    });

    this.formattingRules.set('code', {
      name: 'Code Formatting',
      rule: this.formatCodeBlocks.bind(this),
      description: 'Format code blocks with proper syntax highlighting hints'
    });

    this.formattingRules.set('lists', {
      name: 'List Formatting',
      rule: this.formatLists.bind(this),
      description: 'Format lists with consistent styling'
    });

    this.formattingRules.set('headers', {
      name: 'Header Formatting',
      rule: this.formatHeaders.bind(this),
      description: 'Format headers with appropriate hierarchy'
    });

    this.formattingRules.set('emphasis', {
      name: 'Emphasis Formatting',
      rule: this.formatEmphasis.bind(this),
      description: 'Apply consistent emphasis and highlighting'
    });

    this.log('Initialized default formatting rules and output formats');
  }

  /**
   * Add custom formatting rule
   * @param {string} ruleName - Name of the rule
   * @param {function} ruleFunction - Function that applies the formatting
   * @param {string} description - Description of what the rule does
   */
  addFormattingRule(ruleName, ruleFunction, description) {
    this.formattingRules.set(ruleName, {
      name: ruleName,
      rule: ruleFunction,
      description,
      addedAt: new Date().toISOString()
    });
    this.log(`Added custom formatting rule: ${ruleName}`);
  }

  /**
   * Add custom output format
   * @param {string} formatName - Name of the format
   * @param {object} formatConfig - Configuration object with formatter function
   */
  addOutputFormat(formatName, formatConfig) {
    this.outputFormats.set(formatName, {
      ...formatConfig,
      addedAt: new Date().toISOString()
    });
    this.log(`Added custom output format: ${formatName}`);
  }

  /**
   * Extract and structure content from verified data
   * @param {object} verifiedData - Data from VerificationAgent
   * @returns {object} - Structured content ready for formatting
   */
  extractContent(verifiedData) {
    const content = {
      title: '',
      summary: '',
      mainContent: '',
      codeBlocks: [],
      citations: [],
      metadata: {},
      warnings: [],
      sourceInfo: {}
    };

    // Extract main content from the verified data
    if (verifiedData.filteredData || verifiedData.originalData) {
      const data = verifiedData.filteredData || verifiedData.originalData;
      
      // Extract summary
      if (data.summary) {
        content.summary = this.extractSummary(data.summary);
      }

      // Extract main content from prompt analysis
      if (data.aggregatedContent && data.aggregatedContent.prompt) {
        const prompt = data.aggregatedContent.prompt;
        content.title = this.generateTitle(prompt.originalPrompt, prompt.intent);
        content.mainContent = this.generateMainContent(data);
      }

      // Extract source information
      if (data.sources) {
        content.sourceInfo = this.extractSourceInfo(data.sources);
      }

      // Extract verification warnings
      if (verifiedData.verificationReport) {
        content.warnings = this.extractWarnings(verifiedData.verificationReport);
        content.metadata.verificationScore = verifiedData.verificationReport.overallScore;
        content.metadata.verificationPassed = verifiedData.verificationReport.passed;
      }

      // Look for code patterns in the content
      content.codeBlocks = this.extractCodeBlocks(JSON.stringify(data));
      
      // Extract citation information
      content.citations = this.extractCitations(data);
    }

    content.metadata.extractedAt = new Date().toISOString();
    content.metadata.contentLength = content.mainContent.length;

    return content;
  }

  /**
   * Extract summary from data
   * @param {object} summary - Summary object
   * @returns {string} - Formatted summary text
   */
  extractSummary(summary) {
    const parts = [];
    
    if (summary.primaryContent) {
      parts.push(`Request: ${summary.primaryContent}`);
    }
    
    if (summary.complexity) {
      parts.push(`Complexity: ${summary.complexity}`);
    }
    
    if (summary.totalSources) {
      parts.push(`Sources analyzed: ${summary.totalSources}`);
    }

    return parts.join(' | ');
  }

  /**
   * Generate title from prompt and intent
   * @param {string} prompt - Original prompt
   * @param {string} intent - Detected intent
   * @returns {string} - Generated title
   */
  generateTitle(prompt, intent) {
    const maxLength = 60;
    let title = prompt.length > maxLength ? 
      prompt.substring(0, maxLength) + '...' : prompt;
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // Add intent prefix if helpful
    const intentPrefixes = {
      'question': 'Q: ',
      'command': 'Task: ',
      'analysis': 'Analysis: ',
      'request': 'Request: '
    };
    
    if (intentPrefixes[intent] && !title.startsWith(intentPrefixes[intent])) {
      title = intentPrefixes[intent] + title;
    }
    
    return title;
  }

  /**
   * Generate main content from collected data
   * @param {object} data - Collected data
   * @returns {string} - Generated main content
   */
  generateMainContent(data) {
    const sections = [];
    
    // Add prompt analysis
    if (data.aggregatedContent && data.aggregatedContent.prompt) {
      const prompt = data.aggregatedContent.prompt;
      sections.push(`**Original Request:** ${prompt.originalPrompt}`);
      
      if (prompt.keywords && prompt.keywords.length > 0) {
        sections.push(`**Key Terms:** ${prompt.keywords.join(', ')}`);
      }
      
      if (prompt.requiredSources && prompt.requiredSources.length > 0) {
        sections.push(`**Information Sources Needed:** ${prompt.requiredSources.join(', ')}`);
      }
    }
    
    // Add collected data summary
    if (data.sources && data.sources.length > 0) {
      sections.push(`**Data Sources Processed:** ${data.sources.length} sources analyzed`);
      
      const sourceTypes = [...new Set(data.sources.map(s => s.type))];
      sections.push(`**Source Types:** ${sourceTypes.join(', ')}`);
    }
    
    // Add processing recommendations
    if (data.summary && data.summary.requiredProcessing) {
      sections.push(`**Processing Applied:** ${data.summary.requiredProcessing.join(', ')}`);
    }
    
    return sections.join('\n\n');
  }

  /**
   * Extract source information
   * @param {Array} sources - Source array
   * @returns {object} - Structured source information
   */
  extractSourceInfo(sources) {
    return {
      total: sources.length,
      types: [...new Set(sources.map(s => s.type))],
      details: sources.map(source => ({
        type: source.type,
        timestamp: source.data ? source.data.timestamp : 'unknown',
        status: source.data ? source.data.status : 'processed'
      }))
    };
  }

  /**
   * Extract warnings from verification report
   * @param {object} verificationReport - Verification report
   * @returns {Array} - Array of warning messages
   */
  extractWarnings(verificationReport) {
    const warnings = [];
    
    if (!verificationReport.passed) {
      warnings.push('⚠️ This response did not pass all verification checks');
    }
    
    if (verificationReport.overallScore < 0.5) {
      warnings.push('⚠️ Low confidence in response accuracy');
    }
    
    if (verificationReport.issues && verificationReport.issues.length > 0) {
      warnings.push(`⚠️ ${verificationReport.issues.length} verification issues detected`);
    }
    
    return warnings;
  }

  /**
   * Extract code blocks from content
   * @param {string} content - Content to search
   * @returns {Array} - Array of code blocks with metadata
   */
  extractCodeBlocks(content) {
    const codeBlocks = [];
    
    // Look for common code patterns
    const patterns = [
      { language: 'javascript', pattern: /function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g },
      { language: 'python', pattern: /def\s+\w+\s*\([^)]*\):[^:]*:/g },
      { language: 'shell', pattern: /(?:npm|pip|brew|curl|git)\s+[^\n]+/g },
      { language: 'json', pattern: /{\s*"[^"]+"\s*:[^}]+}/g }
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern.pattern) || [];
      for (const match of matches) {
        codeBlocks.push({
          language: pattern.language,
          code: match.trim(),
          length: match.length
        });
      }
    }
    
    return codeBlocks;
  }

  /**
   * Extract citations from data
   * @param {object} data - Data to search for citations
   * @returns {Array} - Array of citations
   */
  extractCitations(data) {
    const citations = [];
    
    if (data.sources) {
      data.sources.forEach((source, index) => {
        citations.push({
          id: index + 1,
          type: source.type,
          timestamp: source.data ? source.data.timestamp : new Date().toISOString(),
          description: `Data collected from ${source.type}`
        });
      });
    }
    
    return citations;
  }

  /**
   * Apply all formatting rules to content
   * @param {object} content - Structured content
   * @returns {object} - Content with formatting rules applied
   */
  applyFormattingRules(content) {
    let formattedContent = JSON.parse(JSON.stringify(content)); // Deep copy
    
    this.log('Applying formatting rules to content');
    
    for (const [ruleName, rule] of this.formattingRules) {
      try {
        formattedContent = rule.rule(formattedContent);
        this.log(`Applied formatting rule: ${ruleName}`);
      } catch (error) {
        this.log(`Error applying formatting rule ${ruleName}: ${error.message}`, 'warn');
      }
    }
    
    return formattedContent;
  }

  /**
   * Format citations
   * @param {object} content - Content with citations
   * @returns {object} - Content with formatted citations
   */
  formatCitations(content) {
    if (content.citations && content.citations.length > 0) {
      content.formattedCitations = content.citations.map(citation => 
        `[${citation.id}] ${citation.description} (${citation.type}, ${citation.timestamp})`
      );
    }
    return content;
  }

  /**
   * Format code blocks
   * @param {object} content - Content with code blocks
   * @returns {object} - Content with formatted code blocks
   */
  formatCodeBlocks(content) {
    if (content.codeBlocks && content.codeBlocks.length > 0) {
      content.formattedCodeBlocks = content.codeBlocks.map(block => ({
        ...block,
        formatted: `\`\`\`${block.language}\n${block.code}\n\`\`\``
      }));
    }
    return content;
  }

  /**
   * Format lists in content
   * @param {object} content - Content to format
   * @returns {object} - Content with formatted lists
   */
  formatLists(content) {
    // Format warnings as a proper list
    if (content.warnings && content.warnings.length > 0) {
      content.formattedWarnings = content.warnings.map(warning => `• ${warning}`);
    }
    
    // Format source types as a list
    if (content.sourceInfo && content.sourceInfo.types) {
      content.sourceInfo.formattedTypes = content.sourceInfo.types.map(type => `• ${type}`);
    }
    
    return content;
  }

  /**
   * Format headers in content
   * @param {object} content - Content to format
   * @returns {object} - Content with formatted headers
   */
  formatHeaders(content) {
    // Ensure title is properly formatted
    if (content.title && !content.title.match(/^#+\s/)) {
      content.formattedTitle = `# ${content.title}`;
    } else {
      content.formattedTitle = content.title;
    }
    
    return content;
  }

  /**
   * Format emphasis in content
   * @param {object} content - Content to format
   * @returns {object} - Content with formatted emphasis
   */
  formatEmphasis(content) {
    // Emphasize verification warnings
    if (content.warnings && content.warnings.length > 0) {
      content.emphasizedWarnings = content.warnings.map(warning => `**${warning}**`);
    }
    
    return content;
  }

  /**
   * Format content as Markdown
   * @param {object} content - Structured content
   * @returns {string} - Markdown formatted output
   */
  formatAsMarkdown(content) {
    const sections = [];
    
    // Title
    if (content.formattedTitle || content.title) {
      sections.push(content.formattedTitle || `# ${content.title}`);
    }
    
    // Summary
    if (content.summary) {
      sections.push(`## Summary\n${content.summary}`);
    }
    
    // Warnings
    if (content.emphasizedWarnings && content.emphasizedWarnings.length > 0) {
      sections.push(`## ⚠️ Important Notices\n${content.emphasizedWarnings.join('\n')}`);
    }
    
    // Main content
    if (content.mainContent) {
      sections.push(`## Content\n${content.mainContent}`);
    }
    
    // Code blocks
    if (content.formattedCodeBlocks && content.formattedCodeBlocks.length > 0) {
      sections.push(`## Code Examples\n${content.formattedCodeBlocks.map(block => block.formatted).join('\n\n')}`);
    }
    
    // Citations
    if (content.formattedCitations && content.formattedCitations.length > 0) {
      sections.push(`## Sources\n${content.formattedCitations.join('\n')}`);
    }
    
    // Metadata
    if (content.metadata) {
      const metadataLines = [];
      if (content.metadata.verificationScore !== undefined) {
        metadataLines.push(`**Verification Score:** ${(content.metadata.verificationScore * 100).toFixed(1)}%`);
      }
      if (content.metadata.verificationPassed !== undefined) {
        metadataLines.push(`**Verification Status:** ${content.metadata.verificationPassed ? '✅ Passed' : '❌ Failed'}`);
      }
      if (metadataLines.length > 0) {
        sections.push(`## Quality Information\n${metadataLines.join('\n')}`);
      }
    }
    
    return sections.join('\n\n');
  }

  /**
   * Format content as plain text
   * @param {object} content - Structured content
   * @returns {string} - Plain text formatted output
   */
  formatAsPlainText(content) {
    const sections = [];
    
    // Title
    if (content.title) {
      sections.push(content.title.toUpperCase());
      sections.push('='.repeat(content.title.length));
    }
    
    // Summary
    if (content.summary) {
      sections.push(`SUMMARY: ${content.summary}`);
    }
    
    // Warnings
    if (content.warnings && content.warnings.length > 0) {
      sections.push('IMPORTANT NOTICES:');
      sections.push(content.warnings.join('\n'));
    }
    
    // Main content
    if (content.mainContent) {
      sections.push('CONTENT:');
      sections.push(content.mainContent.replace(/\*\*/g, '').replace(/\*/g, ''));
    }
    
    // Code blocks
    if (content.codeBlocks && content.codeBlocks.length > 0) {
      sections.push('CODE EXAMPLES:');
      content.codeBlocks.forEach((block, index) => {
        sections.push(`${index + 1}. ${block.language.toUpperCase()}:`);
        sections.push(block.code);
      });
    }
    
    // Citations
    if (content.citations && content.citations.length > 0) {
      sections.push('SOURCES:');
      content.citations.forEach(citation => {
        sections.push(`${citation.id}. ${citation.description}`);
      });
    }
    
    return sections.join('\n\n');
  }

  /**
   * Format content as JSON
   * @param {object} content - Structured content
   * @returns {string} - JSON formatted output
   */
  formatAsJSON(content) {
    const jsonOutput = {
      title: content.title,
      summary: content.summary,
      content: content.mainContent,
      warnings: content.warnings || [],
      codeBlocks: content.codeBlocks || [],
      citations: content.citations || [],
      metadata: content.metadata || {},
      sourceInfo: content.sourceInfo || {},
      generatedAt: new Date().toISOString()
    };
    
    return JSON.stringify(jsonOutput, null, 2);
  }

  /**
   * Format content as HTML
   * @param {object} content - Structured content
   * @returns {string} - HTML formatted output
   */
  formatAsHTML(content) {
    const sections = [];
    
    sections.push('<!DOCTYPE html>');
    sections.push('<html lang="en">');
    sections.push('<head>');
    sections.push('<meta charset="UTF-8">');
    sections.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    sections.push(`<title>${content.title || 'Mosaic Agent Response'}</title>`);
    sections.push('<style>');
    sections.push('body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }');
    sections.push('h1 { color: #333; border-bottom: 2px solid #007acc; }');
    sections.push('h2 { color: #555; margin-top: 30px; }');
    sections.push('.warning { background-color: #fff3cd; border: 1px solid #ffeeba; padding: 10px; border-radius: 5px; }');
    sections.push('pre { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; overflow-x: auto; }');
    sections.push('.metadata { font-size: 0.9em; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }');
    sections.push('</style>');
    sections.push('</head>');
    sections.push('<body>');
    
    // Title
    if (content.title) {
      sections.push(`<h1>${this.escapeHtml(content.title)}</h1>`);
    }
    
    // Summary
    if (content.summary) {
      sections.push(`<h2>Summary</h2>`);
      sections.push(`<p>${this.escapeHtml(content.summary)}</p>`);
    }
    
    // Warnings
    if (content.warnings && content.warnings.length > 0) {
      sections.push(`<h2>⚠️ Important Notices</h2>`);
      sections.push(`<div class="warning">`);
      content.warnings.forEach(warning => {
        sections.push(`<p>${this.escapeHtml(warning)}</p>`);
      });
      sections.push('</div>');
    }
    
    // Main content
    if (content.mainContent) {
      sections.push(`<h2>Content</h2>`);
      sections.push(`<div>${this.convertMarkdownToHtml(content.mainContent)}</div>`);
    }
    
    // Code blocks
    if (content.codeBlocks && content.codeBlocks.length > 0) {
      sections.push(`<h2>Code Examples</h2>`);
      content.codeBlocks.forEach((block, index) => {
        sections.push(`<h3>${block.language.toUpperCase()} Example ${index + 1}</h3>`);
        sections.push(`<pre><code>${this.escapeHtml(block.code)}</code></pre>`);
      });
    }
    
    // Citations
    if (content.citations && content.citations.length > 0) {
      sections.push(`<h2>Sources</h2>`);
      sections.push('<ol>');
      content.citations.forEach(citation => {
        sections.push(`<li>${this.escapeHtml(citation.description)} (${citation.type})</li>`);
      });
      sections.push('</ol>');
    }
    
    // Metadata
    if (content.metadata) {
      sections.push('<div class="metadata">');
      sections.push('<h3>Quality Information</h3>');
      if (content.metadata.verificationScore !== undefined) {
        sections.push(`<p><strong>Verification Score:</strong> ${(content.metadata.verificationScore * 100).toFixed(1)}%</p>`);
      }
      if (content.metadata.verificationPassed !== undefined) {
        const status = content.metadata.verificationPassed ? '✅ Passed' : '❌ Failed';
        sections.push(`<p><strong>Verification Status:</strong> ${status}</p>`);
      }
      sections.push(`<p><small>Generated at: ${new Date().toISOString()}</small></p>`);
      sections.push('</div>');
    }
    
    sections.push('</body>');
    sections.push('</html>');
    
    return sections.join('\n');
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const div = { innerHTML: text };
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Convert simple markdown to HTML
   * @param {string} markdown - Markdown text
   * @returns {string} - HTML text
   */
  convertMarkdownToHtml(markdown) {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }

  /**
   * Determine best output format based on content and requirements
   * @param {object} content - Structured content
   * @param {string} preferredFormat - Preferred format (optional)
   * @returns {string} - Recommended format name
   */
  determineOutputFormat(content, preferredFormat = null) {
    if (preferredFormat) {
      if (this.outputFormats.has(preferredFormat)) {
        return preferredFormat;
      } else {
        // If a specific format was requested but doesn't exist, throw an error
        const availableFormats = Array.from(this.outputFormats.keys()).join(', ');
        throw new Error(`Invalid output format '${preferredFormat}'. Available formats: ${availableFormats}`);
      }
    }
    
    // Determine best format based on content characteristics
    if (content.codeBlocks && content.codeBlocks.length > 0) {
      return 'markdown'; // Markdown handles code blocks well
    }
    
    if (content.warnings && content.warnings.length > 0) {
      return 'html'; // HTML can style warnings nicely
    }
    
    if (content.metadata && Object.keys(content.metadata).length > 3) {
      return 'json'; // JSON for metadata-heavy content
    }
    
    return 'markdown'; // Default to markdown
  }

  /**
   * Override execute method to support outputFormat parameter
   * @param {any} input - Input data
   * @param {string} outputFormat - Optional output format
   * @returns {Promise<any>} - Processed output
   */
  async execute(input, outputFormat = null) {
    if (!this.validateInput(input)) {
      throw new Error(`Invalid input provided to ${this.name}`);
    }

    this.isProcessing = true;
    this.log(`Starting processing...`);

    try {
      const result = await this.process(input, outputFormat);
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
   * Main process method - formats verified data into final presentation
   * @param {object} input - Verified data from VerificationAgent
   * @param {string} outputFormat - Desired output format (optional)
   * @returns {Promise<object>} - Formatted output ready for presentation
   */
  async process(input, outputFormat = null) {
    this.log('Starting formatting process');
    
    const formattingResult = {
      originalInput: input,
      extractedContent: null,
      formattedContent: null,
      outputFormat: null,
      finalOutput: '',
      formattingMetadata: {
        timestamp: new Date().toISOString(),
        rulesApplied: [],
        outputFormat: null,
        contentStats: {}
      }
    };

    try {
      // Step 1: Extract and structure content
      this.log('Extracting content structure');
      formattingResult.extractedContent = this.extractContent(input);
      
      // Step 2: Apply formatting rules
      this.log('Applying formatting rules');
      formattingResult.formattedContent = this.applyFormattingRules(formattingResult.extractedContent);
      
      // Track which rules were applied
      formattingResult.formattingMetadata.rulesApplied = Array.from(this.formattingRules.keys());
      
      // Step 3: Determine output format
      const selectedFormat = this.determineOutputFormat(formattingResult.formattedContent, outputFormat);
      formattingResult.outputFormat = selectedFormat;
      formattingResult.formattingMetadata.outputFormat = selectedFormat;
      
      // Step 4: Apply output format
      this.log(`Formatting output as ${selectedFormat}`);
      const formatConfig = this.outputFormats.get(selectedFormat);
      if (!formatConfig) {
        throw new Error(`Unknown output format: ${selectedFormat}`);
      }
      
      formattingResult.finalOutput = formatConfig.formatter(formattingResult.formattedContent);
      
      // Step 5: Calculate content statistics
      formattingResult.formattingMetadata.contentStats = {
        outputLength: formattingResult.finalOutput.length,
        codeBlocksCount: formattingResult.formattedContent.codeBlocks ? formattingResult.formattedContent.codeBlocks.length : 0,
        citationsCount: formattingResult.formattedContent.citations ? formattingResult.formattedContent.citations.length : 0,
        warningsCount: formattingResult.formattedContent.warnings ? formattingResult.formattedContent.warnings.length : 0,
        hasTitle: !!formattingResult.formattedContent.title,
        hasSummary: !!formattingResult.formattedContent.summary
      };
      
      this.log(`Formatting completed. Output format: ${selectedFormat}, Length: ${formattingResult.finalOutput.length} characters`);
      
      // Store in history
      this.formattingHistory.push({
        timestamp: new Date().toISOString(),
        outputFormat: selectedFormat,
        outputLength: formattingResult.finalOutput.length,
        rulesApplied: formattingResult.formattingMetadata.rulesApplied.length,
        contentStats: formattingResult.formattingMetadata.contentStats
      });
      
      return formattingResult;

    } catch (error) {
      this.log(`Error during formatting: ${error.message}`, 'error');
      throw new Error(`Formatting failed: ${error.message}`);
    }
  }

  /**
   * Get available output formats
   * @returns {Array} - List of available formats
   */
  getAvailableFormats() {
    return Array.from(this.outputFormats.entries()).map(([key, config]) => ({
      name: key,
      description: config.description,
      extension: config.extension
    }));
  }

  /**
   * Get formatting statistics
   * @returns {object} - Formatting statistics
   */
  getFormattingStats() {
    return {
      totalFormattings: this.formattingHistory.length,
      formatUsage: this.formattingHistory.reduce((acc, entry) => {
        acc[entry.outputFormat] = (acc[entry.outputFormat] || 0) + 1;
        return acc;
      }, {}),
      averageOutputLength: this.formattingHistory.length > 0 ?
        this.formattingHistory.reduce((sum, entry) => sum + entry.outputLength, 0) / this.formattingHistory.length : 0,
      rulesConfigured: this.formattingRules.size,
      formatsAvailable: this.outputFormats.size
    };
  }

  /**
   * Preview formatting without full processing
   * @param {object} content - Content to preview
   * @param {string} format - Format to preview
   * @returns {string} - Preview of formatted output (truncated)
   */
  previewFormatting(content, format = 'markdown') {
    const formatConfig = this.outputFormats.get(format);
    if (!formatConfig) {
      return 'Format not available';
    }
    
    const fullOutput = formatConfig.formatter(content);
    const previewLength = 200;
    
    return fullOutput.length > previewLength ?
      fullOutput.substring(0, previewLength) + '...' :
      fullOutput;
  }
}