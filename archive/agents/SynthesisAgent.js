/**
 * SynthesisAgent.js
 * Agent responsable de la synthèse finale et de la production de la réponse complète
 * Fusionne tous les résultats pour créer une réponse cohérente et complète
 */

const AgentBase = require('./base/AgentBase');

class SynthesisAgent extends AgentBase {
    constructor() {
        super(
            'SynthesisAgent',
            'Rédacteur Technique et Synthétiseur de Solutions',
            ['content_synthesis', 'technical_writing', 'solution_integration', 'quality_finalization']
        );
    }

    /**
     * Synthétise tous les résultats du workflow pour produire la réponse finale
     * @param {Object} input - Contient tous les résultats des agents précédents
     * @returns {Promise<Object>} - Réponse finale synthétisée
     */
    async process(input) {
        const { 
            originalPrompt, 
            promptRefinement, 
            distributionResults, 
            collectionSynthesis, 
            innovations, 
            verification,
            taskType = 'general'
        } = input;

        if (!originalPrompt) {
            throw new Error('Prompt original requis pour la synthèse');
        }

        this.log(`Synthèse finale pour la tâche: ${taskType}`);

        // Analyse de l'ensemble du workflow
        const workflowAnalysis = this.analyzeWorkflow(input);
        
        // Création de la structure de réponse
        const responseStructure = this.createResponseStructure(input, workflowAnalysis);
        
        // Synthèse du contenu principal
        const mainContent = this.synthesizeMainContent(input, responseStructure);
        
        // Génération des recommandations finales
        const finalRecommendations = this.generateFinalRecommendations(input);
        
        // Création du résumé exécutif
        const executiveSummary = this.createExecutiveSummary(input, mainContent);
        
        // Compilation des annexes et détails techniques
        const appendices = this.compileAppendices(input);
        
        // Métriques de qualité finale
        const qualityMetrics = this.calculateFinalQualityMetrics(input, mainContent);

        const result = {
            // Métadonnées de la synthèse
            synthesis_metadata: {
                original_prompt: originalPrompt,
                task_type: taskType,
                processing_timestamp: new Date().toISOString(),
                workflow_quality_score: workflowAnalysis.overall_quality,
                synthesis_confidence: qualityMetrics.overall_confidence,
                agent: this.name
            },

            // Contenu principal de la réponse
            final_response: {
                executive_summary: executiveSummary,
                main_content: mainContent,
                recommendations: finalRecommendations,
                implementation_roadmap: this.createImplementationRoadmap(input),
                quality_assurance: this.createQualityAssurance(verification)
            },

            // Analyse du workflow complet
            workflow_analysis: workflowAnalysis,

            // Métriques et indicateurs
            quality_metrics: qualityMetrics,

            // Annexes et détails techniques
            appendices: appendices,

            // Méta-informations pour suivi
            processing_summary: this.createProcessingSummary(input),
            
            processingTime: this.getProcessingTime()
        };

        this.log(`Synthèse terminée - Confiance: ${Math.round(qualityMetrics.overall_confidence * 100)}%`);
        return result;
    }

    /**
     * Analyse la qualité et cohérence de l'ensemble du workflow
     * @param {Object} input - Toutes les données du workflow
     * @returns {Object} - Analyse du workflow
     */
    analyzeWorkflow(input) {
        const { promptRefinement, distributionResults, collectionSynthesis, innovations, verification } = input;

        const stageQuality = {
            prompt_refinement: this.assessStageQuality(promptRefinement, 'refinement'),
            distribution: this.assessStageQuality(distributionResults, 'distribution'),
            collection: this.assessStageQuality(collectionSynthesis, 'collection'),
            innovation: this.assessStageQuality(innovations, 'innovation'),
            verification: this.assessStageQuality(verification, 'verification')
        };

        const overallQuality = this.calculateOverallWorkflowQuality(stageQuality);
        const workflowCoherence = this.assessWorkflowCoherence(input);
        const dataFlow = this.analyzeDataFlow(input);

        return {
            stage_quality: stageQuality,
            overall_quality: overallQuality,
            workflow_coherence: workflowCoherence,
            data_flow_analysis: dataFlow,
            critical_issues: this.identifyWorkflowIssues(stageQuality),
            success_factors: this.identifySuccessFactors(stageQuality)
        };
    }

    /**
     * Crée la structure optimale pour la réponse finale
     * @param {Object} input - Données du workflow
     * @param {Object} workflowAnalysis - Analyse du workflow
     * @returns {Object} - Structure de réponse recommandée
     */
    createResponseStructure(input, workflowAnalysis) {
        const { taskType, verification } = input;
        
        const structure = {
            response_type: this.determineResponseType(taskType, verification),
            content_organization: this.determineContentOrganization(taskType),
            detail_level: this.determineDetailLevel(workflowAnalysis.overall_quality),
            format_preferences: this.determineFormatPreferences(taskType),
            sections: this.defineSections(taskType, workflowAnalysis)
        };

        return structure;
    }

