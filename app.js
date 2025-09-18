// AI Tools Configuration
const aiTools = [
    {
        id: 'ollama',
        name: 'Ollama',
        type: 'Interface LLM Local',
        description: 'Serveur local pour exécuter LLaMA, Mistral et autres modèles LLM avec quantification GGUF.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'compatible',
        macNote: 'Utilisez des modèles 2-4B quantifiés pour de meilleures performances.',
        icon: 'fas fa-brain',
        color: 'green',
        features: ['Modèles quantifiés', 'API REST', 'CPU optimisé'],
        documentation: 'https://ollama.ai/docs',
        github: 'https://github.com/ollama/ollama',
        installCommand: 'brew install ollama',
        exampleUsage: `# Installer un modèle
ollama pull llama2:7b-chat-q4_0

# Lancer une conversation
curl http://localhost:11434/api/generate \\
  -d '{"model": "llama2:7b-chat-q4_0", "prompt": "Code me a Python function"}'`,
        requirements: ['8GB RAM minimum', 'macOS 12+', 'Intel/Apple Silicon']
    },
    {
        id: 'whisper',
        name: 'Whisper.cpp',
        type: 'Speech-to-Text',
        description: 'Transcription audio locale rapide optimisée CPU, basée sur le modèle Whisper d\'OpenAI.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'excellent',
        macNote: 'Performance excellente sur CPU Intel, très efficace pour la transcription.',
        icon: 'fas fa-microphone',
        color: 'blue',
        features: ['Transcription locale', 'Multiple langues', 'Optimisé CPU'],
        documentation: 'https://github.com/ggerganov/whisper.cpp',
        github: 'https://github.com/ggerganov/whisper.cpp',
        installCommand: 'brew install whisper-cpp',
        exampleUsage: `# Transcrire un fichier audio
whisper-cpp -m models/ggml-base.bin -f audio.wav

# Utilisation Python
import whisper
model = whisper.load_model("base")
result = model.transcribe("audio.wav")`,
        requirements: ['Audio input', 'Modèle Whisper téléchargé']
    },
    {
        id: 'chromadb',
        name: 'ChromaDB',
        type: 'Base de Données Vectorielle',
        description: 'Base de données vectorielle pour stocker et rechercher des embeddings, parfaite pour la mémoire IA.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'excellent',
        macNote: 'Fonctionne parfaitement en local, idéal pour indexer du code et de la documentation.',
        icon: 'fas fa-database',
        color: 'purple',
        features: ['Recherche vectorielle', 'Embeddings', 'API Python'],
        documentation: 'https://docs.trychroma.com/',
        github: 'https://github.com/chroma-core/chroma',
        installCommand: 'pip install chromadb',
        exampleUsage: `# Créer une collection
import chromadb
client = chromadb.Client()
collection = client.create_collection("code_snippets")

# Ajouter des documents
collection.add(
    documents=["def hello(): return 'world'"],
    metadatas=[{"language": "python"}],
    ids=["snippet1"]
)`,
        requirements: ['Python 3.7+', 'SQLite']
    },
    {
        id: 'langchain',
        name: 'LangChain',
        type: 'Framework d\'Agents IA',
        description: 'Framework pour créer des applications IA avec chaînage de prompts, mémoire et agents.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'excellent',
        macNote: 'Framework Python pur, fonctionne parfaitement sur votre Mac.',
        icon: 'fas fa-link',
        color: 'indigo',
        features: ['Chaînage prompts', 'Agents autonomes', 'Intégrations multiples'],
        documentation: 'https://python.langchain.com/',
        github: 'https://github.com/langchain-ai/langchain',
        installCommand: 'pip install langchain',
        exampleUsage: `# Créer un agent simple
from langchain.agents import initialize_agent
from langchain.llms import Ollama

llm = Ollama(model="llama2")
agent = initialize_agent(tools, llm, agent="zero-shot-react-description")
agent.run("Explique-moi le machine learning")`,
        requirements: ['Python 3.8+', 'Un modèle LLM (Ollama)']
    },
    {
        id: 'jupyter',
        name: 'JupyterLab',
        type: 'IDE Interactif',
        description: 'Environnement de développement interactif pour Python, parfait pour expérimenter avec l\'IA.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'excellent',
        macNote: 'IDE standard pour data science, fonctionne parfaitement sur votre configuration.',
        icon: 'fas fa-laptop-code',
        color: 'orange',
        features: ['Notebooks interactifs', 'Visualisations', 'Extensions IA'],
        documentation: 'https://jupyterlab.readthedocs.io/',
        github: 'https://github.com/jupyterlab/jupyterlab',
        installCommand: 'pip install jupyterlab',
        exampleUsage: `# Lancer JupyterLab
jupyter lab

# Dans un notebook
import pandas as pd
import matplotlib.pyplot as plt
# Votre code IA ici...`,
        requirements: ['Python 3.6+', 'Navigateur web']
    },
    {
        id: 'faiss',
        name: 'FAISS',
        type: 'Recherche de Similarité',
        description: 'Bibliothèque de Facebook pour la recherche de similarité et clustering d\'embeddings denses.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'good',
        macNote: 'Fonctionne bien sur CPU, version GPU non disponible sur votre Mac.',
        icon: 'fas fa-search',
        color: 'teal',
        features: ['Recherche rapide', 'Clustering', 'Optimisé CPU'],
        documentation: 'https://faiss.ai/',
        github: 'https://github.com/facebookresearch/faiss',
        installCommand: 'pip install faiss-cpu',
        exampleUsage: `# Créer un index FAISS
import faiss
import numpy as np

dimension = 128
index = faiss.IndexFlatIP(dimension)
vectors = np.random.random((1000, dimension)).astype('float32')
index.add(vectors)`,
        requirements: ['NumPy', 'Python 3.7+']
    },
    {
        id: 'stable-diffusion',
        name: 'Stable Diffusion (CPU)',
        type: 'Génération d\'Images',
        description: 'Génération d\'images IA avec Stable Diffusion optimisé pour CPU (performances limitées).',
        compatibility: 'limited',
        status: 'inactive',
        macCompatibility: 'limited',
        macNote: 'Très lent sur CPU Intel. Cloud recommandé pour usage intensif.',
        icon: 'fas fa-image',
        color: 'pink',
        features: ['Text-to-image', 'CPU optimisé', 'Modèles compacts'],
        documentation: 'https://huggingface.co/docs/diffusers/',
        github: 'https://github.com/huggingface/diffusers',
        installCommand: 'pip install diffusers torch torchvision',
        exampleUsage: `# Génération d'image simple
from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float32
)
image = pipe("A futuristic coding workspace").images[0]`,
        requirements: ['8GB+ RAM', 'Patience (lent sur CPU)', 'Espace disque (4GB+)']
    },
    {
        id: 'text-generation-webui',
        name: 'Text Generation WebUI',
        type: 'Interface LLM Avancée',
        description: 'Interface web complète pour charger, configurer et fine-tuner des modèles de langage.',
        compatibility: 'limited',
        status: 'inactive',
        macCompatibility: 'limited',
        macNote: 'Fonctionnel mais limité sans GPU. Préférez Ollama pour votre configuration.',
        icon: 'fas fa-desktop',
        color: 'gray',
        features: ['Interface web', 'Fine-tuning', 'Multi-modèles'],
        documentation: 'https://github.com/oobabooga/text-generation-webui',
        github: 'https://github.com/oobabooga/text-generation-webui',
        installCommand: 'git clone https://github.com/oobabooga/text-generation-webui.git',
        exampleUsage: `# Installation et lancement
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui
pip install -r requirements.txt
python server.py --cpu`,
        requirements: ['Python 3.8+', 'Git', 'Modèles compatibles']
    },
    {
        id: 'docker',
        name: 'Docker',
        type: 'Conteneurisation',
        description: 'Platform de conteneurisation pour isoler et déployer facilement les outils IA.',
        compatibility: 'local',
        status: 'inactive',
        macCompatibility: 'excellent',
        macNote: 'Essentiel pour éviter les conflits de dépendances entre outils IA.',
        icon: 'fab fa-docker',
        color: 'blue',
        features: ['Isolation', 'Déploiement facile', 'Pas de conflits'],
        documentation: 'https://docs.docker.com/',
        github: 'https://github.com/docker',
        installCommand: 'brew install --cask docker',
        exampleUsage: `# Lancer Ollama dans Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# Lancer JupyterLab
docker run -p 8888:8888 jupyter/scipy-notebook`,
        requirements: ['macOS 10.15+', 'Docker Desktop']
    }
];

