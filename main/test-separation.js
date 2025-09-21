#!/usr/bin/env node

/**
 * Tests de séparation avec MOSAICMIND
 * Vérifie que l'application respecte toutes les règles de séparation
 */

const fs = require('fs');
const path = require('path');

class SeparationTests {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    runAllTests() {
        console.log('🧪 TESTS DE SÉPARATION MOSAICMIND');
        console.log('=' .repeat(40));

        this.testConfigurationSeparation();
        this.testNoDependenciesBlocked();
        this.testApplicationStructure();
        this.testDocumentationCompliance();
        this.testValidationScripts();

        this.displayTestResults();
        return this.failedTests === 0;
    }

    test(description, testFunction) {
        this.totalTests++;
        try {
            const result = testFunction();
            if (result) {
                console.log(`✅ ${description}`);
                this.passedTests++;
            } else {
                console.log(`❌ ${description} - ÉCHEC`);
                this.failedTests++;
            }
        } catch (error) {
            console.log(`❌ ${description} - ERREUR: ${error.message}`);
            this.failedTests++;
        }
    }

    testConfigurationSeparation() {
        console.log('\n📋 Tests de Configuration:');
        
        this.test('Configuration de séparation existe', () => {
            const configPath = path.join(__dirname, 'config.json');
            return fs.existsSync(configPath);
        });

        this.test('Séparation activée dans la configuration', () => {
            const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
            return config.application?.separation?.enforce_separation === true;
        });

        this.test('MOSAICMIND dans la liste des intégrations bloquées', () => {
            const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
            const blocked = config.application?.separation?.blocked_integrations || [];
            return blocked.some(item => item.toLowerCase().includes('mosaicmind'));
        });

        this.test('Mode d\'isolation strict activé', () => {
            const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
            return config.application?.separation?.isolation_mode === 'strict';
        });
    }

    testNoDependenciesBlocked() {
        console.log('\n📦 Tests de Dépendances:');

        this.test('Package.json existe et est valide', () => {
            const packagePath = path.join(__dirname, 'package.json');
            if (!fs.existsSync(packagePath)) return false;
            
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageData.name && packageData.version;
        });

        this.test('Aucune dépendance MOSAICMIND', () => {
            const packagePath = path.join(__dirname, 'package.json');
            if (!fs.existsSync(packagePath)) return true; // Pas de dépendances = pas de problème
            
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            const allDeps = {
                ...packageData.dependencies,
                ...packageData.devDependencies,
                ...packageData.peerDependencies
            };

            return !Object.keys(allDeps).some(dep => 
                dep.toLowerCase().includes('mosaicmind')
            );
        });

        this.test('Configuration de blocage dans package.json', () => {
            const packagePath = path.join(__dirname, 'package.json');
            if (!fs.existsSync(packagePath)) return false;
            
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageData.config?.mosaicmind_blocked === true;
        });
    }

    testApplicationStructure() {
        console.log('\n🏗️  Tests de Structure:');

        this.test('Application principale existe', () => {
            return fs.existsSync(path.join(__dirname, 'index.js'));
        });

        this.test('Script de validation existe', () => {
            return fs.existsSync(path.join(__dirname, 'validate-separation.js'));
        });

        this.test('Application contient des vérifications de séparation', () => {
            const indexPath = path.join(__dirname, 'index.js');
            if (!fs.existsSync(indexPath)) return false;
            
            const content = fs.readFileSync(indexPath, 'utf8');
            return content.includes('validateSeparation') && 
                   content.includes('MOSAICMIND') &&
                   content.includes('blocked_integrations');
        });
    }

    testDocumentationCompliance() {
        console.log('\n📖 Tests de Documentation:');

        this.test('README.md existe', () => {
            return fs.existsSync(path.join(__dirname, 'README.md'));
        });

        this.test('Documentation mentionne la séparation', () => {
            const readmePath = path.join(__dirname, 'README.md');
            if (!fs.existsSync(readmePath)) return false;
            
            const content = fs.readFileSync(readmePath, 'utf8');
            return content.includes('MOSAICMIND') && 
                   (content.includes('JAMAIS') || content.includes('NEVER')) &&
                   content.includes('séparation');
        });

        this.test('Avertissements visibles dans la documentation', () => {
            const readmePath = path.join(__dirname, 'README.md');
            if (!fs.existsSync(readmePath)) return false;
            
            const content = fs.readFileSync(readmePath, 'utf8');
            return content.includes('⚠️') && content.includes('ATTENTION');
        });
    }

    testValidationScripts() {
        console.log('\n🔍 Tests de Scripts de Validation:');

        this.test('Script de validation est exécutable', () => {
            try {
                const { execSync } = require('child_process');
                execSync('node validate-separation.js', { cwd: __dirname, stdio: 'pipe' });
                return true;
            } catch (error) {
                return error.status === 0; // Code de sortie 0 = succès
            }
        });

        this.test('Application démarre avec validation', () => {
            try {
                const MultiAgentLiaison = require('./index.js');
                const app = new MultiAgentLiaison();
                return app.config && app.config.application.separation.enforce_separation;
            } catch (error) {
                return false;
            }
        });
    }

    displayTestResults() {
        console.log('\n📊 RÉSULTATS DES TESTS');
        console.log('=' .repeat(30));
        console.log(`Total: ${this.totalTests}`);
        console.log(`✅ Réussis: ${this.passedTests}`);
        console.log(`❌ Échoués: ${this.failedTests}`);
        
        const percentage = Math.round((this.passedTests / this.totalTests) * 100);
        console.log(`📈 Pourcentage de réussite: ${percentage}%`);

        if (this.failedTests === 0) {
            console.log('\n🎉 TOUS LES TESTS DE SÉPARATION RÉUSSIS!');
            console.log('✅ L\'application respecte les règles de séparation avec MOSAICMIND');
        } else {
            console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
            console.log('❌ Vérifiez l\'implémentation de la séparation');
        }

        console.log('\n🔒 RAPPEL: NE JAMAIS MÉLANGER AVEC MOSAICMIND');
    }
}

// Exécution des tests
if (require.main === module) {
    const tests = new SeparationTests();
    const allTestsPassed = tests.runAllTests();
    process.exit(allTestsPassed ? 0 : 1);
}

module.exports = SeparationTests;