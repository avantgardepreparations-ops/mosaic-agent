#!/usr/bin/env node

/**
 * Script de validation de la séparation avec MOSAICMIND
 * Vérifie que l'application respecte les règles de séparation
 */

const fs = require('fs');
const path = require('path');

class SeparationValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validate() {
        console.log('🔍 VALIDATION DE LA SÉPARATION MOSAICMIND');
        console.log('=' .repeat(45));

        this.checkConfigFile();
        this.checkPackageJson();
        this.checkSourceFiles();
        this.checkDocumentation();

        this.displayResults();
        return this.errors.length === 0;
    }

    checkConfigFile() {
        console.log('📋 Vérification du fichier de configuration...');
        
        try {
            const configPath = path.join(__dirname, 'config.json');
            if (!fs.existsSync(configPath)) {
                this.errors.push('Fichier config.json manquant');
                return;
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            if (!config.application?.separation?.enforce_separation) {
                this.errors.push('La séparation n\'est pas activée dans la configuration');
            }

            if (!config.application?.separation?.blocked_integrations?.includes('MOSAICMIND')) {
                this.errors.push('MOSAICMIND n\'est pas dans la liste des intégrations bloquées');
            }

            console.log('✓ Configuration validée');
        } catch (error) {
            this.errors.push(`Erreur de configuration: ${error.message}`);
        }
    }

    checkPackageJson() {
        console.log('📦 Vérification du package.json...');
        
        try {
            const packagePath = path.join(__dirname, 'package.json');
            if (!fs.existsSync(packagePath)) {
                this.warnings.push('Fichier package.json manquant');
                return;
            }

            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // Vérifier la description
            if (!packageData.description?.includes('SEPAREE') && !packageData.description?.includes('JAMAIS')) {
                this.warnings.push('La description ne mentionne pas clairement la séparation');
            }

            // Vérifier les mots-clés
            if (!packageData.keywords?.includes('not-mosaicmind')) {
                this.warnings.push('Le mot-clé "not-mosaicmind" est recommandé');
            }

            console.log('✓ Package.json validé');
        } catch (error) {
            this.errors.push(`Erreur package.json: ${error.message}`);
        }
    }

    checkSourceFiles() {
        console.log('📁 Vérification des fichiers source...');
        
        const files = fs.readdirSync(__dirname).filter(file => 
            file.endsWith('.js') && file !== 'validate-separation.js'
        );

        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
                
                // Vérifier qu'il n'y a pas de références à MOSAICMIND (sauf dans les commentaires de séparation)
                const mosaicmindRefs = content.match(/mosaicmind/gi) || [];
                const legitimateRefs = content.match(/JAMAIS.*MOSAICMIND|NEVER.*MOSAICMIND|séparation.*MOSAICMIND/gi) || [];
                
                if (mosaicmindRefs.length > legitimateRefs.length) {
                    this.warnings.push(`Références suspectes à MOSAICMIND dans ${file}`);
                }
            } catch (error) {
                this.warnings.push(`Impossible de lire ${file}: ${error.message}`);
            }
        }

        console.log('✓ Fichiers source vérifiés');
    }

    checkDocumentation() {
        console.log('📖 Vérification de la documentation...');
        
        try {
            const readmePath = path.join(__dirname, 'README.md');
            if (fs.existsSync(readmePath)) {
                const content = fs.readFileSync(readmePath, 'utf8');
                
                if (!content.includes('MOSAICMIND') && !content.includes('séparation')) {
                    this.warnings.push('La documentation devrait mentionner la séparation avec MOSAICMIND');
                }
            }
            
            console.log('✓ Documentation vérifiée');
        } catch (error) {
            this.warnings.push(`Erreur documentation: ${error.message}`);
        }
    }

    displayResults() {
        console.log('');
        console.log('📊 RÉSULTATS DE LA VALIDATION');
        console.log('=' .repeat(35));

        if (this.errors.length === 0) {
            console.log('✅ VALIDATION RÉUSSIE - Séparation correctement implémentée');
        } else {
            console.log('❌ VALIDATION ÉCHOUÉE - Problèmes détectés:');
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('');
            console.log('⚠️  AVERTISSEMENTS:');
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }

        console.log('');
        console.log('🔒 RAPPEL: NE JAMAIS MÉLANGER AVEC MOSAICMIND');
    }
}

// Exécution du script
if (require.main === module) {
    const validator = new SeparationValidator();
    const isValid = validator.validate();
    process.exit(isValid ? 0 : 1);
}

module.exports = SeparationValidator;