const axios = require('axios');
require('dotenv').config();

/**
 * DistributionAgent - Gestionnaire de distribution des requêtes vers plusieurs APIs externes
 * Permet d'envoyer des requêtes en parallèle à différentes APIs d'IA et d'agréger les réponses
 */
class DistributionAgent {
  constructor() {
    this.apiConfigs = {
      ollama: {
        name: 'Ollama',
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        endpoint: '/api/generate',
        enabled: true
      },
      huggingface: {
        name: 'HuggingFace',
        url: 'https://api-inference.huggingface.co',
        endpoint: '/models/microsoft/DialoGPT-medium',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`
        },
        enabled: !!process.env.HUGGINGFACE_API_TOKEN
      },
      together: {
        name: 'Together AI',
        url: 'https://api.together.xyz',
        endpoint: '/inference',
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.TOGETHER_API_TOKEN
      },
      replicate: {
        name: 'Replicate',
        url: 'https://api.replicate.com',
        endpoint: '/v1/predictions',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.REPLICATE_API_TOKEN
      },
      openrouter: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai',
        endpoint: '/api/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.OPENROUTER_API_TOKEN
      },
      groq: {
        name: 'Groq',
        url: 'https://api.groq.com',
        endpoint: '/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.GROQ_API_TOKEN
      },
      anyscale: {
        name: 'Anyscale',
        url: 'https://api.endpoints.anyscale.com',
        endpoint: '/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.ANYSCALE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        enabled: !!process.env.ANYSCALE_API_TOKEN
      }
    };

    this.timeout = 30000; // 30 seconds timeout
    this.maxRetries = 2;
  }

  /**
   * Formate le payload selon l'API spécifique
   */
  formatPayload(apiKey, prompt, options = {}) {
    const payloads = {
      ollama: {
        model: options.model || 'llama3',
        prompt: prompt,
        stream: false
      },
      huggingface: {
        inputs: prompt,
        parameters: {
          max_length: options.maxLength || 200,
          temperature: options.temperature || 0.7
        }
      },
      together: {
        model: options.model || 'togethercomputer/RedPajama-INCITE-Chat-3B-v1',
        prompt: prompt,
        max_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7
      },
      replicate: {
        version: options.version || 'meta/llama-2-70b-chat',
        input: {
          prompt: prompt,
          max_length: options.maxLength || 200,
          temperature: options.temperature || 0.7
        }
      },
      openrouter: {
        model: options.model || 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7
      },
      groq: {
        model: options.model || 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7
      },
      anyscale: {
        model: options.model || 'meta-llama/Llama-2-7b-chat-hf',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7
      }
    };

    return payloads[apiKey] || {};
  }

  /**
   * Extrait la réponse selon le format de l'API
   */
  extractResponse(apiKey, responseData) {
    const extractors = {
      ollama: (data) => data.response || data.output || 'No response',
      huggingface: (data) => {
        if (Array.isArray(data) && data[0]) {
          return data[0].generated_text || data[0].response || 'No response';
        }
        return data.generated_text || data.response || 'No response';
      },
      together: (data) => data.output?.choices?.[0]?.text || data.output || 'No response',
      replicate: (data) => {
        if (Array.isArray(data.output)) {
          return data.output.join('');
        }
        return data.output || 'No response';
      },
      openrouter: (data) => data.choices?.[0]?.message?.content || 'No response',
      groq: (data) => data.choices?.[0]?.message?.content || 'No response',
      anyscale: (data) => data.choices?.[0]?.message?.content || 'No response'
    };

    return extractors[apiKey] ? extractors[apiKey](responseData) : 'Unable to parse response';
  }

  /**
   * Effectue une requête vers une API spécifique avec gestion d'erreurs
   */
  async queryAPI(apiKey, prompt, options = {}) {
    const config = this.apiConfigs[apiKey];
    
    if (!config || !config.enabled) {
      return {
        api: config?.name || apiKey,
        success: false,
        error: config ? 'API disabled (missing token)' : 'API not configured',
        response: null,
        responseTime: 0
      };
    }

    const startTime = Date.now();
    let retries = 0;

    while (retries <= this.maxRetries) {
      try {
        const payload = this.formatPayload(apiKey, prompt, options);
        const url = `${config.url}${config.endpoint}`;
        
        const axiosConfig = {
          method: 'POST',
          url: url,
          data: payload,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          timeout: this.timeout
        };

        console.log(`[${config.name}] Sending request (attempt ${retries + 1})...`);
        
        const response = await axios(axiosConfig);
        const responseTime = Date.now() - startTime;
        const extractedResponse = this.extractResponse(apiKey, response.data);

        return {
          api: config.name,
          success: true,
          error: null,
          response: extractedResponse,
          responseTime: responseTime,
          statusCode: response.status
        };

      } catch (error) {
        retries++;
        const responseTime = Date.now() - startTime;
        
        console.error(`[${config.name}] Error (attempt ${retries}):`, error.message);

        if (retries > this.maxRetries) {
          return {
            api: config.name,
            success: false,
            error: error.response?.data?.error || error.message || 'Unknown error',
            response: null,
            responseTime: responseTime,
            statusCode: error.response?.status || null
          };
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  /**
   * Envoie le prompt à toutes les APIs disponibles en parallèle
   */
  async distributeQuery(prompt, options = {}) {
    console.log('🚀 Starting distributed query...');
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    
    const enabledAPIs = Object.keys(this.apiConfigs).filter(key => this.apiConfigs[key].enabled);
    
    if (enabledAPIs.length === 0) {
      console.warn('⚠️ No APIs are enabled. Please configure API tokens.');
      return {
        success: false,
        error: 'No APIs available',
        results: [],
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          totalTime: 0
        }
      };
    }

    console.log(`🔄 Querying ${enabledAPIs.length} APIs: ${enabledAPIs.map(api => this.apiConfigs[api].name).join(', ')}`);

    const startTime = Date.now();
    
    // Lancer toutes les requêtes en parallèle
    const promises = enabledAPIs.map(apiKey => this.queryAPI(apiKey, prompt, options));
    
    try {
      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;
      
      // Traiter les résultats
      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            api: this.apiConfigs[enabledAPIs[index]].name,
            success: false,
            error: result.reason?.message || 'Promise rejected',
            response: null,
            responseTime: totalTime
          };
        }
      });

      const successful = processedResults.filter(r => r.success);
      const failed = processedResults.filter(r => !r.success);

      console.log(`✅ Completed: ${successful.length} successful, ${failed.length} failed`);
      console.log(`⏱️ Total time: ${totalTime}ms`);

      return {
        success: successful.length > 0,
        error: successful.length === 0 ? 'All APIs failed' : null,
        results: processedResults,
        summary: {
          total: processedResults.length,
          successful: successful.length,
          failed: failed.length,
          totalTime: totalTime,
          averageResponseTime: successful.length > 0 
            ? Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length)
            : 0
        }
      };

    } catch (error) {
      console.error('💥 Unexpected error in distributed query:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        summary: {
          total: 0,
          successful: 0,
          failed: enabledAPIs.length,
          totalTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Récupère le statut de toutes les APIs
   */
  getAPIStatus() {
    const status = {};
    
    Object.keys(this.apiConfigs).forEach(apiKey => {
      const config = this.apiConfigs[apiKey];
      status[apiKey] = {
        name: config.name,
        enabled: config.enabled,
        configured: config.enabled,
        url: config.url
      };
    });

    return status;
  }

  /**
   * Active ou désactive une API spécifique
   */
  toggleAPI(apiKey, enabled) {
    if (this.apiConfigs[apiKey]) {
      this.apiConfigs[apiKey].enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Met à jour la configuration d'une API
   */
  updateAPIConfig(apiKey, newConfig) {
    if (this.apiConfigs[apiKey]) {
      this.apiConfigs[apiKey] = { ...this.apiConfigs[apiKey], ...newConfig };
      return true;
    }
    return false;
  }
}

module.exports = DistributionAgent;