    /**
     * Synthétise le contenu principal de la réponse
     * @param {Object} input - Données du workflow
     * @param {Object} structure - Structure de réponse
     * @returns {Object} - Contenu principal synthétisé
     */
    synthesizeMainContent(input, structure) {
        const { 
            promptRefinement, 
            distributionResults, 
            collectionSynthesis, 
            innovations, 
            verification 
        } = input;

        const content = {
            // Réponse directe à la question originale
            direct_answer: this.generateDirectAnswer(input),
            
            // Contexte et clarifications
            context_and_background: this.synthesizeContextAndBackground(promptRefinement, collectionSynthesis),
            
            // Solutions et approches recommandées
            recommended_solutions: this.synthesizeRecommendedSolutions(collectionSynthesis, innovations, verification),
            
            // Détails techniques et implémentation
            technical_details: this.synthesizeTechnicalDetails(distributionResults, innovations),
            
            // Considérations et alternatives
            considerations_and_alternatives: this.synthesizeConsiderations(collectionSynthesis, innovations),
            
            // Prochaines étapes
            next_steps: this.synthesizeNextSteps(innovations, verification)
        };

        return content;
    }

    /**
     * Génère les recommandations finales consolidées
     * @param {Object} input - Données du workflow
     * @returns {Array} - Recommandations finales
     */
    generateFinalRecommendations(input) {
        const { collectionSynthesis, innovations, verification } = input;

        const recommendations = [];

        // Recommandations de la synthèse de collection
        if (collectionSynthesis?.synthesis?.recommended_actions) {
            recommendations.push(...collectionSynthesis.synthesis.recommended_actions.map(action => ({
                source: 'collection',
                type: 'analysis_based',
                priority: 'high',
                recommendation: action,
                rationale: 'Basé sur l\'analyse des sources multiples'
            })));
        }

        // Recommandations d'innovation
        if (innovations?.recommendations) {
            const innovationRecs = [
                ...innovations.recommendations.immediate_actions || [],
                ...innovations.recommendations.quick_wins?.map(qw => qw.title) || []
            ];
            
            recommendations.push(...innovationRecs.map(rec => ({
                source: 'innovation',
                type: 'improvement',
                priority: 'medium',
                recommendation: rec,
                rationale: 'Opportunité d\'amélioration identifiée'
            })));
        }

        // Recommandations de vérification
        if (verification?.recommendations) {
            recommendations.push(...verification.recommendations.map(rec => ({
                source: 'verification',
                type: 'quality_assurance',
                priority: 'high',
                recommendation: rec,
                rationale: 'Validation et contrôle qualité'
            })));
        }

        // Tri par priorité et déduplication
        const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
        return this.prioritizeRecommendations(uniqueRecommendations);
    }

    /**
     * Crée un résumé exécutif de la solution complète
     * @param {Object} input - Données du workflow
     * @param {Object} mainContent - Contenu principal
     * @returns {Object} - Résumé exécutif
     */
    createExecutiveSummary(input, mainContent) {
        const { originalPrompt, taskType, verification } = input;

        const summary = {
            original_request: this.summarizeOriginalRequest(originalPrompt),
            solution_overview: this.createSolutionOverview(mainContent),
            key_findings: this.extractKeyFindings(input),
            main_recommendations: this.extractMainRecommendations(mainContent),
            implementation_complexity: this.assessImplementationComplexity(input),
            expected_outcomes: this.predictExpectedOutcomes(input),
            confidence_level: verification?.verification_metrics?.overall_confidence || 0.8,
            next_actions: this.identifyImmediateActions(input)
        };

        return summary;
    }

    /**
     * Compile les annexes et détails techniques
     * @param {Object} input - Données du workflow
     * @returns {Object} - Annexes compilées
     */
    compileAppendices(input) {
        const { promptRefinement, distributionResults, collectionSynthesis, innovations, verification } = input;

        const appendices = {
            // Détails du processus d'affinement
            prompt_analysis: {
                original_prompt: promptRefinement?.originalPrompt,
                refined_prompt: promptRefinement?.refinedPrompt,
                analysis_details: promptRefinement?.analysis,
                suggestions_applied: promptRefinement?.suggestions
            },

            // Détails de la distribution
            source_details: {
                sources_queried: distributionResults?.sourcesUsed || [],
                distribution_efficiency: distributionResults?.efficiency,
                response_times: this.extractResponseTimes(distributionResults)
            },

            // Métriques de collecte
            collection_metrics: {
                data_quality: collectionSynthesis?.qualityAssessment,
                source_correlation: collectionSynthesis?.sourceCorrelation,
                key_findings_detail: collectionSynthesis?.keyFindings
            },

            // Détails d'innovation
            innovation_details: {
                opportunities_identified: innovations?.opportunities?.length || 0,
                improvements_proposed: innovations?.improvements?.length || 0,
                innovation_metrics: innovations?.innovationMetrics,
                risk_analysis: innovations?.riskAnalysis
            },

            // Rapport de vérification complet
            verification_report: {
                verification_summary: verification?.verification_summary,
                quality_tests: verification?.quality_tests,
                compliance_analysis: verification?.compliance_analysis,
                performance_tests: verification?.performance_tests
            },

            // Métriques techniques
            technical_metrics: this.compileTechnicalMetrics(input)
        };

        return appendices;
    }

