/**
 * AgentBase.js
 * Classe de base pour tous les agents du système multi-agent
 * Fournit des méthodes communes que tous les agents étendront
 */

class AgentBase {
    constructor(name, role, capabilities = []) {
        this.name = name;
        this.role = role;
        this.capabilities = capabilities;
        this.status = 'inactive';
        this.lastProcessedAt = null;
        this.processingHistory = [];
    }

    /**
     * Méthode principale de traitement - doit être implémentée par les classes enfants
     * @param {Object} input - Données d'entrée à traiter
     * @returns {Promise<Object>} - Résultat du traitement
     */
    async process(input) {
        throw new Error(`La méthode process() doit être implémentée par ${this.constructor.name}`);
    }

    /**
     * Valide les données d'entrée avant traitement
     * @param {Object} input - Données à valider
     * @returns {boolean} - true si valide, false sinon
     */
    validateInput(input) {
        if (!input) {
            this.logError('Input vide ou non défini');
            return false;
        }

        if (typeof input !== 'object') {
            this.logError('Input doit être un objet');
            return false;
        }

        return true;
    }

    /**
     * Change le statut de l'agent
     * @param {string} status - Nouveau statut ('active', 'inactive', 'processing', 'error')
     */
    setStatus(status) {
        const validStatuses = ['active', 'inactive', 'processing', 'error'];
        if (validStatuses.includes(status)) {
            this.status = status;
            this.log(`Statut changé vers: ${status}`);
        } else {
            this.logError(`Statut invalide: ${status}`);
        }
    }

    /**
     * Ajoute une entrée à l'historique de traitement
     * @param {Object} entry - Entrée d'historique
     */
    addToHistory(entry) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            ...entry
        };
        this.processingHistory.push(historyEntry);
        
        // Garder seulement les 100 dernières entrées
        if (this.processingHistory.length > 100) {
            this.processingHistory = this.processingHistory.slice(-100);
        }
    }

    /**
     * Retourne les informations de base de l'agent
     * @returns {Object} - Informations de l'agent
     */
    getInfo() {
        return {
            name: this.name,
            role: this.role,
            capabilities: this.capabilities,
            status: this.status,
            lastProcessedAt: this.lastProcessedAt,
            historyCount: this.processingHistory.length
        };
    }

    /**
     * Méthode de logging pour l'agent
     * @param {string} message - Message à logger
     */
    log(message) {
        console.log(`[${this.name}] ${message}`);
    }

    /**
     * Méthode de logging d'erreur pour l'agent
     * @param {string} error - Message d'erreur
     */
    logError(error) {
        console.error(`[${this.name}] ERREUR: ${error}`);
    }

    /**
     * Exécute le traitement avec gestion d'erreur et historique
     * @param {Object} input - Données d'entrée
     * @returns {Promise<Object>} - Résultat du traitement
     */
    async execute(input) {
        try {
            this.setStatus('processing');
            this.log('Début du traitement');

            // Validation de l'entrée
            if (!this.validateInput(input)) {
                throw new Error('Validation de l\'entrée échouée');
            }

            // Traitement principal
            const result = await this.process(input);
            
            // Mise à jour de l'historique
            this.lastProcessedAt = new Date().toISOString();
            this.addToHistory({
                action: 'process',
                inputType: typeof input,
                success: true,
                resultType: typeof result
            });

            this.setStatus('active');
            this.log('Traitement terminé avec succès');
            
            return result;

        } catch (error) {
            this.setStatus('error');
            this.logError(`Échec du traitement: ${error.message}`);
            
            this.addToHistory({
                action: 'process',
                inputType: typeof input,
                success: false,
                error: error.message
            });

            throw error;
        }
    }
}

module.exports = AgentBase;