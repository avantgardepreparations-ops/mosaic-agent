# MosaicMind - AgentV2

Cette version est une implémentation d'une architecture multi-agent conçue pour être 100% locale et utiliser des modèles de langage open source via Ollama.

## Architecture

Le système est basé sur le framework `CrewAI` et suit un pipeline séquentiel :

1.  **Agent d'Affinement** : Clarifie le prompt de l'utilisateur.
2.  **Agent de Recueillement** : Soumet le prompt affiné à **plusieurs LLMs locaux** et synthétise une première solution.
3.  **Agent Innovateur** : Analyse la solution pour l'améliorer (sécurité, performance) **avec des outils d'analyse de code**.
4.  **Agent Synthétiseur** : Intègre les améliorations pour produire la réponse finale.

## 🚀 Nouvelles Fonctionnalités (Phases 2 & 3)

### Phase 2 : Super-Pouvoirs pour l'Agent Innovateur

L'agent innovateur dispose maintenant d'outils avancés d'analyse de code :

- **CodeLinterTool** : Analyse statique du code Python avec pylint
- **CodeSandboxTool** : Exécution sécurisée du code avec capture des sorties

Ces outils permettent à l'agent de :
- ✅ Vérifier la qualité du code automatiquement
- ✅ Détecter les erreurs de syntaxe et de style
- ✅ Tester l'exécution du code en toute sécurité
- ✅ Identifier les problèmes de performance
- ✅ Proposer des améliorations basées sur des analyses concrètes

### Phase 3 : Boucle de Feedback Utilisateur

Le système propose maintenant une interface interactive permettant :

- **Mode Interactif** : Dialogue continu avec feedback utilisateur
- **Mode Single** : Traitement d'un prompt unique
- **Intégration Contextuelle** : Chaque itération prend en compte l'historique
- **Amélioration Continue** : Les solutions s'affinent selon les retours

## Comment l'utiliser

### 1. Pré-requis

- Assurez-vous que [Ollama](https://ollama.com/) est installé et en cours d'exécution.
- Téléchargez les modèles que vous souhaitez utiliser. Par exemple :
  ```sh
  ollama pull llama3
  ollama pull mistral
  ollama pull codegemma
  ```

### 2. Installation

Installez les dépendances Python :
```sh
pip install -r requirements.txt
```

### 3. Configuration

Modifiez le fichier `config.py` pour lister les modèles Ollama que vous avez téléchargés et que vous souhaitez utiliser.

### 4. Exécution

#### Mode Interactif (Recommandé)
```sh
python main.py
```

#### Mode Single Prompt
```sh
python main.py --prompt "Comment créer un web scraper simple en Python avec BeautifulSoup ?"
```

#### Options disponibles
```sh
python main.py --help
```

## 🛠️ Outils d'Analyse de Code

### CodeLinterTool
Utilise pylint pour analyser statiquement le code Python :
- Détection des erreurs de style
- Identification des variables non utilisées
- Vérification des conventions de nommage
- Évaluation de la qualité globale du code

### CodeSandboxTool
Exécute le code Python de manière sécurisée :
- Environnement d'exécution limité
- Capture des sorties stdout/stderr
- Gestion des erreurs de syntaxe et d'exécution
- Isolation des variables créées

## 🔄 Flux de Travail avec Feedback

1. **Premier Prompt** : L'utilisateur pose une question
2. **Traitement Multi-Agent** : Les 4 agents travaillent en séquence
3. **Solution Proposée** : Affichage de la solution avec analyse de code
4. **Feedback Utilisateur** : L'utilisateur peut donner son retour
5. **Amélioration Itérative** : Nouvelle solution basée sur le feedback
6. **Répétition** : Le processus continue jusqu'à satisfaction

## 📁 Structure des Fichiers

```
agentv2/
├── main.py                    # Point d'entrée principal avec boucle interactive
├── agents.py                  # Définition des 4 agents avec leurs outils
├── tasks.py                   # Définition des tâches pour chaque agent
├── config.py                  # Configuration des modèles Ollama
├── requirements.txt           # Dépendances Python
└── tools/
    ├── local_llm_tool.py      # Outil de consultation multi-LLM
    └── code_analysis_tools.py # Outils d'analyse de code (linter + sandbox)
```

## 🎯 Exemple d'Utilisation

```bash
$ python main.py

🤖 MosaicMind AgentV2 - Mode Interactif
==================================================
Bienvenue ! Je suis votre assistant IA multi-agent.
Posez votre question et je consulterai plusieurs experts pour vous aider.
Après chaque réponse, vous pourrez donner un feedback pour l'améliorer.
Tapez 'exit' pour quitter.

🔤 Votre question ou demande : Comment créer une fonction pour calculer le factoriel ?

🚀 Traitement en cours... (Itération 1)
==================================================

[L'agent d'affinement clarifie la demande]
[L'agent de recueillement consulte plusieurs LLMs]
[L'agent innovateur analyse et teste le code avec pylint et sandbox]
[L'agent synthétiseur produit la solution finale]

💡 SOLUTION PROPOSÉE
==================================================
[Solution complète avec code testé et analysé]
==================================================

💬 Que pensez-vous de cette solution ?
   • Donnez votre feedback pour l'améliorer
   • Posez une question de suivi
   • Tapez 'exit' pour terminer

🔄 Votre feedback ou nouvelle demande : Peux-tu optimiser cette fonction pour de grands nombres ?

[Le processus recommence en tenant compte du feedback...]
```

Cette architecture offre une approche robuste et interactive pour l'assistance au développement, combinant l'expertise de plusieurs modèles avec des outils d'analyse concrets.