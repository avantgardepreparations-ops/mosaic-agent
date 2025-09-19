/**
 * AgentWorkflow Component
 * Interface pour afficher le statut et la progression du workflow multi-agent
 */

class AgentWorkflow {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.orchestrator = null;
        this.currentWorkflowId = null;
        this.progressHistory = [];
        
        if (!this.container) {
            throw new Error(`Container avec ID ${containerId} non trouvé`);
        }
        
        this.initializeComponent();
        this.setupEventListeners();
    }

    /**
     * Initialise l'interface du composant
     */
    initializeComponent() {
        this.container.innerHTML = `
            <div class="agent-workflow bg-white rounded-lg shadow-lg p-6">
                <!-- Header du workflow -->
                <div class="workflow-header mb-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-brain text-ai-primary mr-3"></i>
                        Workflow Multi-Agent
                    </h3>
                    <div class="workflow-status flex items-center">
                        <span class="status-indicator bg-gray-400 w-3 h-3 rounded-full mr-2"></span>
                        <span class="status-text text-gray-600">En attente</span>
                    </div>
                </div>

                <!-- Zone de saisie -->
                <div class="input-section mb-6">
                    <div class="flex flex-col space-y-4">
                        <div>
                            <label for="prompt-input" class="block text-sm font-medium text-gray-700 mb-2">
                                Votre demande
                            </label>
                            <textarea 
                                id="prompt-input" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-primary focus:border-transparent"
                                rows="3"
                                placeholder="Décrivez votre demande ici..."
                            ></textarea>
                        </div>
                        
                        <div class="flex space-x-4">
                            <div class="flex-1">
                                <label for="task-type" class="block text-sm font-medium text-gray-700 mb-1">Type de tâche</label>
                                <select id="task-type" class="w-full p-2 border border-gray-300 rounded-lg">
                                    <option value="general">Général</option>
                                    <option value="code">Code/Développement</option>
                                    <option value="research">Recherche</option>
                                    <option value="design">Design</option>
                                </select>
                            </div>
                            
                            <div class="flex-1">
                                <label for="innovation-level" class="block text-sm font-medium text-gray-700 mb-1">Niveau d'innovation</label>
                                <select id="innovation-level" class="w-full p-2 border border-gray-300 rounded-lg">
                                    <option value="conservative">Conservateur</option>
                                    <option value="moderate" selected>Modéré</option>
                                    <option value="high">Élevé</option>
                                </select>
                            </div>
                        </div>
                        
                        <button 
                            id="start-workflow" 
                            class="bg-ai-primary text-white px-6 py-2 rounded-lg hover:bg-ai-secondary transition-colors disabled:bg-gray-400"
                        >
                            <i class="fas fa-play mr-2"></i>
                            Démarrer l'analyse
                        </button>
                    </div>
                </div>

                <!-- Progression du workflow -->
                <div class="workflow-progress hidden mb-6">
                    <div class="progress-header mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">Progression</h4>
                        <div class="progress-bar-container bg-gray-200 rounded-full h-2 mb-2">
                            <div class="progress-bar bg-ai-primary h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                        <div class="progress-text text-sm text-gray-600">Initialisation...</div>
                    </div>

                    <!-- Phases du workflow -->
                    <div class="phases-container space-y-4">
                        <!-- Phase 1 -->
                        <div class="phase-card phase-1 border rounded-lg p-4 bg-gray-50">
                            <div class="phase-header flex items-center mb-3">
                                <div class="phase-icon w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                    <i class="fas fa-search text-white text-sm"></i>
                                </div>
                                <div>
                                    <h5 class="font-semibold text-gray-800">Phase 1: Analyse et Collecte</h5>
                                    <p class="text-sm text-gray-600">Affinement, distribution et collecte d'informations</p>
                                </div>
                                <div class="phase-status ml-auto">
                                    <span class="status-badge bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">En attente</span>
                                </div>
                            </div>
                            
                            <div class="agents-progress space-y-2">
                                <div class="agent-item agent-prompt-refinement flex items-center p-2 bg-white rounded">
                                    <div class="agent-icon w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                        <i class="fas fa-edit text-white text-xs"></i>
                                    </div>
                                    <div class="agent-info flex-1">
                                        <span class="agent-name text-sm font-medium">Agent d'Affinement</span>
                                        <div class="agent-description text-xs text-gray-500">Analyse et amélioration du prompt</div>
                                    </div>
                                    <div class="agent-status">
                                        <span class="status-dot bg-gray-400 w-2 h-2 rounded-full"></span>
                                    </div>
                                </div>
                                
                                <div class="agent-item agent-distribution flex items-center p-2 bg-white rounded">
                                    <div class="agent-icon w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                        <i class="fas fa-share-alt text-white text-xs"></i>
                                    </div>
                                    <div class="agent-info flex-1">
                                        <span class="agent-name text-sm font-medium">Agent de Distribution</span>
                                        <div class="agent-description text-xs text-gray-500">Distribution vers les sources</div>
                                    </div>
                                    <div class="agent-status">
                                        <span class="status-dot bg-gray-400 w-2 h-2 rounded-full"></span>
                                    </div>
                                </div>
                                
                                <div class="agent-item agent-collection flex items-center p-2 bg-white rounded">
                                    <div class="agent-icon w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                        <i class="fas fa-database text-white text-xs"></i>
                                    </div>
                                    <div class="agent-info flex-1">
                                        <span class="agent-name text-sm font-medium">Agent de Collecte</span>
                                        <div class="agent-description text-xs text-gray-500">Agrégation des résultats</div>
                                    </div>
                                    <div class="agent-status">
                                        <span class="status-dot bg-gray-400 w-2 h-2 rounded-full"></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Phase 2 -->
                        <div class="phase-card phase-2 border rounded-lg p-4 bg-gray-50">
                            <div class="phase-header flex items-center mb-3">
                                <div class="phase-icon w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                    <i class="fas fa-lightbulb text-white text-sm"></i>
                                </div>
                                <div>
                                    <h5 class="font-semibold text-gray-800">Phase 2: Innovation et Synthèse</h5>
                                    <p class="text-sm text-gray-600">Innovation, vérification et synthèse finale</p>
                                </div>
                                <div class="phase-status ml-auto">
                                    <span class="status-badge bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">En attente</span>
                                </div>
                            </div>
                            
                            <div class="agents-progress space-y-2">
                                <div class="agent-item agent-innovation flex items-center p-2 bg-white rounded">
                                    <div class="agent-icon w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                        <i class="fas fa-rocket text-white text-xs"></i>
                                    </div>
                                    <div class="agent-info flex-1">
                                        <span class="agent-name text-sm font-medium">Agent d'Innovation</span>
                                        <div class="agent-description text-xs text-gray-500">Analyse des améliorations</div>
                                    </div>
                                    <div class="agent-status">
                                        <span class="status-dot bg-gray-400 w-2 h-2 rounded-full"></span>
                                    </div>
                                </div>
                                
                                <div class="agent-item agent-verification flex items-center p-2 bg-white rounded">
                                    <div class="agent-icon w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                        <i class="fas fa-check-circle text-white text-xs"></i>
                                    </div>
                                    <div class="agent-info flex-1">
                                        <span class="agent-name text-sm font-medium">Agent de Vérification</span>
                                        <div class="agent-description text-xs text-gray-500">Validation et contrôle qualité</div>
                                    </div>
                                    <div class="agent-status">
                                        <span class="status-dot bg-gray-400 w-2 h-2 rounded-full"></span>
                                    </div>
                                </div>
                                
                                <div class="agent-item agent-synthesis flex items-center p-2 bg-white rounded">
                                    <div class="agent-icon w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                        <i class="fas fa-magic text-white text-xs"></i>
                                    </div>
                                    <div class="agent-info flex-1">
                                        <span class="agent-name text-sm font-medium">Agent de Synthèse</span>
                                        <div class="agent-description text-xs text-gray-500">Compilation finale</div>
                                    </div>
                                    <div class="agent-status">
                                        <span class="status-dot bg-gray-400 w-2 h-2 rounded-full"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Résultats -->
                <div class="workflow-results hidden">
                    <div class="results-header mb-4">
                        <h4 class="text-lg font-semibold text-gray-800">Résultats</h4>
                    </div>
                    
                    <div class="results-content bg-gray-50 rounded-lg p-4">
                        <div class="results-summary mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-700">Score de qualité</span>
                                <span class="quality-score text-lg font-bold text-green-600">-</span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-700">Niveau de confiance</span>
                                <span class="confidence-level text-lg font-bold text-blue-600">-</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-gray-700">Durée de traitement</span>
                                <span class="processing-duration text-lg font-bold text-purple-600">-</span>
                            </div>
                        </div>
                        
                        <div class="results-details">
                            <div class="executive-summary mb-4">
                                <h5 class="font-semibold text-gray-800 mb-2">Résumé exécutif</h5>
                                <div class="summary-content text-sm text-gray-600 bg-white p-3 rounded border">
                                    Les résultats apparaîtront ici...
                                </div>
                            </div>
                            
                            <div class="recommendations">
                                <h5 class="font-semibold text-gray-800 mb-2">Recommandations principales</h5>
                                <div class="recommendations-list space-y-2">
                                    <!-- Les recommandations seront ajoutées dynamiquement -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Zone d'erreur -->
                <div class="workflow-error hidden bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                        <div>
                            <h5 class="font-semibold text-red-800">Erreur de traitement</h5>
                            <p class="error-message text-sm text-red-600">Une erreur s'est produite...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialiser les références aux éléments
        this.elements = {
            statusIndicator: this.container.querySelector('.status-indicator'),
            statusText: this.container.querySelector('.status-text'),
            promptInput: this.container.querySelector('#prompt-input'),
            taskType: this.container.querySelector('#task-type'),
            innovationLevel: this.container.querySelector('#innovation-level'),
            startButton: this.container.querySelector('#start-workflow'),
            progressSection: this.container.querySelector('.workflow-progress'),
            progressBar: this.container.querySelector('.progress-bar'),
            progressText: this.container.querySelector('.progress-text'),
            resultsSection: this.container.querySelector('.workflow-results'),
            errorSection: this.container.querySelector('.workflow-error'),
            errorMessage: this.container.querySelector('.error-message')
        };
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton de démarrage
        this.elements.startButton.addEventListener('click', () => {
            this.startWorkflow();
        });

        // Enter dans le textarea
        this.elements.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.startWorkflow();
            }
        });

        // Validation en temps réel
        this.elements.promptInput.addEventListener('input', () => {
            this.validateInput();
        });
    }

    /**
     * Démarre le workflow multi-agent
     */
    async startWorkflow() {
        const prompt = this.elements.promptInput.value.trim();
        
        if (!prompt) {
            this.showError('Veuillez saisir une demande');
            return;
        }

        try {
            // Préparer l'interface
            this.updateStatus('active', 'Démarrage du workflow...');
            this.elements.startButton.disabled = true;
            this.showProgressSection();
            this.hideErrorSection();
            this.hideResultsSection();

            // Options du workflow
            const options = {
                taskType: this.elements.taskType.value,
                innovationLevel: this.elements.innovationLevel.value,
                maxSources: 3,
                timeout: 30000
            };

            // Simulation du workflow (en mode mock)
            await this.simulateWorkflow(prompt, options);

        } catch (error) {
            this.showError(`Erreur lors du traitement: ${error.message}`);
        } finally {
            this.elements.startButton.disabled = false;
        }
    }

    /**
     * Simulation du workflow pour la démonstration
     * @param {string} prompt - Prompt utilisateur
     * @param {Object} options - Options du workflow
     */
    async simulateWorkflow(prompt, options) {
        const totalSteps = 6;
        let currentStep = 0;

        // Helper pour simuler une étape
        const simulateStep = async (agentName, description, duration = 2000) => {
            currentStep++;
            const progress = (currentStep / totalSteps) * 100;
            
            this.updateProgress(progress, `${description}...`);
            this.updateAgentStatus(agentName, 'active', description);
            
            await this.delay(duration);
            
            this.updateAgentStatus(agentName, 'complete', 'Terminé');
        };

        try {
            // Phase 1: Analyse et Collecte
            this.updatePhaseStatus('phase-1', 'active', 'En cours');

            await simulateStep('prompt-refinement', 'Affinement du prompt', 1500);
            await simulateStep('distribution', 'Distribution vers les sources', 2000);
            await simulateStep('collection', 'Collecte des informations', 1800);

            this.updatePhaseStatus('phase-1', 'complete', 'Terminée');

            // Phase 2: Innovation et Synthèse
            this.updatePhaseStatus('phase-2', 'active', 'En cours');

            await simulateStep('innovation', 'Analyse d\'innovation', 2200);
            await simulateStep('verification', 'Vérification et validation', 1600);
            await simulateStep('synthesis', 'Synthèse finale', 1400);

            this.updatePhaseStatus('phase-2', 'complete', 'Terminée');

            // Simulation des résultats
            const mockResults = this.generateMockResults(prompt, options);
            this.displayResults(mockResults);

            this.updateStatus('complete', 'Workflow terminé avec succès');
            this.updateProgress(100, 'Traitement terminé');

        } catch (error) {
            throw error;
        }
    }

    /**
     * Génère des résultats mock pour la démonstration
     * @param {string} prompt - Prompt original
     * @param {Object} options - Options utilisées
     * @returns {Object} - Résultats simulés
     */
    generateMockResults(prompt, options) {
        const qualityScore = Math.floor(Math.random() * 20 + 80); // 80-100
        const confidenceLevel = (Math.random() * 0.3 + 0.7).toFixed(2); // 0.7-1.0
        const duration = (Math.random() * 5000 + 8000).toFixed(0); // 8-13 secondes

        return {
            quality_score: qualityScore,
            confidence_level: confidenceLevel,
            processing_duration: `${duration}ms`,
            executive_summary: `Analyse complète de votre demande "${prompt.substring(0, 50)}..." réalisée avec succès. Solution multi-approche identifiée avec ${Math.floor(Math.random() * 5 + 3)} recommandations principales.`,
            recommendations: [
                'Implémentation progressive en 3 phases',
                'Validation par prototypage rapide',
                'Intégration avec les systèmes existants',
                'Tests de performance automatisés',
                'Documentation technique complète'
            ].slice(0, Math.floor(Math.random() * 3 + 3))
        };
    }

    // Méthodes de mise à jour de l'interface

    updateStatus(status, text) {
        const statusClasses = {
            'idle': 'bg-gray-400',
            'active': 'bg-blue-500 animate-pulse',
            'complete': 'bg-green-500',
            'error': 'bg-red-500'
        };

        this.elements.statusIndicator.className = `status-indicator w-3 h-3 rounded-full mr-2 ${statusClasses[status] || 'bg-gray-400'}`;
        this.elements.statusText.textContent = text;
    }

    updateProgress(percentage, text) {
        this.elements.progressBar.style.width = `${percentage}%`;
        this.elements.progressText.textContent = text;
    }

    updatePhaseStatus(phaseClass, status, statusText) {
        const phaseCard = this.container.querySelector(`.${phaseClass}`);
        const statusBadge = phaseCard.querySelector('.status-badge');
        const phaseIcon = phaseCard.querySelector('.phase-icon');

        const statusClasses = {
            'pending': { badge: 'bg-gray-200 text-gray-600', icon: 'bg-gray-300' },
            'active': { badge: 'bg-blue-200 text-blue-800', icon: 'bg-blue-500' },
            'complete': { badge: 'bg-green-200 text-green-800', icon: 'bg-green-500' }
        };

        const classes = statusClasses[status] || statusClasses.pending;
        
        statusBadge.className = `status-badge px-2 py-1 rounded-full text-xs ${classes.badge}`;
        statusBadge.textContent = statusText;
        
        phaseIcon.className = `phase-icon w-8 h-8 rounded-full flex items-center justify-center mr-3 ${classes.icon}`;
    }

    updateAgentStatus(agentClass, status, description) {
        const agentItem = this.container.querySelector(`.agent-${agentClass}`);
        const statusDot = agentItem.querySelector('.status-dot');
        const agentDescription = agentItem.querySelector('.agent-description');

        const statusClasses = {
            'pending': 'bg-gray-400',
            'active': 'bg-blue-500 animate-pulse',
            'complete': 'bg-green-500'
        };

        statusDot.className = `status-dot w-2 h-2 rounded-full ${statusClasses[status] || 'bg-gray-400'}`;
        if (description) {
            agentDescription.textContent = description;
        }
    }

    showProgressSection() {
        this.elements.progressSection.classList.remove('hidden');
    }

    hideProgressSection() {
        this.elements.progressSection.classList.add('hidden');
    }

    showResultsSection() {
        this.elements.resultsSection.classList.remove('hidden');
    }

    hideResultsSection() {
        this.elements.resultsSection.classList.add('hidden');
    }

    showErrorSection() {
        this.elements.errorSection.classList.remove('hidden');
    }

    hideErrorSection() {
        this.elements.errorSection.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.showErrorSection();
        this.updateStatus('error', 'Erreur');
    }

    displayResults(results) {
        // Mettre à jour les métriques
        this.container.querySelector('.quality-score').textContent = `${results.quality_score}/100`;
        this.container.querySelector('.confidence-level').textContent = `${(results.confidence_level * 100).toFixed(0)}%`;
        this.container.querySelector('.processing-duration').textContent = results.processing_duration;

        // Mettre à jour le résumé
        this.container.querySelector('.summary-content').textContent = results.executive_summary;

        // Mettre à jour les recommandations
        const recommendationsList = this.container.querySelector('.recommendations-list');
        recommendationsList.innerHTML = '';
        
        results.recommendations.forEach((rec, index) => {
            const recElement = document.createElement('div');
            recElement.className = 'recommendation-item flex items-center p-2 bg-white rounded border';
            recElement.innerHTML = `
                <div class="rec-number w-6 h-6 rounded-full bg-ai-primary text-white flex items-center justify-center mr-3 text-xs font-bold">
                    ${index + 1}
                </div>
                <span class="rec-text text-sm text-gray-700">${rec}</span>
            `;
            recommendationsList.appendChild(recElement);
        });

        this.showResultsSection();
    }

    validateInput() {
        const prompt = this.elements.promptInput.value.trim();
        const isValid = prompt.length >= 10;
        
        this.elements.startButton.disabled = !isValid;
        
        if (prompt.length > 0 && prompt.length < 10) {
            this.elements.promptInput.classList.add('border-yellow-400');
        } else {
            this.elements.promptInput.classList.remove('border-yellow-400');
        }
    }

    // Méthodes utilitaires

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Réinitialise le composant
     */
    reset() {
        this.elements.promptInput.value = '';
        this.elements.taskType.value = 'general';
        this.elements.innovationLevel.value = 'moderate';
        this.updateStatus('idle', 'En attente');
        this.hideProgressSection();
        this.hideResultsSection();
        this.hideErrorSection();
        this.elements.startButton.disabled = false;
        
        // Reset des statuts des agents
        this.container.querySelectorAll('.status-dot').forEach(dot => {
            dot.className = 'status-dot bg-gray-400 w-2 h-2 rounded-full';
        });
        
        // Reset des phases
        this.updatePhaseStatus('phase-1', 'pending', 'En attente');
        this.updatePhaseStatus('phase-2', 'pending', 'En attente');
    }

    /**
     * Retourne l'état actuel du workflow
     * @returns {Object} - État actuel
     */
    getStatus() {
        return {
            isActive: !this.elements.progressSection.classList.contains('hidden'),
            hasResults: !this.elements.resultsSection.classList.contains('hidden'),
            hasError: !this.elements.errorSection.classList.contains('hidden'),
            currentPrompt: this.elements.promptInput.value,
            options: {
                taskType: this.elements.taskType.value,
                innovationLevel: this.elements.innovationLevel.value
            }
        };
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentWorkflow;
}