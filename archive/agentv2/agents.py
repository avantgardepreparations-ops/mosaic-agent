from crewai import Agent
from langchain_community.llms import Ollama
from tools.local_llm_tool import MultiLLMQueryTool
from config import LOCAL_MODELS_TO_QUERY, MAIN_LLM_MODEL

# Initialisation du LLM principal pour le raisonnement des agents
main_llm = Ollama(model=MAIN_LLM_MODEL)

# Initialisation de l'outil de distribution multi-LLM
multi_llm_tool = MultiLLMQueryTool(models=LOCAL_MODELS_TO_QUERY)

# --- Définition des Agents ---

prompt_refiner = Agent(
  role='Spécialiste en Ingénierie de Prompts',
  goal="Clarifier, enrichir et reformuler le prompt initial de l'utilisateur pour qu'il soit précis, non ambigu et optimisé pour les modèles d'IA.",
  backstory="Expert en traduction d'intention humaine en instruction machine claire.",
  llm=main_llm,
  verbose=True
)

solution_gatherer = Agent(
  role='Architecte de solutions IA',
  goal="Prendre un prompt affiné, le soumettre à diverses sources d'information (via l'outil multi-LLM) et agréger les idées pour former une première ébauche de solution.",
  backstory="Architecte pragmatique qui consulte rapidement de multiples experts pour synthétiser une vue d'ensemble.",
  tools=[multi_llm_tool],
  llm=main_llm,
  verbose=True
)

innovator_agent = Agent(
  role='Ingénieur en Amélioration de Code et Sécurité',
  goal="Prendre une solution préliminaire, l'analyser pour trouver des failles de sécurité, des optimisations de performance et des possibilités d'extension.",
  backstory="Passionné par l'excellence technique, vous rendez le code non seulement fonctionnel, mais aussi robuste, rapide et sécurisé.",
  # Note: Un outil de 'sandbox' pour exécuter le code serait ajouté ici.
  # tools=[code_sandbox_tool],
  llm=main_llm,
  verbose=True
)

synthesizer_agent = Agent(
  role='Rédacteur Technique et Analyste Qualité',
  goal="Fusionner la solution initiale avec les améliorations proposées pour créer une réponse finale cohérente, claire et vérifiée.",
  backstory="Avec un œil pour le détail, vous transformez des concepts techniques en une solution finale élégante et facile à comprendre.",
  llm=main_llm,
  verbose=True
)