# Configuration des modèles de langage locaux

# Assurez-vous que ces modèles ont été téléchargés via Ollama.
# Exemple : ollama pull llama3
#           ollama pull mistral
LOCAL_MODELS_TO_QUERY = [
    "llama3",
    "mistral",
    "codegemma"
]

# Modèle principal utilisé par les agents pour le raisonnement (le plus performant de préférence)
MAIN_LLM_MODEL = "llama3"