    /**
     * Calcule les métriques de qualité finale
     * @param {Object} input - Données du workflow
     * @param {Object} mainContent - Contenu principal
     * @returns {Object} - Métriques de qualité
     */
    calculateFinalQualityMetrics(input, mainContent) {
        const { verification, collectionSynthesis, innovations } = input;

        const metrics = {
            // Confiance globale
            overall_confidence: this.calculateOverallConfidence(input),
            
            // Complétude de la réponse
            response_completeness: this.assessResponseCompleteness(mainContent),
            
            // Qualité technique
            technical_quality: verification?.final_validation?.overall_score / 100 || 0.8,
            
            // Niveau d'innovation
            innovation_level: this.assessInnovationLevel(innovations),
            
            // Cohérence de la solution
            solution_coherence: this.assessSolutionCoherence(input),
            
            // Applicabilité pratique
            practical_applicability: this.assessPracticalApplicability(input),
            
            // Score de satisfaction estimé
            estimated_satisfaction: this.estimateUserSatisfaction(input, mainContent)
        };

        return metrics;
    }

    // Méthodes d'implémentation spécialisées

    assessStageQuality(stageData, stageType) {
        if (!stageData) return { score: 0, status: 'missing', issues: ['Données manquantes'] };

        const qualityIndicators = {
            refinement: () => ({
                score: stageData.confidence || 0.8,
                completeness: stageData.refinedPrompt ? 1 : 0,
                effectiveness: stageData.suggestions?.length > 0 ? 0.9 : 0.6
            }),
            distribution: () => ({
                score: stageData.efficiency?.overall_score || 0.8,
                completeness: stageData.sourcesUsed?.length > 0 ? 1 : 0,
                effectiveness: stageData.aggregatedResult?.reliability_score || 0.7
            }),
            collection: () => ({
                score: stageData.qualityAssessment?.overall_quality || 0.8,
                completeness: stageData.keyFindings?.length > 0 ? 1 : 0,
                effectiveness: stageData.synthesis?.confidence_level || 0.7
            }),
            innovation: () => ({
                score: stageData.innovationMetrics?.innovation_potential || 0.8,
                completeness: stageData.improvements?.length > 0 ? 1 : 0,
                effectiveness: stageData.riskAnalysis?.success_probability || 0.7
            }),
            verification: () => ({
                score: stageData.final_validation?.overall_score / 100 || 0.8,
                completeness: stageData.verification_summary ? 1 : 0,
                effectiveness: stageData.verification_metrics?.overall_confidence || 0.7
            })
        };

        const indicators = qualityIndicators[stageType]?.() || { score: 0.5, completeness: 0.5, effectiveness: 0.5 };
        const overallScore = (indicators.score + indicators.completeness + indicators.effectiveness) / 3;

        return {
            score: overallScore,
            status: overallScore > 0.8 ? 'excellent' : overallScore > 0.6 ? 'good' : overallScore > 0.4 ? 'acceptable' : 'poor',
            indicators: indicators,
            issues: overallScore < 0.6 ? [`Qualité insuffisante pour ${stageType}`] : []
        };
    }

    calculateOverallWorkflowQuality(stageQuality) {
        const weights = {
            prompt_refinement: 0.15,
            distribution: 0.20,
            collection: 0.25,
            innovation: 0.20,
            verification: 0.20
        };

        const weightedScore = Object.entries(weights).reduce((sum, [stage, weight]) => {
            const stageScore = stageQuality[stage]?.score || 0;
            return sum + (stageScore * weight);
        }, 0);

        return weightedScore;
    }

    assessWorkflowCoherence(input) {
        const coherenceChecks = {
            prompt_to_collection: this.checkPromptToCollectionCoherence(input),
            collection_to_innovation: this.checkCollectionToInnovationCoherence(input),
            innovation_to_verification: this.checkInnovationToVerificationCoherence(input),
            end_to_end_alignment: this.checkEndToEndAlignment(input)
        };

        const overallCoherence = Object.values(coherenceChecks).reduce((sum, score) => sum + score, 0) / Object.keys(coherenceChecks).length;

        return {
            checks: coherenceChecks,
            overall_score: overallCoherence,
            coherence_level: overallCoherence > 0.8 ? 'high' : overallCoherence > 0.6 ? 'medium' : 'low'
        };
    }

    analyzeDataFlow(input) {
        return {
            data_preservation: this.assessDataPreservation(input),
            information_enrichment: this.assessInformationEnrichment(input),
            processing_efficiency: this.assessProcessingEfficiency(input),
            data_quality_evolution: this.trackDataQualityEvolution(input)
        };
    }

    determineResponseType(taskType, verification) {
        const verificationScore = verification?.final_validation?.overall_score || 70;
        
        if (verificationScore >= 85) return 'comprehensive_solution';
        if (verificationScore >= 70) return 'qualified_solution';
        if (verificationScore >= 50) return 'provisional_solution';
        return 'conceptual_approach';
    }

    determineContentOrganization(taskType) {
        const organizations = {
            code: 'technical_first',
            research: 'analytical_structure',
            general: 'problem_solution_structure',
            design: 'creative_structure'
        };
        
        return organizations[taskType] || 'problem_solution_structure';
    }

    determineDetailLevel(qualityScore) {
        if (qualityScore > 0.8) return 'comprehensive';
        if (qualityScore > 0.6) return 'detailed';
        if (qualityScore > 0.4) return 'moderate';
        return 'basic';
    }

    determineFormatPreferences(taskType) {
        return {
            code: ['code_examples', 'step_by_step', 'best_practices'],
            research: ['structured_analysis', 'references', 'methodology'],
            general: ['clear_explanations', 'practical_examples', 'actionable_steps'],
            design: ['visual_descriptions', 'creative_alternatives', 'design_principles']
        }[taskType] || ['clear_explanations', 'practical_examples'];
    }

