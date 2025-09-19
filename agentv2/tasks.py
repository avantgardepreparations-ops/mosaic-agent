from crewai import Task
from agents import prompt_refiner, solution_gatherer, innovator_agent, synthesizer_agent


def create_refine_task(user_prompt: str) -> Task:
    """
    Créer une tâche de raffinement du prompt utilisateur.
    
    Args:
        user_prompt (str): Le prompt initial de l'utilisateur
        
    Returns:
        Task: Tâche pour l'agent de raffinement
    """
    return Task(
        description=f"""
        Analyser et améliorer le prompt suivant de l'utilisateur :
        
        "{user_prompt}"
        
        Votre mission :
        1. Clarifier les ambiguïtés potentielles
        2. Enrichir le contexte si nécessaire
        3. Reformuler pour une meilleure compréhension par les modèles d'IA
        4. S'assurer que le prompt est complet et précis
        
        Retournez un prompt affiné, clair et optimisé.
        """,
        agent=prompt_refiner,
        expected_output="Un prompt clarifié, enrichi et optimisé pour les modèles d'IA"
    )


def create_gather_task(refined_prompt: str) -> Task:
    """
    Créer une tâche de collecte de solutions.
    
    Args:
        refined_prompt (str): Le prompt raffiné
        
    Returns:
        Task: Tâche pour l'agent de collecte
    """
    return Task(
        description=f"""
        Utiliser l'outil multi-LLM pour consulter plusieurs modèles de langage avec le prompt affiné :
        
        "{refined_prompt}"
        
        Votre mission :
        1. Soumettre le prompt à tous les modèles disponibles via l'outil Multi-LLM Query Tool
        2. Analyser et comparer les différentes réponses
        3. Synthétiser les meilleures idées de chaque modèle
        4. Créer une première ébauche de solution cohérente
        
        Utilisez explicitement l'outil "Multi-LLM Query Tool" pour obtenir des perspectives variées.
        """,
        agent=solution_gatherer,
        expected_output="Une solution préliminaire synthétisée à partir de plusieurs perspectives de modèles d'IA"
    )


def create_innovate_task(preliminary_solution: str) -> Task:
    """
    Créer une tâche d'innovation et d'amélioration de code.
    
    Args:
        preliminary_solution (str): La solution préliminaire à améliorer
        
    Returns:
        Task: Tâche pour l'agent innovateur
    """
    return Task(
        description=f"""
        Analyser et améliorer la solution préliminaire suivante :
        
        "{preliminary_solution}"
        
        Votre mission :
        1. Identifier les failles de sécurité potentielles
        2. Proposer des optimisations de performance
        3. Suggérer des possibilités d'extension et d'amélioration
        4. UTILISER EXPLICITEMENT les outils suivants pour valider et tester le code :
           - "Code Linter Tool" : Pour analyser statiquement le code Python et détecter les problèmes
           - "Code Sandbox Tool" : Pour exécuter et tester le code de manière sécurisée
        
        IMPORTANT : Vous DEVEZ utiliser ces outils pour :
        - Vérifier la qualité du code avec le linter
        - Tester l'exécution du code avec le sandbox
        - Valider que le code fonctionne correctement
        - Identifier les erreurs potentielles
        
        Fournissez des améliorations concrètes basées sur les résultats de ces outils.
        """,
        agent=innovator_agent,
        expected_output="Une solution améliorée avec analyse de sécurité, optimisations de performance et validation par les outils de test"
    )


def create_synthesize_task(initial_solution: str, improvements: str) -> Task:
    """
    Créer une tâche de synthèse finale.
    
    Args:
        initial_solution (str): La solution initiale
        improvements (str): Les améliorations proposées
        
    Returns:
        Task: Tâche pour l'agent synthétiseur
    """
    return Task(
        description=f"""
        Fusionner la solution initiale avec les améliorations proposées :
        
        SOLUTION INITIALE :
        {initial_solution}
        
        AMÉLIORATIONS PROPOSÉES :
        {improvements}
        
        Votre mission :
        1. Intégrer harmonieusement les améliorations dans la solution initiale
        2. S'assurer de la cohérence technique et logique
        3. Créer une documentation claire et complète
        4. Vérifier que la solution finale est facile à comprendre et à implémenter
        5. Présenter le résultat de manière structurée et professionnelle
        
        Retournez une solution finale complète, claire et vérifiée.
        """,
        agent=synthesizer_agent,
        expected_output="Une solution finale cohérente, claire, documentée et prête à être implémentée"
    )