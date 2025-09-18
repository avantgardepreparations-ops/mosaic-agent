// Mosaic Agent - JavaScript simplifié et efficace
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Mosaic Agent Interface Simple initialisée');
    
    // État des services
    let serviceStates = {
        ollama: false,
        whisper: false,
        chromadb: false,
        jupyter: false,
        docker: false
    };
    
    // Stats système simulées
    let systemStats = {
        ramUsage: 2.1,
        cpuUsage: 15,
        activeServices: 0,
        loadedModels: 0
    };
    
    // Initialisation
    initializeInterface();
    setupEventListeners();
    startMonitoring();
    
    function initializeInterface() {
        updateStats();
        updateServiceCounters();
        
        // Navigation active
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Retirer classe active de tous les liens
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Ajouter classe active au lien cliqué
                this.classList.add('active');
                
                // Smooth scroll vers la section
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    function setupEventListeners() {
        // Les fonctions toggleService, openJupyter, etc. sont exposées globalement
        window.toggleService = toggleService;
        window.openJupyter = openJupyter;
        window.checkDocker = checkDocker;
        window.showAlternative = showAlternative;
    }
    
    function toggleService(serviceName, button) {
        const isActive = serviceStates[serviceName];
        
        if (isActive) {
            stopService(serviceName, button);
        } else {
            startService(serviceName, button);
        }
    }
    
    function startService(serviceName, button) {
        // UI feedback immédiat
        button.disabled = true;
        button.innerHTML = '⏳ Démarrage...';
        button.className = 'btn btn-secondary';
        
        // Simulation du démarrage
        setTimeout(() => {
            serviceStates[serviceName] = true;
            systemStats.activeServices++;
            
            if (serviceName === 'ollama') {
                systemStats.loadedModels++;
                systemStats.ramUsage += 1.5;
            } else if (serviceName === 'jupyter') {
                systemStats.ramUsage += 0.3;
            } else if (serviceName === 'chromadb') {
                systemStats.ramUsage += 0.2;
            }
            
            // Update UI
            button.disabled = false;
            button.innerHTML = '⏹️ Arrêter';
            button.className = 'btn btn-danger';
            
            updateStats();
            updateServiceCounters();
            showNotification(`✅ ${getServiceDisplayName(serviceName)} démarré avec succès`);
            
        }, 1000 + Math.random() * 2000);
    }
    
    function stopService(serviceName, button) {
        // UI feedback immédiat
        button.disabled = true;
        button.innerHTML = '⏳ Arrêt...';
        button.className = 'btn btn-secondary';
        
        // Simulation de l'arrêt
        setTimeout(() => {
            serviceStates[serviceName] = false;
            systemStats.activeServices = Math.max(0, systemStats.activeServices - 1);
            
            if (serviceName === 'ollama') {
                systemStats.loadedModels = Math.max(0, systemStats.loadedModels - 1);
                systemStats.ramUsage = Math.max(1.5, systemStats.ramUsage - 1.5);
            } else if (serviceName === 'jupyter') {
                systemStats.ramUsage = Math.max(1.5, systemStats.ramUsage - 0.3);
            } else if (serviceName === 'chromadb') {
                systemStats.ramUsage = Math.max(1.5, systemStats.ramUsage - 0.2);
            }
            
            // Update UI
            button.disabled = false;
            button.innerHTML = 'Démarrer';
            button.className = 'btn btn-primary';
            
            updateStats();
            updateServiceCounters();
            showNotification(`⏹️ ${getServiceDisplayName(serviceName)} arrêté`);
            
        }, 500 + Math.random() * 1000);
    }
    
    function openJupyter() {
        if (serviceStates.jupyter) {
            window.open('http://localhost:8888', '_blank');
            showNotification('📓 Ouverture de JupyterLab...');
        } else {
            showNotification('⚠️ Démarrez d\'abord JupyterLab', 'warning');
        }
    }
    
    function checkDocker(button) {
        button.disabled = true;
        button.innerHTML = '🔍 Vérification...';
        
        setTimeout(() => {
            // Simulation de vérification Docker
            const dockerRunning = Math.random() > 0.3; // 70% chance d'être actif
            
            if (dockerRunning) {
                serviceStates.docker = true;
                button.innerHTML = '✅ Docker actif';
                button.className = 'btn btn-success';
                showNotification('✅ Docker Desktop est en cours d\'exécution');
            } else {
                serviceStates.docker = false;
                button.innerHTML = '❌ Docker inactif';
                button.className = 'btn btn-danger';
                showNotification('❌ Docker Desktop n\'est pas démarré', 'warning');
            }
            
            button.disabled = false;
            updateServiceCounters();
        }, 1500);
    }
    
    function showAlternative() {
        showNotification('💡 Alternative recommandée: utilisez Ollama en ligne de commande pour de meilleures performances sur votre Mac', 'info');
    }
    
    function updateStats() {
        // Mettre à jour les stats affichées
        const elements = {
            'active-tools': systemStats.activeServices,
            'ram-usage': systemStats.ramUsage.toFixed(1) + 'GB',
            'cpu-usage': Math.round(systemStats.cpuUsage) + '%',
            'loaded-models': systemStats.loadedModels
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Mettre à jour les stats de configuration
        updateConfigStats();
    }
    
    function updateConfigStats() {
        const configElements = {
            'ram-status': `${systemStats.ramUsage.toFixed(1)}GB/8GB`,
            'cpu-status': `${Math.round(systemStats.cpuUsage)}%`,
            'services-status': `${systemStats.activeServices}/8 actifs`,
            'models-status': `${systemStats.loadedModels} chargés`
        };
        
        Object.entries(configElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    function updateServiceCounters() {
        // Compter les services actifs
        const activeCount = Object.values(serviceStates).filter(state => state).length;
        systemStats.activeServices = activeCount;
        updateStats();
    }
    
    function startMonitoring() {
        // Monitoring système simplifié
        setInterval(() => {
            // Légères variations des stats
            systemStats.cpuUsage += (Math.random() - 0.5) * 5;
            systemStats.cpuUsage = Math.max(5, Math.min(80, systemStats.cpuUsage));
            
            if (systemStats.activeServices > 0) {
                systemStats.ramUsage += (Math.random() - 0.5) * 0.1;
                systemStats.ramUsage = Math.max(1.5, Math.min(7.5, systemStats.ramUsage));
            }
            
            updateStats();
        }, 5000);
    }
    
    function getServiceDisplayName(serviceName) {
        const names = {
            ollama: 'Ollama',
            whisper: 'Whisper.cpp',
            chromadb: 'ChromaDB',
            jupyter: 'JupyterLab',
            docker: 'Docker'
        };
        return names[serviceName] || serviceName;
    }
    
    function showNotification(message, type = 'success') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        // Couleurs selon le type
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.success;
        notification.textContent = message;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'entrée
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Supprimer après 4 secondes
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Message de bienvenue
    setTimeout(() => {
        showNotification('🎯 Interface Mosaic Agent prête ! MacBook Pro 2015 optimisé', 'info');
    }, 1000);
    
    console.log('✅ Interface simple et efficace chargée');
});