import { BaseAgent } from '../BaseAgent.js';

/**
 * Verification Agent
 * Responsible for verifying the factualness, consistency, and relevance of collected data
 * Filters and corrects incorrect information before passing to formatting
 */
export class VerificationAgent extends BaseAgent {
  constructor() {
    super('VerificationAgent', 'Verifies factualness, consistency, and relevance of information');
    this.verificationRules = [];
    this.externalSources = [];
    this.verificationHistory = [];
  }

  /**
   * Add verification rules
   * @param {string} ruleType - Type of rule (factual, consistency, relevance, etc.)
   * @param {function} ruleFn - Function that returns true if data passes the rule
   * @param {string} description - Description of what the rule checks
   */
  addVerificationRule(ruleType, ruleFn, description) {
    this.verificationRules.push({
      type: ruleType,
      rule: ruleFn,
      description,
      addedAt: new Date().toISOString()
    });
    this.log(`Added verification rule: ${ruleType} - ${description}`);
  }

  /**
   * Add external source for fact-checking
   * @param {string} sourceName - Name of the external source
   * @param {function} checkFn - Function to check facts against this source
   */
  addExternalSource(sourceName, checkFn) {
    this.externalSources.push({
      name: sourceName,
      checkFunction: checkFn,
      addedAt: new Date().toISOString()
    });
    this.log(`Added external verification source: ${sourceName}`);
  }

  /**
   * Verify factual accuracy of the data
   * @param {object} data - Data to verify
   * @returns {Promise<object>} - Verification results for factual accuracy
   */
  async verifyFactualAccuracy(data) {
    this.log('Starting factual accuracy verification');
    
    const factualResults = {
      score: 0,
      issues: [],
      corrections: [],
      sources_checked: []
    };

    // Check against known fact patterns
    const factChecks = [
      {
        name: 'date_consistency',
        check: (data) => this.verifyDateConsistency(data),
        weight: 0.2
      },
      {
        name: 'numerical_accuracy',
        check: (data) => this.verifyNumericalAccuracy(data),
        weight: 0.3
      },
      {
        name: 'logical_consistency',
        check: (data) => this.verifyLogicalConsistency(data),
        weight: 0.3
      },
      {
        name: 'source_credibility',
        check: (data) => this.verifySourceCredibility(data),
        weight: 0.2
      }
    ];

    let totalScore = 0;
    for (const factCheck of factChecks) {
      try {
        const result = await factCheck.check(data);
        const weightedScore = result.score * factCheck.weight;
        totalScore += weightedScore;
        
        factualResults.sources_checked.push({
          name: factCheck.name,
          score: result.score,
          weight: factCheck.weight,
          weighted_score: weightedScore,
          issues: result.issues || [],
          corrections: result.corrections || []
        });

        // Aggregate issues and corrections
        factualResults.issues.push(...(result.issues || []));
        factualResults.corrections.push(...(result.corrections || []));
      } catch (error) {
        this.log(`Error in fact check ${factCheck.name}: ${error.message}`, 'warn');
        factualResults.issues.push(`Failed to verify ${factCheck.name}: ${error.message}`);
      }
    }

    factualResults.score = Math.min(1.0, Math.max(0.0, totalScore));
    this.log(`Factual accuracy verification completed. Score: ${factualResults.score}`);
    
    return factualResults;
  }