// Application State
let appState = {
    activeTools: new Set(),
    toolStatuses: {}
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeToolsGrid();
    initializeEventListeners();
    updateDashboardStats();
});

// Initialize tools grid
function initializeToolsGrid() {
    const toolsGrid = document.getElementById('tools-grid');
    
    aiTools.forEach(tool => {
        const toolCard = createToolCard(tool);
        toolsGrid.appendChild(toolCard);
    });
}

// Create tool card
function createToolCard(tool) {
    const compatibilityBadge = getCompatibilityBadge(tool.macCompatibility);
    const statusBadge = getStatusBadge(tool.status);
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden';
    card.innerHTML = `
        <div class="p-6">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="text-2xl text-${tool.color}-500">
                        <i class="${tool.icon}"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-800">${tool.name}</h3>
                        <p class="text-sm text-gray-500">${tool.type}</p>
                    </div>
                </div>
                ${statusBadge}
            </div>
            
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${tool.description}</p>
            
            <div class="mb-4">
                ${compatibilityBadge}
                <div class="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <i class="fas fa-info-circle mr-1"></i>
                    ${tool.macNote}
                </div>
            </div>
            
            <div class="mb-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">Fonctionnalités:</h4>
                <div class="flex flex-wrap gap-1">
                    ${tool.features.map(feature => 
                        `<span class="px-2 py-1 bg-${tool.color}-100 text-${tool.color}-800 text-xs rounded-full">${feature}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="space-y-2">
                <button onclick="toggleTool('${tool.id}')" 
                        class="w-full px-4 py-2 bg-${tool.color}-500 text-white rounded hover:bg-${tool.color}-600 transition-colors">
                    <i class="fas fa-power-off mr-2"></i>
                    ${tool.status === 'active' ? 'Arrêter' : 'Démarrer'}
                </button>
                
                <div class="flex space-x-2">
                    <button onclick="showToolDetails('${tool.id}')" 
                            class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                        <i class="fas fa-info mr-1"></i>
                        Détails
                    </button>
                    <button onclick="openUrl('${tool.github}')" 
                            class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                        <i class="fab fa-github mr-1"></i>
                        GitHub
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Get compatibility badge
function getCompatibilityBadge(compatibility) {
    const badges = {
        'excellent': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>Excellent sur Mac</span>',
        'good': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><i class="fas fa-check mr-1"></i>Compatible Mac</span>',
        'compatible': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-exclamation-triangle mr-1"></i>Modèles légers</span>',
        'limited': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><i class="fas fa-cloud mr-1"></i>Cloud recommandé</span>'
    };
    return badges[compatibility] || badges['compatible'];
}

// Get status badge
function getStatusBadge(status) {
    return status === 'active' ? 
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-circle mr-1 text-green-400"></i>Actif</span>' :
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><i class="fas fa-circle mr-1 text-gray-400"></i>Inactif</span>';
}

// Toggle tool status
function toggleTool(toolId) {
    const tool = aiTools.find(t => t.id === toolId);
    if (!tool) return;
    
    // Simulate API call
    showNotification(`${tool.status === 'active' ? 'Arrêt' : 'Démarrage'} de ${tool.name}...`, 'info');
    
    setTimeout(() => {
        tool.status = tool.status === 'active' ? 'inactive' : 'active';
        if (tool.status === 'active') {
            appState.activeTools.add(toolId);
        } else {
            appState.activeTools.delete(toolId);
        }
        
        // Refresh the tools grid
        refreshToolsGrid();
        updateDashboardStats();
        
        showNotification(`${tool.name} ${tool.status === 'active' ? 'démarré' : 'arrêté'} avec succès!`, 'success');
    }, 1500);
}

// Show tool details modal
function showToolDetails(toolId) {
    const tool = aiTools.find(t => t.id === toolId);
    if (!tool) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <i class="${tool.icon} text-2xl text-${tool.color}-500"></i>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">${tool.name}</h2>
                            <p class="text-gray-600">${tool.type}</p>
                        </div>
                    </div>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Description</h3>
                        <p class="text-gray-600">${tool.description}</p>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Installation</h3>
                        <div class="bg-gray-100 p-3 rounded-lg">
                            <code class="text-sm">${tool.installCommand}</code>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Exemple d'utilisation</h3>
                        <pre class="bg-gray-100 p-3 rounded-lg text-sm overflow-x-auto"><code>${tool.exampleUsage}</code></pre>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Prérequis</h3>
                        <ul class="list-disc list-inside space-y-1 text-gray-600">
                            ${tool.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="flex space-x-4">
                        <a href="${tool.documentation}" target="_blank" 
                           class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center">
                            <i class="fas fa-book mr-2"></i>Documentation
                        </a>
                        <a href="${tool.github}" target="_blank" 
                           class="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors text-center">
                            <i class="fab fa-github mr-2"></i>Code Source
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

// Open URL in new tab
function openUrl(url) {
    window.open(url, '_blank');
}

// Refresh tools grid
function refreshToolsGrid() {
    const toolsGrid = document.getElementById('tools-grid');
    toolsGrid.innerHTML = '';
    initializeToolsGrid();
}

// Update dashboard statistics
function updateDashboardStats() {
    const activeCount = aiTools.filter(tool => tool.status === 'active').length;
    const localCompatible = aiTools.filter(tool => ['excellent', 'good', 'compatible'].includes(tool.macCompatibility)).length;
    const cloudRecommended = aiTools.filter(tool => tool.macCompatibility === 'limited').length;
    
    document.getElementById('active-tools').textContent = activeCount;
    document.getElementById('local-compatible').textContent = localCompatible;
    document.getElementById('cloud-recommended').textContent = cloudRecommended;
    document.getElementById('total-tools').textContent = aiTools.length;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${getNotificationClasses(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${getNotificationIcon(type)} mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Get notification classes
function getNotificationClasses(type) {
    const classes = {
        'success': 'bg-green-100 text-green-800 border border-green-200',
        'error': 'bg-red-100 text-red-800 border border-red-200',
        'warning': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'info': 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return classes[type] || classes['info'];
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || icons['info'];
}

// Initialize event listeners
function initializeEventListeners() {
    // Smooth scrolling for navigation
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
}

// API Communication Functions
async function makeAPICall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`http://localhost:5000/api/${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Erreur de connexion à l\'API', 'error');
        return null;
    }
}