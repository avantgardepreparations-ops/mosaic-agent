#!/usr/bin/env node

/**
 * Multi-Agent Liaison Application
 * ATTENTION: NE JAMAIS MELANGER AVEC MOSAICMIND
 * 
 * Cette application doit rester complètement séparée de MOSAICMIND
 */

const fs = require('fs');
const path = require('path');

class MultiAgentLiaison {
    constructor() {
        this.config = this.loadConfig();
        this.validateSeparation();
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            process.exit(1);
        }
    }

    validateSeparation() {
        console.log('🔒 VALIDATION DE LA SÉPARATION AVEC MOSAICMIND');
        console.log('=' .repeat(50));

        if (!this.config.application.separation.enforce_separation) {
            console.error('❌ ERREUR: La séparation avec MOSAICMIND n\'est pas activée!');
            process.exit(1);
        }

        // Vérifier qu'aucune dépendance MOSAICMIND n'est présente
        this.checkForMosaicMindDependencies();

        console.log('✅ Validation réussie: Application correctement séparée de MOSAICMIND');
        console.log('⚠️  RAPPEL: NE JAMAIS MÉLANGER AVEC MOSAICMIND');
        console.log('');
    }

    checkForMosaicMindDependencies() {
        const blockedIntegrations = this.config.application.separation.blocked_integrations;
        
        // Vérifier package.json pour des dépendances interdites
        try {
            const packagePath = path.join(__dirname, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const dependencies = {
                    ...packageData.dependencies,
                    ...packageData.devDependencies,
                    ...packageData.peerDependencies
                };

                for (const dep in dependencies) {
                    for (const blocked of blockedIntegrations) {
                        if (dep.toLowerCase().includes(blocked.toLowerCase())) {
                            console.error(`❌ ERREUR: Dépendance interdite détectée: ${dep}`);
                            console.error(`   Cette dépendance est liée à ${blocked} qui est INTERDIT!`);
                            process.exit(1);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️  Impossible de vérifier package.json:', error.message);
        }

        console.log('✓ Aucune dépendance MOSAICMIND détectée');
    }

    start() {
        console.log('🚀 DÉMARRAGE DE L\'APPLICATION MULTI-AGENT LIAISON');
        console.log('=' .repeat(50));
        console.log(`📋 Application: ${this.config.application.name}`);
        console.log(`📋 Version: ${this.config.application.version}`);
        console.log(`📋 Description: ${this.config.application.description}`);
        console.log('');
        console.log('🔐 MODE DE SÉPARATION STRICT ACTIVÉ');
        console.log('⚠️  CETTE APPLICATION NE DOIT JAMAIS ÊTRE MÉLANGÉE AVEC MOSAICMIND');
        console.log('');
        console.log('✅ Application prête à fonctionner en mode séparé');
    }

    displaySeparationWarning() {
        console.log('');
        console.log('⚠️' .repeat(20));
        console.log('  ATTENTION - SÉPARATION STRICTE REQUISE');
        console.log('  NE JAMAIS MÉLANGER AVEC MOSAICMIND');
        console.log('  Cette application doit rester complètement séparée');
        console.log('⚠️' .repeat(20));
        console.log('');
    }
}

// Point d'entrée principal
if (require.main === module) {
    const app = new MultiAgentLiaison();
    app.displaySeparationWarning();
    app.start();
}

module.exports = MultiAgentLiaison;