  /**
   * Verify date consistency in the data
   * @param {object} data - Data to check
   * @returns {object} - Verification result
   */
  verifyDateConsistency(data) {
    const issues = [];
    const corrections = [];
    let score = 1.0;

    // Check if dates are reasonable and consistent
    const dateRegex = /\b\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;
    const dataStr = JSON.stringify(data);
    const dates = dataStr.match(dateRegex) || [];

    for (const dateStr of dates) {
      const year = parseInt(dateStr.includes('/') ? dateStr.split('/')[2] : dateStr);
      const currentYear = new Date().getFullYear();
      
      if (year > currentYear + 1) {
        issues.push(`Future date detected: ${dateStr}`);
        corrections.push(`Consider verifying the date ${dateStr} as it's in the future`);
        score -= 0.2;
      } else if (year < 1900) {
        issues.push(`Very old date detected: ${dateStr}`);
        score -= 0.1;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      corrections,
      datesFound: dates.length
    };
  }

  /**
   * Verify numerical accuracy and reasonableness
   * @param {object} data - Data to check
   * @returns {object} - Verification result
   */
  verifyNumericalAccuracy(data) {
    const issues = [];
    const corrections = [];
    let score = 1.0;

    // Check for reasonable numerical values
    const numberRegex = /\b\d+(?:\.\d+)?\b/g;
    const dataStr = JSON.stringify(data);
    const numbers = dataStr.match(numberRegex) || [];

    for (const numberStr of numbers) {
      const number = parseFloat(numberStr);
      
      // Check for suspiciously large numbers (potential errors)
      if (number > 1e12) {
        issues.push(`Suspiciously large number: ${numberStr}`);
        corrections.push(`Verify if ${numberStr} is accurate - it's unusually large`);
        score -= 0.1;
      }
      
      // Check for impossible percentages
      if (dataStr.includes(numberStr + '%') && (number > 100 || number < 0)) {
        issues.push(`Invalid percentage: ${numberStr}%`);
        corrections.push(`Percentage ${numberStr}% is outside valid range (0-100%)`);
        score -= 0.3;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      corrections,
      numbersFound: numbers.length
    };
  }

  /**
   * Verify logical consistency in the data
   * @param {object} data - Data to check
   * @returns {object} - Verification result
   */
  verifyLogicalConsistency(data) {
    const issues = [];
    const corrections = [];
    let score = 1.0;

    // Check for logical contradictions in the text
    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Common contradiction patterns
    const contradictions = [
      { pattern: ['always', 'never'], severity: 0.2 },
      { pattern: ['all', 'none'], severity: 0.2 },
      { pattern: ['increase', 'decrease'], severity: 0.1 },
      { pattern: ['possible', 'impossible'], severity: 0.3 }
    ];

    for (const contradiction of contradictions) {
      const hasFirst = contradiction.pattern[0] && dataStr.includes(contradiction.pattern[0]);
      const hasSecond = contradiction.pattern[1] && dataStr.includes(contradiction.pattern[1]);
      
      if (hasFirst && hasSecond) {
        issues.push(`Potential contradiction: contains both "${contradiction.pattern[0]}" and "${contradiction.pattern[1]}"`);
        corrections.push(`Review context for "${contradiction.pattern[0]}" and "${contradiction.pattern[1]}" to ensure they're not contradictory`);
        score -= contradiction.severity;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      corrections
    };
  }

  /**
   * Verify source credibility
   * @param {object} data - Data to check
   * @returns {object} - Verification result
   */
  verifySourceCredibility(data) {
    const issues = [];
    const corrections = [];
    let score = 0.8; // Base score for unknown sources

    // Check if sources are mentioned
    if (data.sources && data.sources.length > 0) {
      score = 0.9; // Higher score if sources are provided
      
      for (const source of data.sources) {
        if (source.type === 'user_prompt') {
          // User input has lower credibility for facts but high for requirements
          score = Math.max(score, 0.7);
        } else if (source.type === 'api' || source.type === 'database') {
          // API/database sources are generally more credible
          score = Math.max(score, 0.95);
        }
      }
    } else {
      issues.push('No sources provided for verification');
      corrections.push('Consider adding source information to improve credibility');
    }

    return {
      score,
      issues,
      corrections,
      sourcesAvailable: data.sources ? data.sources.length : 0
    };
  }

  /**
   * Verify consistency across different parts of the data
   * @param {object} data - Data to verify
   * @returns {Promise<object>} - Consistency verification results
   */
  async verifyConsistency(data) {
    this.log('Starting consistency verification');
    
    const consistencyResults = {
      score: 0,
      issues: [],
      corrections: [],
      checks_performed: []
    };

    // Check internal consistency
    const checks = [
      {
        name: 'terminology_consistency',
        check: () => this.checkTerminologyConsistency(data)
      },
      {
        name: 'format_consistency',
        check: () => this.checkFormatConsistency(data)
      },
      {
        name: 'temporal_consistency',
        check: () => this.checkTemporalConsistency(data)
      }
    ];

    let totalScore = 0;
    for (const check of checks) {
      try {
        const result = await check.check();
        totalScore += result.score;
        
        consistencyResults.checks_performed.push({
          name: check.name,
          score: result.score,
          issues: result.issues || [],
          corrections: result.corrections || []
        });
        
        consistencyResults.issues.push(...(result.issues || []));
        consistencyResults.corrections.push(...(result.corrections || []));
      } catch (error) {
        this.log(`Error in consistency check ${check.name}: ${error.message}`, 'warn');
        consistencyResults.issues.push(`Failed consistency check ${check.name}: ${error.message}`);
      }
    }

    consistencyResults.score = checks.length > 0 ? totalScore / checks.length : 0;
    this.log(`Consistency verification completed. Score: ${consistencyResults.score}`);
    
    return consistencyResults;
  }

  /**
   * Check terminology consistency
   * @param {object} data - Data to check
   * @returns {object} - Check result
   */
  checkTerminologyConsistency(data) {
    const issues = [];
    const corrections = [];
    let score = 1.0;

    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Check for consistent terminology (simple heuristic)
    const terms = dataStr.match(/\b\w{4,}\b/g) || [];
    const termCounts = {};
    
    for (const term of terms) {
      termCounts[term] = (termCounts[term] || 0) + 1;
    }

    // Look for potential inconsistencies (similar terms used infrequently)
    const significantTerms = Object.entries(termCounts).filter(([term, count]) => count > 1);
    
    // This is a simplified check - in practice, you'd use more sophisticated NLP
    if (significantTerms.length < terms.length * 0.1) {
      issues.push('Low terminology consistency - many terms used only once');
      corrections.push('Consider using consistent terminology throughout the content');
      score -= 0.2;
    }

    return { score: Math.max(0, score), issues, corrections };
  }

  /**
   * Check format consistency
   * @param {object} data - Data to check
   * @returns {object} - Check result
   */
  checkFormatConsistency(data) {
    let score = 1.0;
    const issues = [];
    const corrections = [];

    // Check if data structure is consistent
    if (data.sources && Array.isArray(data.sources)) {
      const sourceTypes = data.sources.map(s => typeof s);
      const uniqueTypes = [...new Set(sourceTypes)];
      
      if (uniqueTypes.length > 1) {
        issues.push('Inconsistent source data types detected');
        corrections.push('Standardize source data format across all sources');
        score -= 0.3;
      }
    }

    return { score: Math.max(0, score), issues, corrections };
  }

  /**
   * Check temporal consistency
   * @param {object} data - Data to check
   * @returns {object} - Check result
   */
  checkTemporalConsistency(data) {
    let score = 1.0;
    const issues = [];
    const corrections = [];

    // Check if timestamps are in logical order
    const timestamps = [];
    
    const extractTimestamps = (obj) => {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.timestamp) timestamps.push(new Date(obj.timestamp));
        if (obj.addedAt) timestamps.push(new Date(obj.addedAt));
        
        for (const value of Object.values(obj)) {
          if (typeof value === 'object') {
            extractTimestamps(value);
          }
        }
      }
    };
    
    extractTimestamps(data);
    
    // Check if timestamps are reasonable
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] < timestamps[i-1]) {
        issues.push('Timestamps not in chronological order');
        corrections.push('Ensure timestamps reflect actual sequence of events');
        score -= 0.2;
        break;
      }
    }

    return { score: Math.max(0, score), issues, corrections };
  }

  /**
   * Verify relevance of the data to the original request
   * @param {object} data - Data to verify
   * @returns {Promise<object>} - Relevance verification results
   */
  async verifyRelevance(data) {
    this.log('Starting relevance verification');
    
    const relevanceResults = {
      score: 0,
      issues: [],
      corrections: [],
      relevance_factors: []
    };

    // Check if data addresses the original prompt
    if (data.aggregatedContent && data.aggregatedContent.prompt) {
      const prompt = data.aggregatedContent.prompt;
      const factors = [
        {
          name: 'keyword_overlap',
          score: this.calculateKeywordOverlap(data, prompt.keywords || []),
          weight: 0.4
        },
        {
          name: 'intent_alignment',
          score: this.calculateIntentAlignment(data, prompt.intent || 'general'),
          weight: 0.3
        },
        {
          name: 'complexity_match',
          score: this.calculateComplexityMatch(data, prompt.complexity || 'medium'),
          weight: 0.3
        }
      ];

      let totalScore = 0;
      for (const factor of factors) {
        totalScore += factor.score * factor.weight;
        relevanceResults.relevance_factors.push(factor);
      }
      
      relevanceResults.score = totalScore;
      
      if (relevanceResults.score < 0.7) {
        relevanceResults.issues.push('Low relevance to original request detected');
        relevanceResults.corrections.push('Ensure response directly addresses the user\'s prompt and requirements');
      }
    } else {
      relevanceResults.issues.push('No original prompt found for relevance comparison');
      relevanceResults.score = 0.5; // Neutral score when can't determine relevance
    }

    this.log(`Relevance verification completed. Score: ${relevanceResults.score}`);
    return relevanceResults;
  }

  /**
   * Calculate keyword overlap between data and prompt keywords
   * @param {object} data - Data to check
   * @param {Array<string>} promptKeywords - Keywords from original prompt
   * @returns {number} - Overlap score (0-1)
   */
  calculateKeywordOverlap(data, promptKeywords) {
    if (!promptKeywords || promptKeywords.length === 0) return 0.5;
    
    const dataStr = JSON.stringify(data).toLowerCase();
    const matchingKeywords = promptKeywords.filter(keyword => 
      dataStr.includes(keyword.toLowerCase())
    );
    
    return matchingKeywords.length / promptKeywords.length;
  }

  /**
   * Calculate intent alignment
   * @param {object} data - Data to check
   * @param {string} promptIntent - Intent from original prompt
   * @returns {number} - Alignment score (0-1)
   */
  calculateIntentAlignment(data, promptIntent) {
    // Simple heuristic based on data characteristics
    const hasStructuredResponse = data.summary && data.summary.requiredProcessing;
    const hasComplexData = data.sources && data.sources.length > 1;
    
    switch (promptIntent) {
      case 'question':
        return hasStructuredResponse ? 0.9 : 0.6;
      case 'command':
        return hasComplexData ? 0.9 : 0.7;
      case 'analysis':
        return hasComplexData && hasStructuredResponse ? 0.95 : 0.6;
      default:
        return 0.7;
    }
  }

  /**
   * Calculate complexity match
   * @param {object} data - Data to check
   * @param {string} promptComplexity - Complexity from original prompt
   * @returns {number} - Match score (0-1)
   */
  calculateComplexityMatch(data, promptComplexity) {
    const dataComplexity = this.assessDataComplexity(data);
    
    if (dataComplexity === promptComplexity) return 1.0;
    
    // Penalize mismatches
    const complexityLevels = ['simple', 'medium', 'complex'];
    const promptIndex = complexityLevels.indexOf(promptComplexity);
    const dataIndex = complexityLevels.indexOf(dataComplexity);
    
    const difference = Math.abs(promptIndex - dataIndex);
    return Math.max(0, 1 - (difference * 0.3));
  }

  /**
   * Assess complexity of collected data
   * @param {object} data - Data to assess
   * @returns {string} - Complexity level
   */
  assessDataComplexity(data) {
    const sourceCount = data.sources ? data.sources.length : 0;
    const dataSize = JSON.stringify(data).length;
    const hasMultipleTypes = data.sources ? 
      new Set(data.sources.map(s => s.type)).size > 1 : false;
    
    if (sourceCount <= 1 && dataSize < 1000) return 'simple';
    if (sourceCount <= 2 && dataSize < 5000 && !hasMultipleTypes) return 'medium';
    return 'complex';
  }

  /**
   * Main process method - performs complete verification
   * @param {object} input - Data from CollectionAgent to verify
   * @returns {Promise<object>} - Verified and potentially corrected data
   */
  async process(input) {
    this.log('Starting comprehensive verification process');
    
    const verificationResult = {
      originalData: input,
      verifiedData: { ...input },
      verificationReport: {
        timestamp: new Date().toISOString(),
        factualAccuracy: null,
        consistency: null,
        relevance: null,
        overallScore: 0,
        issues: [],
        corrections: [],
        passed: false
      },
      filteredData: null,
      recommendedActions: []
    };

    try {
      // Perform all verification checks
      const [factualResults, consistencyResults, relevanceResults] = await Promise.all([
        this.verifyFactualAccuracy(input),
        this.verifyConsistency(input),
        this.verifyRelevance(input)
      ]);

      verificationResult.verificationReport.factualAccuracy = factualResults;
      verificationResult.verificationReport.consistency = consistencyResults;
      verificationResult.verificationReport.relevance = relevanceResults;

      // Calculate overall score
      const weights = { factual: 0.4, consistency: 0.3, relevance: 0.3 };
      verificationResult.verificationReport.overallScore = 
        (factualResults.score * weights.factual) +
        (consistencyResults.score * weights.consistency) +
        (relevanceResults.score * weights.relevance);

      // Aggregate all issues and corrections
      verificationResult.verificationReport.issues = [
        ...factualResults.issues,
        ...consistencyResults.issues,
        ...relevanceResults.issues
      ];

      verificationResult.verificationReport.corrections = [
        ...factualResults.corrections,
        ...consistencyResults.corrections,
        ...relevanceResults.corrections
      ];

      // Determine if verification passed
      const threshold = 0.7;
      verificationResult.verificationReport.passed = 
        verificationResult.verificationReport.overallScore >= threshold;

      // Apply corrections and filter data
      verificationResult.filteredData = await this.applyCorrections(
        verificationResult.verifiedData,
        verificationResult.verificationReport
      );

      // Generate recommendations
      verificationResult.recommendedActions = this.generateRecommendations(
        verificationResult.verificationReport
      );

      this.log(`Verification completed. Overall score: ${verificationResult.verificationReport.overallScore}, Passed: ${verificationResult.verificationReport.passed}`);
      
      // Store in history
      this.verificationHistory.push({
        timestamp: new Date().toISOString(),
        overallScore: verificationResult.verificationReport.overallScore,
        passed: verificationResult.verificationReport.passed,
        issueCount: verificationResult.verificationReport.issues.length
      });

      return verificationResult;

    } catch (error) {
      this.log(`Error during verification: ${error.message}`, 'error');
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Apply corrections to the data based on verification results
   * @param {object} data - Data to correct
   * @param {object} verificationReport - Verification report with issues and corrections
   * @returns {Promise<object>} - Corrected data
   */
  async applyCorrections(data, verificationReport) {
    const correctedData = JSON.parse(JSON.stringify(data)); // Deep copy
    
    // Add verification metadata
    correctedData.verificationMetadata = {
      verifiedAt: new Date().toISOString(),
      verificationScore: verificationReport.overallScore,
      issuesFound: verificationReport.issues.length,
      correctionsApplied: verificationReport.corrections.length,
      verificationPassed: verificationReport.passed
    };

    // If verification failed, add warning
    if (!verificationReport.passed) {
      correctedData.verificationWarning = 'This data has failed verification checks. Use with caution.';
    }

    this.log(`Applied corrections to data. Verification metadata added.`);
    return correctedData;
  }

  /**
   * Generate recommendations based on verification results
   * @param {object} verificationReport - Verification report
   * @returns {Array<string>} - List of recommendations
   */
  generateRecommendations(verificationReport) {
    const recommendations = [];

    if (verificationReport.factualAccuracy.score < 0.8) {
      recommendations.push('Consider cross-referencing facts with additional reliable sources');
    }

    if (verificationReport.consistency.score < 0.8) {
      recommendations.push('Review content for internal consistency and terminology standardization');
    }

    if (verificationReport.relevance.score < 0.8) {
      recommendations.push('Ensure response directly addresses the original user request');
    }

    if (verificationReport.issues.length > 5) {
      recommendations.push('High number of issues detected - consider regenerating the response');
    }

    if (recommendations.length === 0) {
      recommendations.push('Data quality is good - proceed with formatting');
    }

    return recommendations;
  }

  /**
   * Get verification statistics
   * @returns {object} - Verification statistics
   */
  getVerificationStats() {
    return {
      totalVerifications: this.verificationHistory.length,
      averageScore: this.verificationHistory.length > 0 ?
        this.verificationHistory.reduce((sum, v) => sum + v.overallScore, 0) / this.verificationHistory.length : 0,
      passRate: this.verificationHistory.length > 0 ?
        this.verificationHistory.filter(v => v.passed).length / this.verificationHistory.length : 0,
      rulesConfigured: this.verificationRules.length,
      externalSourcesConfigured: this.externalSources.length
    };
  }
}