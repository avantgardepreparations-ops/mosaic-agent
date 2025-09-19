from crewai.tools import BaseTool
from langchain_community.llms import Ollama
from typing import Type, List, Any
import concurrent.futures
from pydantic import Field

class MultiLLMQueryTool(BaseTool):
    name: str = "Multi-LLM Query Tool"
    description: str = "Prend un prompt et l'envoie à une liste prédéfinie de modèles de langage locaux (LLMs) pour obtenir diverses perspectives et solutions."
    models: List[str] = Field(default_factory=list)

    def __init__(self, models: List[str] = None, **kwargs):
        if models is None:
            models = []
        super().__init__(models=models, **kwargs)

    def _run(self, prompt: str) -> str:
        """
        Envoie le prompt à plusieurs modèles Ollama en parallèle et agrège leurs réponses.
        """
        if not self.models:
            return "--- Erreur ---\nAucun modèle configuré pour cette requête.\n"
            
        aggregated_responses = []

        def query_model(model_name):
            try:
                llm = Ollama(model=model_name)
                response = llm.invoke(prompt)
                return f"--- Réponse de {model_name} ---\n{response}\n\n"
            except Exception as e:
                return f"--- Erreur avec {model_name} ---\n{str(e)}\n\n"

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_to_model = {executor.submit(query_model, model): model for model in self.models}
            for future in concurrent.futures.as_completed(future_to_model):
                aggregated_responses.append(future.result())

        return "".join(aggregated_responses)