    defineSections(taskType, workflowAnalysis) {
        const baseSections = [
            'executive_summary',
            'direct_answer',
            'recommended_approach',
            'implementation_guidance'
        ];

        const qualityDependentSections = workflowAnalysis.overall_quality > 0.7 ? [
            'technical_details',
            'alternatives_and_considerations',
            'quality_assurance'
        ] : [];

        const taskSpecificSections = {
            code: ['code_examples', 'testing_approach', 'performance_considerations'],
            research: ['methodology', 'findings', 'references'],
            general: ['background', 'step_by_step_guide'],
            design: ['design_principles', 'creative_alternatives', 'visual_guidelines']
        }[taskType] || [];

        return [...baseSections, ...qualityDependentSections, ...taskSpecificSections];
    }

    generateDirectAnswer(input) {
        const { originalPrompt, collectionSynthesis, innovations } = input;
        
        // Construction d'une réponse directe basée sur la synthèse
        const mainPoints = collectionSynthesis?.synthesis?.main_points || [];
        const topInnovations = innovations?.improvements?.slice(0, 3) || [];

        let directAnswer = `En réponse à votre question "${originalPrompt.substring(0, 100)}..."\n\n`;

        if (mainPoints.length > 0) {
            directAnswer += "Points clés identifiés :\n";
            mainPoints.forEach((point, index) => {
                directAnswer += `${index + 1}. ${point.point || point}\n`;
            });
            directAnswer += "\n";
        }

        if (topInnovations.length > 0) {
            directAnswer += "Améliorations recommandées :\n";
            topInnovations.forEach((improvement, index) => {
                directAnswer += `${index + 1}. ${improvement.title} - ${improvement.description.substring(0, 100)}...\n`;
            });
        }

        return directAnswer || "Réponse synthétisée basée sur l'analyse multi-sources.";
    }

    synthesizeContextAndBackground(promptRefinement, collectionSynthesis) {
        const context = {
            original_context: promptRefinement?.analysis || {},
            enhanced_understanding: collectionSynthesis?.synthesis?.executive_summary || "",
            key_background_elements: collectionSynthesis?.keyFindings?.slice(0, 5) || [],
            domain_insights: this.extractDomainInsights(collectionSynthesis)
        };

        return context;
    }

    synthesizeRecommendedSolutions(collectionSynthesis, innovations, verification) {
        const solutions = {
            primary_solution: this.identifyPrimarySolution(collectionSynthesis, innovations),
            alternative_approaches: this.identifyAlternativeApproaches(innovations),
            implementation_priority: this.determinePriority(innovations, verification),
            risk_mitigation: this.extractRiskMitigation(innovations, verification),
            success_criteria: this.defineSuccessCriteria(verification)
        };

        return solutions;
    }

    synthesizeTechnicalDetails(distributionResults, innovations) {
        const details = {
            technical_specifications: this.extractTechnicalSpecs(distributionResults, innovations),
            implementation_details: this.compileImplementationDetails(innovations),
            performance_considerations: this.extractPerformanceDetails(innovations),
            integration_requirements: this.identifyIntegrationRequirements(innovations),
            testing_approach: this.defineTestingApproach(innovations)
        };

        return details;
    }

    synthesizeConsiderations(collectionSynthesis, innovations) {
        return {
            limitations: collectionSynthesis?.synthesis?.potential_gaps || [],
            trade_offs: this.identifyTradeOffs(innovations),
            assumptions: this.extractAssumptions(collectionSynthesis, innovations),
            dependencies: this.identifyDependencies(innovations),
            alternatives: this.compileAlternatives(innovations)
        };
    }

    synthesizeNextSteps(innovations, verification) {
        const nextSteps = [];

        // Étapes immédiates des innovations
        const immediateActions = innovations?.recommendations?.immediate_actions || [];
        nextSteps.push(...immediateActions.map(action => ({
            action: action,
            timeline: 'immediate',
            priority: 'high',
            source: 'innovation'
        })));

        // Recommandations de vérification
        const verificationSteps = verification?.recommendations || [];
        nextSteps.push(...verificationSteps.map(rec => ({
            action: rec,
            timeline: 'short_term',
            priority: 'medium',
            source: 'verification'
        })));

        return nextSteps.slice(0, 10); // Limiter à 10 étapes max
    }

    createImplementationRoadmap(input) {
        const { innovations, verification } = input;
        
        const roadmap = {
            immediate_phase: {
                duration: '1-2 weeks',
                actions: innovations?.recommendations?.immediate_actions?.slice(0, 3) || []
            },
            short_term_phase: {
                duration: '1-3 months',
                actions: innovations?.recommendations?.short_term_goals?.map(g => g.goal) || []
            },
            long_term_phase: {
                duration: '3-12 months',
                actions: [innovations?.recommendations?.long_term_vision || 'Vision long terme à définir']
            },
            success_metrics: verification?.recommendations?.slice(0, 5) || []
        };

        return roadmap;
    }

    createQualityAssurance(verification) {
        if (!verification) return { level: 'basic', measures: ['Tests manuels recommandés'] };

        return {
            verification_level: verification.verification_summary?.overall_status || 'needs_review',
            quality_score: verification.verification_summary?.score || 0,
            critical_issues: verification.final_validation?.critical_issues?.length || 0,
            measures_implemented: [
                'Vérification de cohérence',
                'Validation des améliorations',
                'Tests de qualité',
                'Analyse de conformité',
                'Évaluation des risques'
            ],
            confidence_level: verification.verification_metrics?.overall_confidence || 0.8
        };
    }

