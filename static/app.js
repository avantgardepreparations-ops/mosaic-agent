// Mosaic Agent - JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // System status simulation
    let activeServices = 0;
    let systemData = {
        ramUsage: 2.1,
        cpuUsage: 15,
        activeTools: 0,
        loadedModels: 0
    };

    // Initialize the interface
    initializeInterface();
    startSystemMonitoring();
    setupEventListeners();

    function initializeInterface() {
        console.log('🚀 Mosaic Agent initialized');
        updateSystemStats();
        checkServices();
    }

    function startSystemMonitoring() {
        // Simulate system monitoring every 5 seconds
        setInterval(() => {
            // Simulate some variation in system stats
            systemData.ramUsage += (Math.random() - 0.5) * 0.2;
            systemData.cpuUsage += (Math.random() - 0.5) * 10;
            
            // Keep values in realistic ranges
            systemData.ramUsage = Math.max(1.5, Math.min(7.5, systemData.ramUsage));
            systemData.cpuUsage = Math.max(5, Math.min(85, systemData.cpuUsage));
            
            updateSystemStats();
        }, 5000);
    }

    function updateSystemStats() {
        // Update RAM usage
        const ramElement = document.getElementById('ram-usage');
        if (ramElement) {
            ramElement.textContent = systemData.ramUsage.toFixed(1) + 'GB';
        }

        // Update CPU usage
        const cpuElement = document.getElementById('cpu-usage');
        if (cpuElement) {
            cpuElement.textContent = Math.round(systemData.cpuUsage) + '%';
        }

        // Update active tools
        const activeToolsElement = document.getElementById('active-tools');
        if (activeToolsElement) {
            activeToolsElement.textContent = systemData.activeTools;
        }

        // Update loaded models
        const loadedModelsElement = document.getElementById('loaded-models');
        if (loadedModelsElement) {
            loadedModelsElement.textContent = systemData.loadedModels;
        }

        // Update active services
        const activeServicesElement = document.getElementById('active-services');
        if (activeServicesElement) {
            activeServicesElement.textContent = activeServices;
        }
    }

    function setupEventListeners() {
        // Refresh all button
        const refreshAllBtn = document.getElementById('refresh-all');
        if (refreshAllBtn) {
            refreshAllBtn.addEventListener('click', function() {
                refreshAllServices();
            });
        }

        // Tool start/stop buttons
        setupToolButtons();
    }

    function setupToolButtons() {
        // Get all tool cards and add click handlers to their buttons
        const toolCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-md');
        
        toolCards.forEach((card, index) => {
            const startButton = card.querySelector('button:first-of-type');
            if (startButton && !startButton.querySelector('i.fa-download, i.fa-info, i.fa-cloud')) {
                startButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    toggleService(card, startButton, index);
                });
            }
        });
    }

    function toggleService(card, button, serviceIndex) {
        const isActive = button.classList.contains('bg-red-500');
        const toolName = card.querySelector('h3').textContent;
        
        if (isActive) {
            // Stop service
            stopService(button, toolName, serviceIndex);
        } else {
            // Start service
            startService(button, toolName, serviceIndex);
        }
    }

    function startService(button, toolName, serviceIndex) {
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Démarrage...';
        button.disabled = true;
        
        // Simulate service startup delay
        setTimeout(() => {
            // Update button to stop state
            button.innerHTML = '<i class="fas fa-stop mr-1"></i>Arrêter';
            button.classList.remove('bg-green-500', 'hover:bg-green-600', 'bg-blue-500', 'hover:bg-blue-600', 
                                   'bg-purple-500', 'hover:bg-purple-600', 'bg-orange-500', 'hover:bg-orange-600',
                                   'bg-yellow-500', 'hover:bg-yellow-600', 'bg-cyan-500', 'hover:bg-cyan-600');
            button.classList.add('bg-red-500', 'hover:bg-red-600');
            button.disabled = false;
            
            // Update counters
            activeServices++;
            systemData.activeTools++;
            if (toolName.includes('Ollama') || toolName.includes('LM Studio')) {
                systemData.loadedModels++;
            }
            
            updateSystemStats();
            showNotification(`✅ ${toolName} démarré avec succès`, 'success');
            
            // Simulate increased resource usage
            systemData.ramUsage += 0.5 + Math.random() * 1;
            systemData.cpuUsage += 10 + Math.random() * 20;
        }, 1000 + Math.random() * 2000);
    }

    function stopService(button, toolName, serviceIndex) {
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Arrêt...';
        button.disabled = true;
        
        // Simulate service shutdown delay
        setTimeout(() => {
            // Reset button to start state
            button.innerHTML = '<i class="fas fa-play mr-1"></i>Démarrer';
            button.classList.remove('bg-red-500', 'hover:bg-red-600');
            
            // Restore original color based on tool type
            if (toolName.includes('Ollama')) {
                button.classList.add('bg-green-500', 'hover:bg-green-600');
            } else if (toolName.includes('Whisper')) {
                button.classList.add('bg-blue-500', 'hover:bg-blue-600');
            } else if (toolName.includes('ChromaDB')) {
                button.classList.add('bg-purple-500', 'hover:bg-purple-600');
            } else if (toolName.includes('LangChain')) {
                button.classList.add('bg-orange-500', 'hover:bg-orange-600');
            } else if (toolName.includes('JupyterLab')) {
                button.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
            } else if (toolName.includes('Docker')) {
                button.classList.add('bg-cyan-500', 'hover:bg-cyan-600');
            } else {
                button.classList.add('bg-gray-500', 'hover:bg-gray-600');
            }
            
            button.disabled = false;
            
            // Update counters
            activeServices = Math.max(0, activeServices - 1);
            systemData.activeTools = Math.max(0, systemData.activeTools - 1);
            if (toolName.includes('Ollama') || toolName.includes('LM Studio')) {
                systemData.loadedModels = Math.max(0, systemData.loadedModels - 1);
            }
            
            updateSystemStats();
            showNotification(`⏹️ ${toolName} arrêté`, 'info');
            
            // Simulate decreased resource usage
            systemData.ramUsage -= 0.5 + Math.random() * 1;
            systemData.cpuUsage -= 10 + Math.random() * 20;
        }, 500 + Math.random() * 1000);
    }

    function refreshAllServices() {
        const refreshBtn = document.getElementById('refresh-all');
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i>Actualisation...';
        refreshBtn.disabled = true;
        
        // Simulate refresh delay
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Actualiser tout';
            refreshBtn.disabled = false;
            showNotification('🔄 État des services actualisé', 'info');
        }, 2000);
    }

    function checkServices() {
        // Simulate checking which services might be already running
        const services = ['ollama', 'jupyter', 'docker'];
        
        services.forEach((service, index) => {
            // Simulate some services being already active
            if (Math.random() > 0.7) {
                setTimeout(() => {
                    // Find the corresponding button and activate it
                    const toolCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-md');
                    if (toolCards[index]) {
                        const button = toolCards[index].querySelector('button:first-of-type');
                        if (button) {
                            const toolName = toolCards[index].querySelector('h3').textContent;
                            startService(button, toolName, index);
                        }
                    }
                }, index * 500);
            }
        });
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
        
        // Set color based on type
        switch(type) {
            case 'success':
                notification.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500', 'text-white');
                break;
            default:
                notification.classList.add('bg-blue-500', 'text-white');
        }
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${message}</span>
                <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effects for tool cards
    document.querySelectorAll('.bg-white.rounded-lg.shadow-md').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('transform', 'scale-105');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('transform', 'scale-105');
        });
    });

    // Simulate periodic system updates
    setInterval(() => {
        // Occasionally show system notifications
        if (Math.random() > 0.95) {
            const messages = [
                '💾 Modèle Mistral 7B chargé en cache',
                '🔧 Optimisation mémoire automatique',
                '📊 Métriques système mises à jour',
                '🚀 Performance CPU optimisée'
            ];
            showNotification(messages[Math.floor(Math.random() * messages.length)], 'info');
        }
    }, 10000);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + R: Refresh all services
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
            e.preventDefault();
            refreshAllServices();
        }
        
        // Escape: Close all notifications
        if (e.key === 'Escape') {
            document.querySelectorAll('.fixed.top-4.right-4').forEach(notification => {
                notification.remove();
            });
        }
    });

    console.log('🎯 Mosaic Agent ready! Use Cmd+Shift+R to refresh all services');
});

// Utility functions for external use
window.MosaicAgent = {
    showNotification: function(message, type = 'info') {
        // This allows external scripts to show notifications
        const event = new CustomEvent('showNotification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    },
    
    getSystemStats: function() {
        return {
            ramUsage: document.getElementById('ram-usage')?.textContent,
            cpuUsage: document.getElementById('cpu-usage')?.textContent,
            activeTools: document.getElementById('active-tools')?.textContent,
            loadedModels: document.getElementById('loaded-models')?.textContent
        };
    }
};