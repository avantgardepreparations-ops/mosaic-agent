/**
 * SynthesisAgent - Agent de Synthèse et Compilation
 * 
 * ATTENTION: NE JAMAIS MELANGER AVEC MOSAICMIND
 * Cet agent est strictement séparé de MOSAICMIND
 */

class SynthesisAgent {
    constructor(config = {}) {
        this.name = 'SynthesisAgent';
        this.config = {
            outputFormat: config.outputFormat || 'markdown',
            includeCodeBlocks: config.includeCodeBlocks !== false,
            includeMetadata: config.includeMetadata !== false,
            maxOutputLength: config.maxOutputLength || 10000,
            enableQualityChecks: config.enableQualityChecks !== false,
            coherenceThreshold: config.coherenceThreshold || 0.7,
            ...config
        };
        
        this.synthesisMetrics = {
            inputSources: 0,
            outputLength: 0,
            coherenceScore: 0,
            completenessScore: 0,
            qualityScore: 0
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
     * Point d'entrée principal - synthétise les données finales
     */
    async synthesize(collectedData, refinedPrompt, context = {}) {
        try {
            console.log('🔮 SynthesisAgent: Début de la synthèse');
            
            // Validation d'entrée
            this.validateInput(collectedData, refinedPrompt);
            
            // Réinitialisation des métriques
            this.resetMetrics();
            
            // Analyse des données d'entrée
            const analysisResult = this.analyzeInputData(collectedData);
            
            // Construction de la structure de réponse
            const responseStructure = this.buildResponseStructure(analysisResult, refinedPrompt);
            
            // Génération du contenu
            const generatedContent = await this.generateContent(responseStructure, analysisResult);
            
            // Formatage de la sortie
            const formattedOutput = this.formatOutput(generatedContent, refinedPrompt);
            
            // Contrôles qualité
            const qualityChecks = this.config.enableQualityChecks 
                ? this.performQualityChecks(formattedOutput, analysisResult)
                : { passed: true, score: 1.0, issues: [] };
            
            // Construction de la réponse finale
            const finalResponse = this.buildFinalResponse(formattedOutput, qualityChecks, analysisResult);

            console.log('✅ SynthesisAgent: Synthèse terminée avec succès');
            return finalResponse;

        } catch (error) {
            console.error('❌ SynthesisAgent: Erreur lors de la synthèse:', error);
            throw new Error(`Échec de la synthèse: ${error.message}`);
        }
    }

    /**
     * Valide les entrées
     */
    validateInput(collectedData, refinedPrompt) {
        if (!collectedData || typeof collectedData !== 'object') {
            throw new Error('Les données collectées doivent être un objet valide');
        }

        if (!refinedPrompt || typeof refinedPrompt !== 'object') {
            throw new Error('Le prompt affiné doit être un objet valide');
        }

        if (!collectedData.collectedData) {
            throw new Error('Structure des données collectées invalide');
        }

        // Vérification de séparation MOSAICMIND
        const dataString = JSON.stringify(collectedData).toLowerCase();
        if (dataString.includes('mosaicmind')) {
            throw new Error('❌ ERREUR: Données contaminées par MOSAICMIND');
        }
    }

    /**
     * Réinitialise les métriques
     */
    resetMetrics() {
        this.synthesisMetrics = {
            inputSources: 0,
            outputLength: 0,
            coherenceScore: 0,
            completenessScore: 0,
            qualityScore: 0,
            startTime: Date.now()
        };
    }

    /**
     * Analyse les données d'entrée
     */
    analyzeInputData(collectedData) {
        console.log('🔍 Analyse des données d\'entrée...');

        const unified = collectedData.collectedData;
        const analysis = {
            sourceCount: unified.metadata?.sourceCount || 0,
            confidence: unified.metadata?.confidence || 0,
            coverage: unified.metadata?.coverage || {},
            quality: unified.quality || {},
            mainContent: unified.structure?.mainContent || [],
            supportingData: unified.structure?.supportingData || [],
            evidence: unified.structure?.evidence || [],
            alternatives: unified.structure?.alternatives || [],
            promptAnalysis: unified.prompt?.analysis || {}
        };

        this.synthesisMetrics.inputSources = analysis.sourceCount;

        console.log(`✅ Analyse terminée: ${analysis.sourceCount} sources, confiance: ${analysis.confidence.toFixed(2)}`);
        return analysis;
    }

    /**
     * Construit la structure de réponse
     */
    buildResponseStructure(analysisResult, refinedPrompt) {
        console.log('🏗️ Construction de la structure de réponse...');

        const promptType = analysisResult.promptAnalysis.type || 'general';
        
        const structure = {
            sections: this.determineSections(promptType, analysisResult),
            tone: this.determineTone(refinedPrompt, analysisResult),
            format: this.determineFormat(promptType, analysisResult),
            priorities: this.determinePriorities(analysisResult)
        };

        console.log(`✅ Structure définie: ${structure.sections.length} sections, format: ${structure.format}`);
        return structure;
    }

    /**
     * Détermine les sections à inclure
     */
    determineSections(promptType, analysisResult) {
        const sections = [];

        // Section introduction (toujours présente)
        sections.push({
            type: 'introduction',
            title: 'Réponse',
            priority: 'high',
            required: true
        });

        // Sections spécifiques au type de prompt
        if (promptType === 'coding') {
            sections.push(
                { type: 'solution', title: 'Solution', priority: 'high', required: true },
                { type: 'code', title: 'Code', priority: 'high', required: true },
                { type: 'explanation', title: 'Explication', priority: 'medium', required: false },
                { type: 'examples', title: 'Exemples', priority: 'medium', required: false },
                { type: 'best_practices', title: 'Bonnes Pratiques', priority: 'low', required: false }
            );
        } else if (promptType === 'explanation') {
            sections.push(
                { type: 'overview', title: 'Vue d\'ensemble', priority: 'high', required: true },
                { type: 'details', title: 'Détails', priority: 'high', required: true },
                { type: 'examples', title: 'Exemples', priority: 'medium', required: false },
                { type: 'related', title: 'Sujets connexes', priority: 'low', required: false }
            );
        } else if (promptType === 'analysis') {
            sections.push(
                { type: 'analysis', title: 'Analyse', priority: 'high', required: true },
                { type: 'findings', title: 'Résultats', priority: 'high', required: true },
                { type: 'recommendations', title: 'Recommandations', priority: 'medium', required: false },
                { type: 'conclusion', title: 'Conclusion', priority: 'medium', required: false }
            );
        } else {
            sections.push(
                { type: 'content', title: 'Contenu principal', priority: 'high', required: true },
                { type: 'details', title: 'Détails', priority: 'medium', required: false },
                { type: 'summary', title: 'Résumé', priority: 'low', required: false }
            );
        }

        // Section métadonnées (si activée)
        if (this.config.includeMetadata) {
            sections.push({
                type: 'metadata',
                title: 'Métadonnées',
                priority: 'low',
                required: false
            });
        }

        return sections;
    }

    /**
     * Détermine le ton de la réponse
     */
    determineTone(refinedPrompt, analysisResult) {
        const promptComplexity = analysisResult.promptAnalysis.complexity || 'medium';
        const promptType = analysisResult.promptAnalysis.type || 'general';

        if (promptType === 'coding') {
            return 'technical';
        } else if (promptComplexity === 'simple') {
            return 'accessible';
        } else if (promptComplexity === 'complex') {
            return 'detailed';
        } else {
            return 'balanced';
        }
    }

    /**
     * Détermine le format de sortie
     */
    determineFormat(promptType, analysisResult) {
        if (promptType === 'coding') {
            return 'code_focused';
        } else if (analysisResult.promptAnalysis.complexity === 'complex') {
            return 'structured';
        } else {
            return 'standard';
        }
    }

    /**
     * Détermine les priorités de contenu
     */
    determinePriorities(analysisResult) {
        return {
            accuracy: analysisResult.confidence > 0.8 ? 'high' : 'medium',
            completeness: analysisResult.quality.completeness > 0.7 ? 'high' : 'medium',
            clarity: 'high',
            actionability: analysisResult.promptAnalysis.actionability === 'high' ? 'high' : 'medium'
        };
    }

    /**
     * Génère le contenu pour chaque section
     */
    async generateContent(responseStructure, analysisResult) {
        console.log('✍️ Génération du contenu...');

        const generatedContent = {};

        for (const section of responseStructure.sections) {
            if (section.required || this.shouldIncludeSection(section, analysisResult)) {
                generatedContent[section.type] = await this.generateSectionContent(
                    section, 
                    analysisResult, 
                    responseStructure
                );
            }
        }

        console.log(`✅ Contenu généré pour ${Object.keys(generatedContent).length} sections`);
        return generatedContent;
    }

    /**
     * Détermine si une section optionnelle doit être incluse
     */
    shouldIncludeSection(section, analysisResult) {
        if (section.required) return true;
        
        // Inclure selon la priorité et la qualité des données
        if (section.priority === 'high') return true;
        if (section.priority === 'medium' && analysisResult.quality.completeness > 0.6) return true;
        if (section.priority === 'low' && analysisResult.quality.completeness > 0.8) return true;
        
        return false;
    }

    /**
     * Génère le contenu d'une section spécifique
     */
    async generateSectionContent(section, analysisResult, responseStructure) {
        switch (section.type) {
            case 'introduction':
                return this.generateIntroduction(analysisResult, responseStructure);
            case 'solution':
                return this.generateSolution(analysisResult);
            case 'code':
                return this.generateCodeContent(analysisResult);
            case 'explanation':
                return this.generateExplanation(analysisResult);
            case 'examples':
                return this.generateExamples(analysisResult);
            case 'analysis':
                return this.generateAnalysis(analysisResult);
            case 'findings':
                return this.generateFindings(analysisResult);
            case 'content':
                return this.generateMainContent(analysisResult);
            case 'details':
                return this.generateDetails(analysisResult);
            case 'metadata':
                return this.generateMetadata(analysisResult);
            default:
                return this.generateGenericContent(section, analysisResult);
        }
    }

    /**
     * Génère l'introduction
     */
    generateIntroduction(analysisResult, responseStructure) {
        const confidence = analysisResult.confidence;
        const sourceCount = analysisResult.sourceCount;
        
        let intro = `Voici une réponse synthétisée basée sur l'analyse de ${sourceCount} source${sourceCount > 1 ? 's' : ''} de données`;
        
        if (confidence > 0.8) {
            intro += ' avec un haut niveau de confiance.';
        } else if (confidence > 0.6) {
            intro += ' avec un niveau de confiance modéré.';
        } else {
            intro += '. Veuillez noter que le niveau de confiance est limité.';
        }

        return {
            content: intro,
            confidence: confidence,
            metadata: { type: 'introduction', generated: true }
        };
    }

    /**
     * Génère la solution (pour les prompts de type coding)
     */
    generateSolution(analysisResult) {
        const mainContent = analysisResult.mainContent;
        if (!mainContent || mainContent.length === 0) {
            return { content: 'Aucune solution spécifique trouvée dans les données collectées.', confidence: 0.3 };
        }

        // Prendre le contenu principal le plus confiant
        const bestSolution = mainContent[0];
        
        return {
            content: this.formatSolutionContent(bestSolution),
            confidence: bestSolution.confidence || bestSolution.normalizedWeight || 0.5,
            source: bestSolution.sourceId,
            metadata: { type: 'solution', generated: true }
        };
    }

    /**
     * Génère le contenu code
     */
    generateCodeContent(analysisResult) {
        const codeBlocks = this.extractCodeBlocks(analysisResult);
        
        if (codeBlocks.length === 0) {
            return { content: 'Aucun code spécifique trouvé dans les données collectées.', confidence: 0.3 };
        }

        const formattedCode = codeBlocks.map(block => this.formatCodeBlock(block)).join('\n\n');
        
        return {
            content: formattedCode,
            confidence: this.calculateAverageConfidence(codeBlocks),
            blocks: codeBlocks.length,
            metadata: { type: 'code', generated: true }
        };
    }

    /**
     * Génère l'explication
     */
    generateExplanation(analysisResult) {
        const supportingData = analysisResult.supportingData;
        const evidence = analysisResult.evidence;
        
        let explanation = '';
        
        if (supportingData.length > 0) {
            explanation += '**Explication détaillée:**\n\n';
            supportingData.slice(0, 3).forEach((data, index) => {
                explanation += `${index + 1}. ${this.formatExplanationPoint(data)}\n\n`;
            });
        }
        
        if (evidence.length > 0) {
            explanation += '**Preuves et références:**\n\n';
            evidence.slice(0, 2).forEach((ev, index) => {
                explanation += `- ${this.formatEvidence(ev)}\n`;
            });
        }

        return {
            content: explanation || 'Aucune explication détaillée disponible.',
            confidence: this.calculateContentConfidence(supportingData.concat(evidence)),
            metadata: { type: 'explanation', generated: true }
        };
    }

    /**
     * Génère des exemples
     */
    generateExamples(analysisResult) {
        const examples = this.extractExamples(analysisResult);
        
        if (examples.length === 0) {
            return { content: 'Aucun exemple spécifique trouvé.', confidence: 0.3 };
        }

        let exampleContent = '**Exemples:**\n\n';
        examples.slice(0, 3).forEach((example, index) => {
            exampleContent += `**Exemple ${index + 1}:**\n${this.formatExample(example)}\n\n`;
        });

        return {
            content: exampleContent,
            confidence: this.calculateAverageConfidence(examples),
            count: examples.length,
            metadata: { type: 'examples', generated: true }
        };
    }

    /**
     * Génère l'analyse
     */
    generateAnalysis(analysisResult) {
        const quality = analysisResult.quality;
        const coverage = analysisResult.coverage;
        
        let analysis = '**Analyse des données:**\n\n';
        analysis += `- **Complétude:** ${(quality.completeness * 100).toFixed(1)}%\n`;
        analysis += `- **Cohérence:** ${(quality.consistency * 100).toFixed(1)}%\n`;
        analysis += `- **Fiabilité:** ${(quality.reliability * 100).toFixed(1)}%\n`;
        
        if (coverage.coverage !== undefined) {
            analysis += `- **Couverture du sujet:** ${(coverage.coverage * 100).toFixed(1)}%\n`;
        }

        return {
            content: analysis,
            confidence: (quality.completeness + quality.consistency + quality.reliability) / 3,
            metadata: { type: 'analysis', generated: true }
        };
    }

    /**
     * Génère les résultats
     */
    generateFindings(analysisResult) {
        const mainContent = analysisResult.mainContent;
        const evidence = analysisResult.evidence;
        
        let findings = '**Résultats principaux:**\n\n';
        
        mainContent.slice(0, 3).forEach((content, index) => {
            findings += `${index + 1}. ${this.formatFinding(content)}\n\n`;
        });

        if (evidence.length > 0) {
            findings += '**Preuves supportant ces résultats:**\n\n';
            evidence.slice(0, 2).forEach(ev => {
                findings += `- ${this.formatEvidence(ev)}\n`;
            });
        }

        return {
            content: findings,
            confidence: this.calculateContentConfidence(mainContent),
            metadata: { type: 'findings', generated: true }
        };
    }

    /**
     * Génère le contenu principal générique
     */
    generateMainContent(analysisResult) {
        const mainContent = analysisResult.mainContent;
        
        if (!mainContent || mainContent.length === 0) {
            return { content: 'Aucun contenu principal trouvé.', confidence: 0.3 };
        }

        let content = '';
        mainContent.slice(0, 5).forEach((item, index) => {
            content += this.formatMainContentItem(item, index + 1);
            content += '\n\n';
        });

        return {
            content: content.trim(),
            confidence: this.calculateContentConfidence(mainContent),
            items: mainContent.length,
            metadata: { type: 'main_content', generated: true }
        };
    }

    /**
     * Génère les détails
     */
    generateDetails(analysisResult) {
        const supportingData = analysisResult.supportingData;
        const alternatives = analysisResult.alternatives;
        
        let details = '';
        
        if (supportingData.length > 0) {
            details += '**Informations supplémentaires:**\n\n';
            supportingData.forEach((data, index) => {
                details += `- ${this.formatDetailItem(data)}\n`;
            });
            details += '\n';
        }
        
        if (alternatives.length > 0) {
            details += '**Approches alternatives:**\n\n';
            alternatives.forEach((alt, index) => {
                details += `- ${this.formatAlternative(alt)}\n`;
            });
        }

        return {
            content: details || 'Aucun détail supplémentaire disponible.',
            confidence: this.calculateContentConfidence(supportingData.concat(alternatives)),
            metadata: { type: 'details', generated: true }
        };
    }

    /**
     * Génère les métadonnées
     */
    generateMetadata(analysisResult) {
        const metadata = {
            sources: analysisResult.sourceCount,
            confidence: analysisResult.confidence,
            quality: analysisResult.quality,
            coverage: analysisResult.coverage,
            generated_at: new Date().toISOString(),
            synthesis_agent: this.name
        };

        const content = '**Métadonnées de synthèse:**\n\n```json\n' + 
                       JSON.stringify(metadata, null, 2) + '\n```';

        return {
            content: content,
            confidence: 1.0,
            metadata: { type: 'metadata', generated: true, raw: metadata }
        };
    }

    /**
     * Génère du contenu générique
     */
    generateGenericContent(section, analysisResult) {
        return {
            content: `Contenu pour la section "${section.title}" en cours de développement.`,
            confidence: 0.5,
            metadata: { type: section.type, generated: true, placeholder: true }
        };
    }

    /**
     * Formate la sortie finale
     */
    formatOutput(generatedContent, refinedPrompt) {
        console.log('🎨 Formatage de la sortie...');

        let formattedOutput = '';
        
        if (this.config.outputFormat === 'markdown') {
            formattedOutput = this.formatAsMarkdown(generatedContent);
        } else if (this.config.outputFormat === 'html') {
            formattedOutput = this.formatAsHTML(generatedContent);
        } else {
            formattedOutput = this.formatAsPlainText(generatedContent);
        }

        this.synthesisMetrics.outputLength = formattedOutput.length;

        // Vérifier la longueur maximale
        if (formattedOutput.length > this.config.maxOutputLength) {
            formattedOutput = this.truncateOutput(formattedOutput);
        }

        console.log(`✅ Sortie formatée: ${formattedOutput.length} caractères`);
        return formattedOutput;
    }

    /**
     * Formate en Markdown
     */
    formatAsMarkdown(generatedContent) {
        let markdown = '';

        // Titre principal
        markdown += '# Réponse Synthétisée\n\n';

        // Sections dans l'ordre logique
        const sectionOrder = ['introduction', 'solution', 'code', 'content', 'analysis', 'findings', 
                            'explanation', 'examples', 'details', 'metadata'];

        for (const sectionType of sectionOrder) {
            if (generatedContent[sectionType]) {
                const section = generatedContent[sectionType];
                markdown += this.formatMarkdownSection(sectionType, section);
                markdown += '\n\n';
            }
        }

        return markdown.trim();
    }

    /**
     * Formate une section en Markdown
     */
    formatMarkdownSection(sectionType, section) {
        const titles = {
            introduction: 'Introduction',
            solution: 'Solution',
            code: 'Code',
            content: 'Contenu Principal',
            analysis: 'Analyse',
            findings: 'Résultats',
            explanation: 'Explication',
            examples: 'Exemples',
            details: 'Détails',
            metadata: 'Métadonnées'
        };

        let formatted = '';
        
        if (sectionType !== 'introduction') {
            formatted += `## ${titles[sectionType] || sectionType}\n\n`;
        }
        
        formatted += section.content;
        
        if (section.confidence < 0.6) {
            formatted += `\n\n*Note: Niveau de confiance modéré (${(section.confidence * 100).toFixed(1)}%)*`;
        }

        return formatted;
    }

    /**
     * Formate en HTML
     */
    formatAsHTML(generatedContent) {
        let html = '<div class="synthesized-response">\n';
        html += '<h1>Réponse Synthétisée</h1>\n';

        for (const [sectionType, section] of Object.entries(generatedContent)) {
            html += this.formatHTMLSection(sectionType, section);
        }

        html += '</div>';
        return html;
    }

    /**
     * Formate en texte brut
     */
    formatAsPlainText(generatedContent) {
        let text = 'RÉPONSE SYNTHÉTISÉE\n';
        text += '='.repeat(50) + '\n\n';

        for (const [sectionType, section] of Object.entries(generatedContent)) {
            text += this.formatPlainTextSection(sectionType, section);
            text += '\n\n';
        }

        return text;
    }

    /**
     * Effectue les contrôles qualité
     */
    performQualityChecks(formattedOutput, analysisResult) {
        console.log('🔍 Contrôles qualité...');

        const checks = {
            coherence: this.checkCoherence(formattedOutput, analysisResult),
            completeness: this.checkCompleteness(formattedOutput, analysisResult),
            formatting: this.checkFormatting(formattedOutput),
            length: this.checkLength(formattedOutput),
            confidence: this.checkOverallConfidence(analysisResult)
        };

        const issues = [];
        let totalScore = 0;
        let passedChecks = 0;

        for (const [checkName, result] of Object.entries(checks)) {
            if (result.passed) {
                passedChecks++;
            } else {
                issues.push({
                    type: checkName,
                    message: result.message,
                    severity: result.severity || 'medium'
                });
            }
            totalScore += result.score;
        }

        const overallScore = totalScore / Object.keys(checks).length;
        const passed = overallScore >= this.config.coherenceThreshold;

        this.synthesisMetrics.coherenceScore = checks.coherence.score;
        this.synthesisMetrics.completenessScore = checks.completeness.score;
        this.synthesisMetrics.qualityScore = overallScore;

        console.log(`✅ Contrôles qualité: ${passedChecks}/${Object.keys(checks).length} réussis, score: ${overallScore.toFixed(2)}`);

        return {
            passed: passed,
            score: overallScore,
            issues: issues,
            details: checks
        };
    }

    /**
     * Vérifie la cohérence
     */
    checkCoherence(output, analysisResult) {
        const words = output.split(/\s+/).length;
        const expectedMinWords = 50; // Minimum attendu
        
        if (words < expectedMinWords) {
            return {
                passed: false,
                score: 0.3,
                message: 'Réponse trop courte pour être cohérente',
                severity: 'high'
            };
        }

        // Vérifier la cohérence thématique (simplifié)
        const confidence = analysisResult.confidence;
        const coherenceScore = confidence > 0.7 ? 0.9 : confidence > 0.5 ? 0.7 : 0.5;

        return {
            passed: coherenceScore >= this.config.coherenceThreshold,
            score: coherenceScore,
            message: coherenceScore >= this.config.coherenceThreshold ? 'Cohérence acceptable' : 'Cohérence insuffisante'
        };
    }

    /**
     * Vérifie la complétude
     */
    checkCompleteness(output, analysisResult) {
        const completeness = analysisResult.quality?.completeness || 0.5;
        const hasMainSections = output.includes('##') || output.includes('**');
        
        const completenessScore = completeness * (hasMainSections ? 1.0 : 0.8);

        return {
            passed: completenessScore >= 0.6,
            score: completenessScore,
            message: completenessScore >= 0.6 ? 'Complétude acceptable' : 'Réponse incomplète'
        };
    }

    /**
     * Vérifie le formatage
     */
    checkFormatting(output) {
        const hasStructure = output.includes('##') || output.includes('**') || output.includes('\n\n');
        const hasCodeBlocks = this.config.includeCodeBlocks ? output.includes('```') : true;
        
        const formattingScore = hasStructure && hasCodeBlocks ? 1.0 : 0.7;

        return {
            passed: formattingScore >= 0.7,
            score: formattingScore,
            message: formattingScore >= 0.7 ? 'Formatage correct' : 'Formatage à améliorer'
        };
    }

    /**
     * Vérifie la longueur
     */
    checkLength(output) {
        const length = output.length;
        const minLength = 100;
        const maxLength = this.config.maxOutputLength;
        
        if (length < minLength) {
            return {
                passed: false,
                score: 0.3,
                message: 'Réponse trop courte',
                severity: 'medium'
            };
        }
        
        if (length > maxLength) {
            return {
                passed: false,
                score: 0.7,
                message: 'Réponse trop longue',
                severity: 'low'
            };
        }

        return {
            passed: true,
            score: 1.0,
            message: 'Longueur appropriée'
        };
    }

    /**
     * Vérifie la confiance globale
     */
    checkOverallConfidence(analysisResult) {
        const confidence = analysisResult.confidence;
        
        return {
            passed: confidence >= 0.5,
            score: confidence,
            message: confidence >= 0.7 ? 'Haute confiance' : 
                    confidence >= 0.5 ? 'Confiance modérée' : 'Confiance faible',
            severity: confidence < 0.5 ? 'high' : 'low'
        };
    }

    /**
     * Construit la réponse finale
     */
    buildFinalResponse(formattedOutput, qualityChecks, analysisResult) {
        const processingTime = Date.now() - this.synthesisMetrics.startTime;

        return {
            response: formattedOutput,
            quality: qualityChecks,
            metrics: {
                ...this.synthesisMetrics,
                processingTime: processingTime
            },
            analysis: {
                sources: analysisResult.sourceCount,
                confidence: analysisResult.confidence,
                quality: analysisResult.quality
            },
            metadata: {
                agent: this.name,
                timestamp: new Date().toISOString(),
                separationValidated: true,
                config: this.config
            }
        };
    }

    // Méthodes utilitaires de formatage

    formatSolutionContent(solution) {
        return typeof solution.content === 'string' ? solution.content : JSON.stringify(solution.content);
    }

    formatCodeBlock(block) {
        if (typeof block.content === 'string' && block.content.includes('```')) {
            return block.content;
        }
        
        return '```\n' + (typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2)) + '\n```';
    }

    formatExplanationPoint(data) {
        return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    }

    formatEvidence(evidence) {
        return `${evidence.content} (Source: ${evidence.sourceId}, Confiance: ${(evidence.confidence * 100).toFixed(1)}%)`;
    }

    formatExample(example) {
        return typeof example.content === 'string' ? example.content : JSON.stringify(example.content, null, 2);
    }

    formatFinding(content) {
        return typeof content.content === 'string' ? content.content : JSON.stringify(content.content);
    }

    formatMainContentItem(item, index) {
        const confidence = item.confidence || item.normalizedWeight || 0.5;
        const content = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
        
        return `**Point ${index}:** ${content} *(Confiance: ${(confidence * 100).toFixed(1)}%)*`;
    }

    formatDetailItem(data) {
        return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    }

    formatAlternative(alt) {
        return typeof alt.content === 'string' ? alt.content : JSON.stringify(alt.content);
    }

    // Méthodes utilitaires d'extraction

    extractCodeBlocks(analysisResult) {
        const blocks = [];
        
        // Rechercher dans le contenu principal
        for (const content of analysisResult.mainContent) {
            if (this.containsCode(content)) {
                blocks.push(content);
            }
        }
        
        // Rechercher dans les preuves
        for (const evidence of analysisResult.evidence) {
            if (this.containsCode(evidence)) {
                blocks.push(evidence);
            }
        }
        
        return blocks;
    }

    extractExamples(analysisResult) {
        const examples = [];
        
        // Rechercher dans les données de support
        for (const data of analysisResult.supportingData) {
            if (this.isExample(data)) {
                examples.push(data);
            }
        }
        
        return examples;
    }

    containsCode(content) {
        const codeIndicators = ['function', 'class', 'def ', 'var ', 'let ', 'const ', '{', '}', '()', 'import ', 'export '];
        const text = typeof content.content === 'string' ? content.content : JSON.stringify(content.content);
        
        return codeIndicators.some(indicator => text.toLowerCase().includes(indicator));
    }

    isExample(content) {
        const exampleIndicators = ['exemple', 'example', 'par exemple', 'for example', 'voici', 'here is'];
        const text = typeof content.content === 'string' ? content.content : JSON.stringify(content.content);
        
        return exampleIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()));
    }

    calculateAverageConfidence(items) {
        if (items.length === 0) return 0;
        
        const total = items.reduce((sum, item) => sum + (item.confidence || 0.5), 0);
        return total / items.length;
    }

    calculateContentConfidence(contentArray) {
        if (contentArray.length === 0) return 0.5;
        
        const confidences = contentArray.map(item => item.confidence || item.normalizedWeight || 0.5);
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    truncateOutput(output) {
        const maxLength = this.config.maxOutputLength;
        if (output.length <= maxLength) return output;
        
        const truncated = output.substring(0, maxLength - 100);
        return truncated + '\n\n*[Réponse tronquée pour respecter la limite de longueur]*';
    }

    /**
     * Obtient le statut de l'agent
     */
    getStatus() {
        return {
            name: this.name,
            status: 'ready',
            config: this.config,
            metrics: this.synthesisMetrics,
            separationValidated: true,
            capabilities: [
                'content_synthesis',
                'quality_checking',
                'output_formatting',
                'coherence_validation',
                'metadata_generation'
            ]
        };
    }
}

module.exports = SynthesisAgent;