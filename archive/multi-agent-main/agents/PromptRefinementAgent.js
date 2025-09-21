/**
 * PromptRefinementAgent - Agent d'Affinement de Prompts
 * 
 * ATTENTION: NE JAMAIS MELANGER AVEC MOSAICMIND
 * Cet agent est strictement séparé de MOSAICMIND
 */

class PromptRefinementAgent {
    constructor(config = {}) {
        this.name = 'PromptRefinementAgent';
        this.config = {
            maxPromptLength: config.maxPromptLength || 1000,
            minPromptLength: config.minPromptLength || 10,
            enableSubPrompts: config.enableSubPrompts !== false,
            enableContextExpansion: config.enableContextExpansion !== false,
            ...config
        };
        
        // Validation de séparation MOSAICMIND
        this.validateSeparation();
    }

    /**
     * Valide que cet agent est strictement séparé de MOSAICMIND
     */
    validateSeparation() {
        const blockedTerms = ['MOSAICMIND', 'mosaicmind', 'MosaicMind'];
        const agentSource = this.constructor.toString();
        
        for (const term of blockedTerms) {
            if (agentSource.includes(term) && !agentSource.includes('NE JAMAIS MELANGER')) {
                throw new Error(`❌ ERREUR DE SÉPARATION: Agent contaminé par ${term}`);
            }
        }
    }

    /**
     * Point d'entrée principal - affine le prompt utilisateur
     */
    async refinePrompt(originalPrompt, context = {}) {
        try {
            console.log('🔧 PromptRefinementAgent: Début de l\'affinement du prompt');
            
            // Validation d'entrée
            this.validateInput(originalPrompt);
            
            // Étapes d'affinement
            const analysisResult = this.analyzePrompt(originalPrompt);
            const clarifiedPrompt = this.clarifyIntent(originalPrompt, analysisResult);
            const expandedPrompt = this.expandContext(clarifiedPrompt, context);
            const structuredPrompt = this.structurePrompt(expandedPrompt);
            
            // Génération de sous-prompts si nécessaire
            const subPrompts = this.config.enableSubPrompts 
                ? this.generateSubPrompts(structuredPrompt, analysisResult)
                : [];

            const result = {
                original: originalPrompt,
                refined: structuredPrompt,
                subPrompts: subPrompts,
                analysis: analysisResult,
                instructions: this.generateInstructions(structuredPrompt, analysisResult),
                metadata: {
                    agent: this.name,
                    timestamp: new Date().toISOString(),
                    separationValidated: true
                }
            };

            console.log('✅ PromptRefinementAgent: Affinement terminé avec succès');
            return result;

        } catch (error) {
            console.error('❌ PromptRefinementAgent: Erreur lors de l\'affinement:', error);
            throw new Error(`Échec de l'affinement du prompt: ${error.message}`);
        }
    }

    /**
     * Valide l'entrée utilisateur
     */
    validateInput(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Le prompt doit être une chaîne de caractères non vide');
        }

        if (prompt.trim().length < this.config.minPromptLength) {
            throw new Error(`Le prompt doit contenir au moins ${this.config.minPromptLength} caractères`);
        }

        if (prompt.length > this.config.maxPromptLength) {
            throw new Error(`Le prompt ne peut pas dépasser ${this.config.maxPromptLength} caractères`);
        }

