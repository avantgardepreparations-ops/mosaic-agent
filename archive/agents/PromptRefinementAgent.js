/**
 * PromptRefinementAgent.js
 * Agent spécialisé dans l'affinement et l'amélioration des prompts
 * Clarifie, enrichit et reformule le prompt initial de l'utilisateur
 */

const AgentBase = require('./base/AgentBase');

class PromptRefinementAgent extends AgentBase {
    constructor() {
        super(
            'PromptRefinementAgent',
            'Spécialiste en Ingénierie de Prompts',
            ['prompt_analysis', 'text_refinement', 'clarity_enhancement', 'instruction_optimization']
        );
    }

    /**
     * Traite et affine un prompt d'entrée
     * @param {Object} input - Contient le prompt original et les paramètres
     * @returns {Promise<Object>} - Prompt affiné et métadonnées
     */
    async process(input) {
        const { prompt, context = {}, options = {} } = input;

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Prompt requis et doit être une chaîne de caractères');
        }

        this.log(`Affinement du prompt: "${prompt.substring(0, 50)}..."`);

        // Simulation d'analyse et d'affinement (version mock)
        const analysis = this.analyzePrompt(prompt);
        const refinedPrompt = this.refinePrompt(prompt, analysis, context, options);
        const suggestions = this.generateSuggestions(analysis);

        const result = {
            originalPrompt: prompt,
            refinedPrompt: refinedPrompt,
            analysis: analysis,
            suggestions: suggestions,
            confidence: this.calculateConfidence(analysis),
            processingTime: this.getProcessingTime(),
            agent: this.name
        };

        this.log(`Prompt affiné avec ${suggestions.length} suggestions`);
        return result;
    }

    /**
     * Analyse la structure et la qualité du prompt
     * @param {string} prompt - Prompt à analyser
     * @returns {Object} - Résultats de l'analyse
     */
    analyzePrompt(prompt) {
        return {
            length: prompt.length,
            wordCount: prompt.split(/\s+/).length,
            hasContext: prompt.toLowerCase().includes('contexte') || prompt.toLowerCase().includes('context'),
            hasInstructions: prompt.includes('?') || prompt.toLowerCase().includes('comment') || prompt.toLowerCase().includes('expliquer'),
            complexity: this.assessComplexity(prompt),
            clarity: this.assessClarity(prompt),
            specificity: this.assessSpecificity(prompt),
            issues: this.identifyIssues(prompt)
        };
    }

    /**
     * Affine le prompt basé sur l'analyse
     * @param {string} prompt - Prompt original
     * @param {Object} analysis - Analyse du prompt
     * @param {Object} context - Contexte additionnel
     * @param {Object} options - Options d'affinement
     * @returns {string} - Prompt affiné
     */
    refinePrompt(prompt, analysis, context, options) {
        let refined = prompt.trim();

        // Ajouter du contexte si manquant
        if (!analysis.hasContext && context.domain) {
            refined = `Dans le contexte de ${context.domain}: ${refined}`;
        }

        // Améliorer la clarté si nécessaire
        if (analysis.clarity < 0.7) {
            refined = this.improveClarityMock(refined);
        }

        // Ajouter de la spécificité si nécessaire
        if (analysis.specificity < 0.6) {
            refined = this.improveSpecificityMock(refined);
        }

        // Structurer si complexe
        if (analysis.complexity > 0.8) {
            refined = this.structureComplexPromptMock(refined);
        }

        return refined;
    }

    /**
     * Génère des suggestions d'amélioration
     * @param {Object} analysis - Analyse du prompt
     * @returns {Array} - Liste de suggestions
     */
    generateSuggestions(analysis) {
        const suggestions = [];

        if (analysis.wordCount < 10) {
            suggestions.push({
                type: 'length',
                message: 'Considérez ajouter plus de détails pour un meilleur contexte',
                priority: 'medium'
            });
        }

        if (!analysis.hasContext) {
            suggestions.push({
                type: 'context',
                message: 'Ajoutez du contexte pour aider à mieux comprendre la demande',
                priority: 'high'
            });
        }

        if (analysis.clarity < 0.5) {
            suggestions.push({
                type: 'clarity',
                message: 'Reformulez pour plus de clarté et de précision',
                priority: 'high'
            });
        }

        if (analysis.specificity < 0.4) {
            suggestions.push({
                type: 'specificity',
                message: 'Soyez plus spécifique dans votre demande',
                priority: 'medium'
            });
        }

        return suggestions;
    }

    // Méthodes utilitaires mock pour l'analyse
    assessComplexity(prompt) {
        // Mock: complexité basée sur la longueur et les mots-clés
        const complexWords = ['algorithme', 'architecture', 'optimisation', 'intégration'];
        const hasComplexWords = complexWords.some(word => prompt.toLowerCase().includes(word));
        return Math.min(0.9, (prompt.length / 200) + (hasComplexWords ? 0.3 : 0));
    }

    assessClarity(prompt) {
        // Mock: clarté basée sur la structure et les mots de liaison
        const clarityWords = ['comment', 'pourquoi', 'quoi', 'où', 'quand', 'expliquer'];
        const hasClarityWords = clarityWords.some(word => prompt.toLowerCase().includes(word));
        return Math.min(0.95, 0.4 + (hasClarityWords ? 0.3 : 0) + (prompt.includes('?') ? 0.2 : 0));
    }

    assessSpecificity(prompt) {
        // Mock: spécificité basée sur les détails techniques
        const specificWords = ['javascript', 'python', 'react', 'node.js', 'api', 'database'];
        const hasSpecificWords = specificWords.some(word => prompt.toLowerCase().includes(word));
        return Math.min(0.9, 0.3 + (hasSpecificWords ? 0.4 : 0) + (prompt.length > 50 ? 0.2 : 0));
    }

    identifyIssues(prompt) {
        const issues = [];
        
        if (prompt.length < 20) {
            issues.push('Prompt trop court');
        }
        
        if (!prompt.includes('?') && !prompt.toLowerCase().includes('comment')) {
            issues.push('Manque d\'instruction claire');
        }
        
        if (prompt.split(' ').length > 100) {
            issues.push('Prompt potentiellement trop long');
        }

        return issues;
    }

    calculateConfidence(analysis) {
        // Calcul mock de la confiance basé sur l'analyse
        const clarityWeight = 0.4;
        const specificityWeight = 0.3;
        const issuesWeight = 0.3;
        
        const issuesScore = Math.max(0, 1 - (analysis.issues.length * 0.2));
        
        return Math.min(0.95, 
            (analysis.clarity * clarityWeight) +
            (analysis.specificity * specificityWeight) +
            (issuesScore * issuesWeight)
        );
    }

    // Méthodes mock d'amélioration
    improveClarityMock(prompt) {
        if (!prompt.includes('?')) {
            return prompt + ' ?';
        }
        return `Pouvez-vous ${prompt.toLowerCase()}`;
    }

    improveSpecificityMock(prompt) {
        return prompt + ' (incluez des exemples concrets si possible)';
    }

    structureComplexPromptMock(prompt) {
        return `Demande structurée:\n1. Contexte: ${prompt.substring(0, 50)}...\n2. Objectif: [À clarifier]\n3. Contraintes: [À spécifier]`;
    }

    getProcessingTime() {
        // Simulation du temps de traitement
        return Math.random() * 500 + 100; // 100-600ms
    }
}

module.exports = PromptRefinementAgent;