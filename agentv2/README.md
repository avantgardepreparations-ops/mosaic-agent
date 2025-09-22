# MosaicMind - AgentV2

Cette version est une implémentation d'une architecture multi-agent conçue pour être 100% locale et utiliser des modèles de langage open source via Ollama.

## Architecture

Le système est basé sur le framework `CrewAI` et suit un pipeline séquentiel :

1.  **Agent d'Affinement** : Clarifie le prompt de l'utilisateur.
2.  **Agent de Recueillement** : Soumet le prompt affiné à **plusieurs LLMs locaux** et synthétise une première solution.
3.  **Agent Innovateur** : Analyse la solution pour l'améliorer (sécurité, performance).
4.  **Agent Synthétiseur** : Intègre les améliorations pour produire la réponse finale.

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

Lancez le script principal avec votre question :
```sh
python main.py --prompt "Comment créer un web scraper simple en Python avec BeautifulSoup ?"
```