        // Vérification de séparation MOSAICMIND
        const blockedTerms = ['MOSAICMIND', 'mosaicmind'];
        for (const term of blockedTerms) {
            if (prompt.toLowerCase().includes(term.toLowerCase())) {
                throw new Error(`❌ ERREUR: Référence interdite à ${term} dans le prompt`);
            }
        }
    }

    /**
     * Analyse le prompt pour identifier ses caractéristiques
     */
    analyzePrompt(prompt) {
        const analysis = {
            type: this.identifyPromptType(prompt),
            complexity: this.assessComplexity(prompt),
            domain: this.identifyDomain(prompt),
            clarity: this.assessClarity(prompt),
            specificity: this.assessSpecificity(prompt),
            actionability: this.assessActionability(prompt)
        };

        console.log('📊 Analyse du prompt:', analysis);
        return analysis;
    }

    /**
     * Identifie le type de prompt
     */
    identifyPromptType(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('code') || lowerPrompt.includes('programmer') || lowerPrompt.includes('développer')) {
            return 'coding';
        } else if (lowerPrompt.includes('expliquer') || lowerPrompt.includes('qu\'est-ce') || lowerPrompt.includes('comment')) {
            return 'explanation';
        } else if (lowerPrompt.includes('créer') || lowerPrompt.includes('générer') || lowerPrompt.includes('produire')) {
            return 'generation';
        } else if (lowerPrompt.includes('analyser') || lowerPrompt.includes('évaluer') || lowerPrompt.includes('comparer')) {
            return 'analysis';
        } else {
            return 'general';
        }
    }

    /**
     * Évalue la complexité du prompt
     */
    assessComplexity(prompt) {
        const words = prompt.split(/\s+/).length;
        const sentences = prompt.split(/[.!?]+/).length;
        
        if (words < 10) return 'simple';
        if (words < 30) return 'medium';
        return 'complex';
    }

    /**
     * Identifie le domaine du prompt
     */
    identifyDomain(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        
        const domains = {
            'web': ['web', 'html', 'css', 'javascript', 'react', 'vue', 'angular'],
            'backend': ['backend', 'api', 'serveur', 'base de données', 'database'],
            'mobile': ['mobile', 'app', 'android', 'ios', 'react native'],
            'data': ['data', 'données', 'analyse', 'machine learning', 'ai'],
            'general': []
        };

        for (const [domain, keywords] of Object.entries(domains)) {
            if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
                return domain;
            }
        }
        
        return 'general';
    }

    /**
     * Évalue la clarté du prompt
     */
    assessClarity(prompt) {
        const hasQuestionWords = /\b(qui|que|quoi|où|quand|comment|pourquoi|quel)\b/i.test(prompt);
        const hasSpecificTerms = /\b(spécifique|précis|exact|détaillé)\b/i.test(prompt);
        
        if (hasQuestionWords && hasSpecificTerms) return 'high';
        if (hasQuestionWords || hasSpecificTerms) return 'medium';
        return 'low';
    }

    /**
     * Évalue la spécificité du prompt
     */
    assessSpecificity(prompt) {
        const specificIndicators = prompt.match(/\b(avec|utilisant|en|pour|dans|selon)\b/gi) || [];
        
        if (specificIndicators.length >= 3) return 'high';
        if (specificIndicators.length >= 1) return 'medium';
        return 'low';
    }

    /**
     * Évalue le caractère actionnable du prompt
     */
    assessActionability(prompt) {
        const actionVerbs = /\b(créer|développer|implémenter|écrire|générer|construire|faire|produire)\b/i.test(prompt);
        const hasConstraints = /\b(avec|sans|en utilisant|en évitant|sous|pour)\b/i.test(prompt);
        
        if (actionVerbs && hasConstraints) return 'high';
        if (actionVerbs || hasConstraints) return 'medium';
        return 'low';
    }

    /**
     * Clarifie l'intention du prompt
     */
    clarifyIntent(prompt, analysis) {
        let clarified = prompt.trim();

        // Ajouter un contexte si l'intention n'est pas claire
        if (analysis.clarity === 'low') {
            clarified = this.addClarifyingQuestions(clarified, analysis);
        }

        // Rendre plus spécifique si nécessaire
        if (analysis.specificity === 'low') {
            clarified = this.addSpecificityPrompts(clarified, analysis);
        }

        return clarified;
    }

    /**
     * Ajoute des questions clarifiantes
     */
    addClarifyingQuestions(prompt, analysis) {
        const questions = [];

        if (analysis.type === 'coding') {
            questions.push('Quel langage de programmation souhaitez-vous utiliser ?');
            questions.push('Quel est le contexte ou l\'environnement d\'exécution ?');
        } else if (analysis.type === 'explanation') {
            questions.push('Quel niveau de détail souhaitez-vous ?');
            questions.push('Pour quel public cible ?');
        }

        if (questions.length > 0) {
            return `${prompt}\n\nPour mieux vous aider, précisez:\n${questions.map(q => `- ${q}`).join('\n')}`;
        }

        return prompt;
    }

    /**
     * Ajoute des éléments de spécificité
     */
    addSpecificityPrompts(prompt, analysis) {
        const specifics = [];

        if (analysis.domain !== 'general') {
            specifics.push(`Dans le contexte de ${analysis.domain}`);
        }

        if (analysis.complexity === 'simple') {
            specifics.push('avec des exemples concrets');
        }

        if (specifics.length > 0) {
            return `${prompt} (${specifics.join(', ')})`;
        }

        return prompt;
    }

    /**
     * Expand le contexte du prompt
     */
    expandContext(prompt, context) {
        if (!this.config.enableContextExpansion || !context || Object.keys(context).length === 0) {
            return prompt;
        }

        let expanded = prompt;
        
        if (context.userLevel) {
            expanded += `\nNiveau d'expertise: ${context.userLevel}`;
        }

        if (context.constraints) {
            expanded += `\nContraintes: ${context.constraints}`;
        }

        if (context.preferences) {
            expanded += `\nPréférences: ${context.preferences}`;
        }

        return expanded;
    }

    /**
     * Structure le prompt de manière cohérente
     */
    structurePrompt(prompt) {
        const lines = prompt.split('\n').filter(line => line.trim());
        
        if (lines.length === 1) {
            return `**Demande principale:**\n${lines[0]}`;
        }

        const mainPrompt = lines[0];
        const additionalInfo = lines.slice(1);

        let structured = `**Demande principale:**\n${mainPrompt}\n`;
        
        if (additionalInfo.length > 0) {
            structured += `\n**Informations complémentaires:**\n${additionalInfo.join('\n')}`;
        }

        return structured;
    }

    /**
     * Génère des sous-prompts si nécessaire
     */
    generateSubPrompts(prompt, analysis) {
        const subPrompts = [];

        if (analysis.complexity === 'complex') {
            subPrompts.push({
                type: 'breakdown',
                prompt: 'Décomposer cette demande en étapes plus simples',
                priority: 'high'
            });
        }

        if (analysis.type === 'coding') {
            subPrompts.push({
                type: 'architecture',
                prompt: 'Définir l\'architecture et la structure du code',
                priority: 'medium'
            });
            
            subPrompts.push({
                type: 'implementation',
                prompt: 'Implémenter le code avec des bonnes pratiques',
                priority: 'high'
            });

            subPrompts.push({
                type: 'testing',
                prompt: 'Ajouter des tests et validation',
                priority: 'medium'
            });
        }

        return subPrompts;
    }

    /**
     * Génère des instructions pour les autres agents
     */
    generateInstructions(prompt, analysis) {
        const instructions = {
            forCollectionAgent: [],
            forSynthesisAgent: [],
            general: []
        };

        // Instructions pour CollectionAgent
        if (analysis.domain !== 'general') {
            instructions.forCollectionAgent.push(`Rechercher des informations spécifiques au domaine: ${analysis.domain}`);
        }

        if (analysis.complexity === 'complex') {
            instructions.forCollectionAgent.push('Rassembler des données détaillées et complètes');
        }

        // Instructions pour SynthesisAgent
        if (analysis.type === 'coding') {
            instructions.forSynthesisAgent.push('Structurer la réponse avec du code formaté et des explications');
        }

        if (analysis.clarity === 'low') {
            instructions.forSynthesisAgent.push('Clarifier la réponse avec des exemples et des détails');
        }

        // Instructions générales
        instructions.general.push(`Type de prompt: ${analysis.type}`);
        instructions.general.push(`Niveau de complexité: ${analysis.complexity}`);
        instructions.general.push(`Domaine: ${analysis.domain}`);

        return instructions;
    }

    /**
     * Obtient le statut de l'agent
     */
    getStatus() {
        return {
            name: this.name,
            status: 'ready',
            config: this.config,
            separationValidated: true,
            capabilities: [
                'prompt_analysis',
                'intent_clarification', 
                'context_expansion',
                'sub_prompt_generation',
                'instruction_generation'
            ]
        };
    }
}

module.exports = PromptRefinementAgent;