    createProcessingSummary(input) {
        const stages = ['promptRefinement', 'distributionResults', 'collectionSynthesis', 'innovations', 'verification'];
        
        const summary = {
            total_stages: stages.length,
            completed_stages: stages.filter(stage => input[stage]).length,
            processing_times: this.extractProcessingTimes(input),
            data_flow_success: this.assessDataFlowSuccess(input),
            overall_efficiency: this.calculateOverallEfficiency(input)
        };

        return summary;
    }

    // Méthodes utilitaires

    deduplicateRecommendations(recommendations) {
        const seen = new Set();
        return recommendations.filter(rec => {
            const key = rec.recommendation.toLowerCase().substring(0, 50);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    prioritizeRecommendations(recommendations) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return recommendations.sort((a, b) => {
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }).slice(0, 10); // Top 10 recommendations
    }

    summarizeOriginalRequest(originalPrompt) {
        return {
            prompt: originalPrompt,
            length: originalPrompt.length,
            complexity: originalPrompt.split(' ').length > 20 ? 'complex' : 'simple',
            domain: this.identifyDomain(originalPrompt)
        };
    }

    createSolutionOverview(mainContent) {
        return {
            approach: 'Multi-agent analysis and synthesis',
            comprehensiveness: 'comprehensive',
            innovation_level: mainContent.recommended_solutions?.implementation_priority || 'moderate',
            validation_status: 'verified'
        };
    }

    extractKeyFindings(input) {
        const findings = [];
        
        if (input.collectionSynthesis?.keyFindings) {
            findings.push(...input.collectionSynthesis.keyFindings.slice(0, 5).map(f => f.content || f));
        }
        
        if (input.innovations?.opportunities) {
            findings.push(...input.innovations.opportunities.slice(0, 3).map(o => o.description));
        }
        
        return findings.slice(0, 8); // Limiter à 8 findings clés
    }

    extractMainRecommendations(mainContent) {
        const recommendations = [];
        
        if (mainContent.recommended_solutions?.primary_solution) {
            recommendations.push(mainContent.recommended_solutions.primary_solution);
        }
        
        if (mainContent.next_steps) {
            recommendations.push(...mainContent.next_steps.slice(0, 3).map(step => step.action || step));
        }
        
        return recommendations;
    }

    assessImplementationComplexity(input) {
        const innovations = input.innovations?.improvements || [];
        const highComplexityCount = innovations.filter(imp => 
            imp.timeline?.includes('mois') || imp.innovation_score > 0.8
        ).length;
        
        if (highComplexityCount > 3) return 'high';
        if (highComplexityCount > 1) return 'medium';
        return 'low';
    }

    predictExpectedOutcomes(input) {
        const outcomes = [];
        
        if (input.innovations?.improvements) {
            input.innovations.improvements.slice(0, 5).forEach(imp => {
                if (imp.expected_benefits) {
                    outcomes.push(...imp.expected_benefits.slice(0, 2));
                }
            });
        }
        
        outcomes.push('Amélioration de la qualité globale');
        outcomes.push('Optimisation des performances');
        
        return [...new Set(outcomes)].slice(0, 6);
    }

    identifyImmediateActions(input) {
        const actions = [];
        
        if (input.innovations?.recommendations?.immediate_actions) {
            actions.push(...input.innovations.recommendations.immediate_actions.slice(0, 3));
        }
        
        if (input.verification?.recommendations) {
            actions.push(...input.verification.recommendations.slice(0, 2));
        }
        
        return actions.slice(0, 5);
    }

    calculateOverallConfidence(input) {
        const confidenceFactors = [];
        
        if (input.promptRefinement?.confidence) {
            confidenceFactors.push(input.promptRefinement.confidence);
        }
        
        if (input.collectionSynthesis?.synthesis?.confidence_level) {
            confidenceFactors.push(input.collectionSynthesis.synthesis.confidence_level);
        }
        
        if (input.verification?.verification_metrics?.overall_confidence) {
            confidenceFactors.push(input.verification.verification_metrics.overall_confidence);
        }
        
        if (confidenceFactors.length === 0) return 0.7; // Default confidence
        
        return confidenceFactors.reduce((sum, conf) => sum + conf, 0) / confidenceFactors.length;
    }

    assessResponseCompleteness(mainContent) {
        const requiredSections = ['direct_answer', 'recommended_solutions', 'next_steps'];
        const presentSections = requiredSections.filter(section => mainContent[section]);
        
        return presentSections.length / requiredSections.length;
    }

    assessInnovationLevel(innovations) {
        if (!innovations?.innovationMetrics) return 0.5;
        
        return innovations.innovationMetrics.innovation_potential || 0.5;
    }

    assessSolutionCoherence(input) {
        // Évalue la cohérence entre les différents composants de la solution
        let coherenceScore = 0.8; // Base score
        
        // Vérifier l'alignement entre collection et innovation
        if (input.collectionSynthesis && input.innovations) {
            const collectionDomains = new Set();
            const innovationDomains = new Set();
            
            input.collectionSynthesis.keyFindings?.forEach(finding => {
                if (finding.category) collectionDomains.add(finding.category);
            });
            
            input.innovations.improvements?.forEach(improvement => {
                if (improvement.category) innovationDomains.add(improvement.category);
            });
            
            const overlap = [...collectionDomains].filter(domain => innovationDomains.has(domain)).length;
            const totalDomains = Math.max(collectionDomains.size, innovationDomains.size);
            
            if (totalDomains > 0) {
                coherenceScore = overlap / totalDomains;
            }
        }
        
        return coherenceScore;
    }

    assessPracticalApplicability(input) {
        const { innovations, verification } = input;
        
        let applicabilityScore = 0.7; // Base score
        
        // Facteur basé sur les améliorations pratiques
        if (innovations?.improvements) {
            const practicalImprovements = innovations.improvements.filter(imp => 
                imp.timeline && !imp.timeline.includes('6 mois')
            );
            applicabilityScore = practicalImprovements.length / innovations.improvements.length;
        }
        
        // Ajustement basé sur la vérification
        if (verification?.final_validation?.overall_score) {
            const verificationBonus = (verification.final_validation.overall_score / 100) * 0.2;
            applicabilityScore = Math.min(1, applicabilityScore + verificationBonus);
        }
        
        return applicabilityScore;
    }

    estimateUserSatisfaction(input, mainContent) {
        // Estimation basée sur plusieurs facteurs
        const factors = {
            response_completeness: this.assessResponseCompleteness(mainContent),
            solution_quality: input.verification?.verification_metrics?.overall_confidence || 0.7,
            innovation_value: this.assessInnovationLevel(input.innovations),
            practical_value: this.assessPracticalApplicability(input)
        };
        
        const weights = { response_completeness: 0.3, solution_quality: 0.3, innovation_value: 0.2, practical_value: 0.2 };
        
        return Object.entries(weights).reduce((sum, [factor, weight]) => {
            return sum + (factors[factor] * weight);
        }, 0);
    }

    // Méthodes de vérification de cohérence entre étapes

    checkPromptToCollectionCoherence(input) {
        const refinedPrompt = input.promptRefinement?.refinedPrompt || '';
        const collectionSummary = input.collectionSynthesis?.synthesis?.executive_summary || '';
        
        // Simple vérification de cohérence basée sur la longueur et la présence de mots-clés
        if (refinedPrompt.length === 0 || collectionSummary.length === 0) return 0.5;
        
        const promptWords = new Set(refinedPrompt.toLowerCase().split(/\s+/));
        const summaryWords = new Set(collectionSummary.toLowerCase().split(/\s+/));
        
        const intersection = [...promptWords].filter(word => summaryWords.has(word)).length;
        const union = new Set([...promptWords, ...summaryWords]).size;
        
        return intersection / Math.max(union, 1);
    }

    checkCollectionToInnovationCoherence(input) {
        const collectionFindings = input.collectionSynthesis?.keyFindings || [];
        const innovations = input.innovations?.improvements || [];
        
        if (collectionFindings.length === 0 || innovations.length === 0) return 0.5;
        
        // Vérifier si les innovations adressent les findings
        const relevantInnovations = innovations.filter(innovation => 
            collectionFindings.some(finding => 
                finding.category === innovation.category ||
                (finding.content && innovation.description && 
                 finding.content.toLowerCase().includes(innovation.category?.toLowerCase()))
            )
        );
        
        return relevantInnovations.length / innovations.length;
    }

    checkInnovationToVerificationCoherence(input) {
        const innovations = input.innovations?.improvements || [];
        const verificationScore = input.verification?.final_validation?.overall_score || 0;
        
        if (innovations.length === 0) return 0.5;
        
        // La cohérence est élevée si la vérification valide bien les innovations
        return Math.min(1, verificationScore / 100 + 0.2);
    }

    checkEndToEndAlignment(input) {
        const originalPrompt = input.originalPrompt || '';
        const finalRecommendations = input.innovations?.recommendations?.immediate_actions || [];
        
        if (originalPrompt.length === 0 || finalRecommendations.length === 0) return 0.5;
        
        // Vérification simplifiée de l'alignement fin-à-fin
        return 0.8; // Score par défaut pour l'alignement global
    }

    // Méthodes d'évaluation de flux de données

    assessDataPreservation(input) {
        const originalPrompt = input.originalPrompt;
        const finalSynthesis = input.verification?.verification_summary;
        
        // Vérifier que les informations clés du prompt original sont préservées
        return originalPrompt && finalSynthesis ? 0.9 : 0.6;
    }

    assessInformationEnrichment(input) {
        const stages = ['promptRefinement', 'distributionResults', 'collectionSynthesis', 'innovations'];
        const enrichmentLevels = stages.map(stage => {
            const stageData = input[stage];
            return stageData ? Object.keys(stageData).length : 0;
        });
        
        // Plus d'étapes avec plus de données = meilleur enrichissement
        const totalEnrichment = enrichmentLevels.reduce((sum, level) => sum + level, 0);
        return Math.min(1, totalEnrichment / 100); // Normaliser
    }

    assessProcessingEfficiency(input) {
        const processingTimes = this.extractProcessingTimes(input);
        const totalTime = processingTimes.reduce((sum, time) => sum + time, 0);
        
        // Efficacité basée sur le temps total (mock)
        return totalTime < 10000 ? 0.9 : totalTime < 20000 ? 0.7 : 0.5;
    }

    trackDataQualityEvolution(input) {
        return {
            initial_quality: 0.6, // Qualité du prompt initial
            refined_quality: input.promptRefinement?.confidence || 0.7,
            collected_quality: input.collectionSynthesis?.qualityAssessment?.overall_quality || 0.8,
            final_quality: input.verification?.verification_metrics?.overall_confidence || 0.8
        };
    }

    extractProcessingTimes(input) {
        const times = [];
        
        Object.values(input).forEach(stageData => {
            if (stageData && typeof stageData === 'object' && stageData.processingTime) {
                times.push(stageData.processingTime);
            }
        });
        
        return times;
    }

    assessDataFlowSuccess(input) {
        const requiredStages = ['promptRefinement', 'distributionResults', 'collectionSynthesis', 'innovations', 'verification'];
        const presentStages = requiredStages.filter(stage => input[stage]);
        
        return presentStages.length / requiredStages.length;
    }

    calculateOverallEfficiency(input) {
        const dataFlowSuccess = this.assessDataFlowSuccess(input);
        const processingEfficiency = this.assessProcessingEfficiency(input);
        
        return (dataFlowSuccess + processingEfficiency) / 2;
    }

    extractResponseTimes(distributionResults) {
        if (!distributionResults?.distributionResults) return [];
        
        return distributionResults.distributionResults.map(result => ({
            source: result.source?.name || 'unknown',
            time: result.responseTime || 0
        }));
    }

    compileTechnicalMetrics(input) {
        return {
            total_processing_time: this.extractProcessingTimes(input).reduce((sum, time) => sum + time, 0),
            sources_consulted: input.distributionResults?.sourcesUsed?.length || 0,
            improvements_identified: input.innovations?.improvements?.length || 0,
            verification_score: input.verification?.final_validation?.overall_score || 0,
            data_quality_score: input.collectionSynthesis?.qualityAssessment?.overall_quality || 0
        };
    }

    // Méthodes utilitaires finales

    identifyDomain(prompt) {
        const domains = {
            'code': ['code', 'programming', 'function', 'class', 'javascript', 'python'],
            'design': ['design', 'ui', 'ux', 'interface', 'user', 'visual'],
            'research': ['research', 'study', 'analysis', 'data', 'investigation'],
            'business': ['business', 'strategy', 'market', 'revenue', 'profit']
        };
        
        const lowerPrompt = prompt.toLowerCase();
        
        for (const [domain, keywords] of Object.entries(domains)) {
            if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
                return domain;
            }
        }
        
        return 'general';
    }

    identifyWorkflowIssues(stageQuality) {
        const issues = [];
        
        Object.entries(stageQuality).forEach(([stage, quality]) => {
            if (quality.score < 0.5) {
                issues.push({
                    stage: stage,
                    severity: 'high',
                    description: `Qualité insuffisante pour ${stage}: ${Math.round(quality.score * 100)}%`,
                    issues: quality.issues || []
                });
            } else if (quality.score < 0.7) {
                issues.push({
                    stage: stage,
                    severity: 'medium',
                    description: `Qualité modérée pour ${stage}: ${Math.round(quality.score * 100)}%`,
                    issues: quality.issues || []
                });
            }
        });
        
        return issues;
    }

    identifySuccessFactors(stageQuality) {
        const successFactors = [];
        
        Object.entries(stageQuality).forEach(([stage, quality]) => {
            if (quality.score > 0.8) {
                successFactors.push({
                    stage: stage,
                    factor: `Excellente performance de ${stage}`,
                    score: quality.score,
                    status: quality.status
                });
            }
        });
        
        return successFactors;
    }

    extractTechnicalSpecs(distributionResults, innovations) {
        const specs = [];
        
        if (distributionResults?.distributionResults) {
            distributionResults.distributionResults.forEach(result => {
                if (result.success && result.data?.type === 'code_generation') {
                    specs.push({
                        source: result.source.name,
                        type: 'code_specification',
                        content: result.data.content?.substring(0, 100) + '...'
                    });
                }
            });
        }
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                if (improvement.category === 'technical') {
                    specs.push({
                        source: 'innovation',
                        type: 'improvement_specification',
                        content: improvement.description?.substring(0, 100) + '...'
                    });
                }
            });
        }
        
        return specs;
    }

    compileImplementationDetails(innovations) {
        const details = [];
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                if (improvement.implementation) {
                    details.push({
                        improvement: improvement.title,
                        steps: improvement.implementation,
                        timeline: improvement.timeline,
                        priority: improvement.priority
                    });
                }
            });
        }
        
        return details;
    }

    extractPerformanceDetails(innovations) {
        const perfDetails = {
            optimizations: [],
            metrics: [],
            benchmarks: []
        };
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                if (improvement.category === 'performance') {
                    perfDetails.optimizations.push({
                        title: improvement.title,
                        description: improvement.description,
                        expected_improvement: improvement.expected_benefits?.[0] || 'Performance boost'
                    });
                }
            });
        }
        
        return perfDetails;
    }

    identifyIntegrationRequirements(innovations) {
        const requirements = [];
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                if (improvement.requirements) {
                    requirements.push({
                        improvement: improvement.title,
                        requirements: improvement.requirements,
                        category: improvement.category
                    });
                }
            });
        }
        
        return requirements;
    }

    defineTestingApproach(innovations) {
        const approach = {
            unit_tests: [],
            integration_tests: [],
            performance_tests: [],
            security_tests: []
        };
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                const category = improvement.category;
                
                if (category === 'performance') {
                    approach.performance_tests.push(`Test performance for ${improvement.title}`);
                } else if (category === 'security') {
                    approach.security_tests.push(`Security validation for ${improvement.title}`);
                } else {
                    approach.unit_tests.push(`Unit tests for ${improvement.title}`);
                }
            });
        }
        
        return approach;
    }

    identifyTradeOffs(innovations) {
        const tradeOffs = [];
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                if (improvement.category === 'performance' && improvement.innovation_score > 0.7) {
                    tradeOffs.push({
                        improvement: improvement.title,
                        tradeoff: 'Performance vs Complexity',
                        description: 'Higher performance may increase system complexity'
                    });
                }
                
                if (improvement.timeline?.includes('mois')) {
                    tradeOffs.push({
                        improvement: improvement.title,
                        tradeoff: 'Timeline vs Quality',
                        description: 'Longer implementation time for higher quality'
                    });
                }
            });
        }
        
        return tradeOffs;
    }

    extractAssumptions(collectionSynthesis, innovations) {
        const assumptions = [];
        
        assumptions.push('System has adequate resources for implementation');
        assumptions.push('Technical team has required expertise');
        
        if (innovations?.improvements?.length > 5) {
            assumptions.push('Phased implementation approach will be used');
        }
        
        if (collectionSynthesis?.qualityAssessment?.overall_quality > 0.8) {
            assumptions.push('High-quality data sources remain available');
        }
        
        return assumptions;
    }

    identifyDependencies(innovations) {
        const dependencies = [];
        
        if (innovations?.improvements) {
            innovations.improvements.forEach(improvement => {
                if (improvement.category === 'performance') {
                    dependencies.push({
                        improvement: improvement.title,
                        dependency: 'Performance monitoring tools',
                        type: 'infrastructure'
                    });
                }
                
                if (improvement.category === 'security') {
                    dependencies.push({
                        improvement: improvement.title,
                        dependency: 'Security frameworks and libraries',
                        type: 'software'
                    });
                }
            });
        }
        
        return dependencies;
    }

    compileAlternatives(innovations) {
        const alternatives = [];
        
        if (innovations?.improvements) {
            // Prendre les améliorations avec score plus faible comme alternatives
            const alternatives_list = innovations.improvements
                .filter(imp => imp.innovation_score < 0.7)
                .slice(0, 3);
            
            alternatives_list.forEach(alt => {
                alternatives.push({
                    title: alt.title,
                    description: alt.description,
                    pros: ['Lower complexity', 'Faster implementation'],
                    cons: ['Limited innovation potential', 'Lower impact']
                });
            });
        }
        
        return alternatives;
    }

    extractDomainInsights(collectionSynthesis) {
        const insights = [];
        
        if (collectionSynthesis?.keyFindings) {
            const categories = [...new Set(collectionSynthesis.keyFindings.map(f => f.category).filter(Boolean))];
            insights.push(...categories.map(cat => `Expertise ${cat} identifiée`));
        }
        
        return insights;
    }

    identifyPrimarySolution(collectionSynthesis, innovations) {
        // Identifier la solution principale basée sur la confiance et l'innovation
        const topFindings = collectionSynthesis?.keyFindings?.filter(f => f.importance === 'high') || [];
        const topInnovations = innovations?.improvements?.filter(i => i.priority === 'high') || [];
        
        if (topInnovations.length > 0) {
            return `Solution innovante: ${topInnovations[0].title} - ${topInnovations[0].description.substring(0, 100)}...`;
        }
        
        if (topFindings.length > 0) {
            return `Solution basée sur l'analyse: ${topFindings[0].content?.substring(0, 100)}...`;
        }
        
        return 'Solution multi-approche basée sur l\'analyse complète';
    }

    identifyAlternativeApproaches(innovations) {
        const alternatives = innovations?.improvements?.slice(1, 4) || [];
        return alternatives.map(alt => ({
            title: alt.title,
            description: alt.description.substring(0, 100) + '...',
            priority: alt.priority
        }));
    }

    determinePriority(innovations, verification) {
        const verificationScore = verification?.final_validation?.overall_score || 70;
        const innovationLevel = innovations?.innovationMetrics?.innovation_potential || 0.5;
        
        if (verificationScore >= 85 && innovationLevel > 0.8) return 'immediate';
        if (verificationScore >= 70) return 'high';
        if (verificationScore >= 50) return 'medium';
        return 'low';
    }

    extractRiskMitigation(innovations, verification) {
        const mitigationStrategies = [];
        
        if (innovations?.riskAnalysis?.mitigation_strategies) {
            mitigationStrategies.push(...innovations.riskAnalysis.mitigation_strategies.map(s => s.strategy));
        }
        
        if (verification?.risk_evaluation?.mitigation_strategies) {
            mitigationStrategies.push(...verification.risk_evaluation.mitigation_strategies.map(s => s.strategy));
        }
        
        return [...new Set(mitigationStrategies)]; // Déduplication
    }

    defineSuccessCriteria(verification) {
        const criteria = verification?.recommendations?.slice(-3) || [];
        criteria.push('Amélioration mesurable des performances');
        criteria.push('Validation par les utilisateurs finaux');
        
        return criteria;
    }

    getProcessingTime() {
        return Math.random() * 2000 + 1500; // 1500-3500ms pour la synthèse
    }
}

module.exports = SynthesisAgent;