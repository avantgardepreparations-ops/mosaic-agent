#!/usr/bin/env python3
"""
MosaicMind - AgentV2 Main Application
Système multi-agent pour assistance IA avec boucle de feedback utilisateur.
"""

import argparse
import sys
from crewai import Crew, Process
from tasks import create_refine_task, create_gather_task, create_innovate_task, create_synthesize_task
from agents import prompt_refiner, solution_gatherer, innovator_agent, synthesizer_agent


def create_crew_for_prompt(user_prompt: str, context: str = None) -> Crew:
    """
    Créer une instance de Crew pour traiter un prompt utilisateur.
    
    Args:
        user_prompt (str): Le prompt de l'utilisateur
        context (str): Contexte additionnel (feedback précédent, etc.)
        
    Returns:
        Crew: Instance configurée de Crew
    """
    # Si on a un contexte (feedback), l'intégrer au prompt
    if context:
        enhanced_prompt = f"""
        CONTEXTE PRÉCÉDENT ET FEEDBACK :
        {context}
        
        NOUVEAU PROMPT OU DEMANDE D'AMÉLIORATION :
        {user_prompt}
        
        Merci de prendre en compte le feedback pour améliorer la solution.
        """
    else:
        enhanced_prompt = user_prompt

    # Créer les tâches en séquence
    refine_task = create_refine_task(enhanced_prompt)
    gather_task = create_gather_task("{{refine_task.output}}")
    innovate_task = create_innovate_task("{{gather_task.output}}")
    synthesize_task = create_synthesize_task("{{gather_task.output}}", "{{innovate_task.output}}")

    # Créer l'équipe avec processus séquentiel
    crew = Crew(
        agents=[prompt_refiner, solution_gatherer, innovator_agent, synthesizer_agent],
        tasks=[refine_task, gather_task, innovate_task, synthesize_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew


def run_interactive_mode():
    """
    Mode interactif avec boucle de feedback utilisateur.
    """
    print("🤖 MosaicMind AgentV2 - Mode Interactif")
    print("=" * 50)
    print("Bienvenue ! Je suis votre assistant IA multi-agent.")
    print("Posez votre question et je consulterai plusieurs experts pour vous aider.")
    print("Après chaque réponse, vous pourrez donner un feedback pour l'améliorer.")
    print("Tapez 'exit' pour quitter.\n")
    
    context_history = ""
    iteration_count = 0
    
    while True:
        try:
            # Demander le prompt utilisateur
            if iteration_count == 0:
                prompt = input("🔤 Votre question ou demande : ").strip()
            else:
                prompt = input("\n🔄 Votre feedback ou nouvelle demande : ").strip()
            
            # Vérifier si l'utilisateur veut quitter
            if prompt.lower() in ['exit', 'quit', 'sortir', 'quitter']:
                print("\n👋 Au revoir ! Merci d'avoir utilisé MosaicMind AgentV2.")
                break
            
            if not prompt:
                print("⚠️  Veuillez entrer une question ou 'exit' pour quitter.")
                continue
            
            print(f"\n🚀 Traitement en cours... (Itération {iteration_count + 1})")
            print("=" * 50)
            
            # Créer et exécuter l'équipe
            crew = create_crew_for_prompt(prompt, context_history if iteration_count > 0 else None)
            result = crew.kickoff()
            
            # Afficher la solution
            print("\n" + "=" * 50)
            print("💡 SOLUTION PROPOSÉE")
            print("=" * 50)
            print(result)
            print("=" * 50)
            
            # Mettre à jour l'historique pour la prochaine itération
            context_history += f"\n\nItération {iteration_count + 1}:\n"
            context_history += f"Prompt: {prompt}\n"
            context_history += f"Solution: {result}\n"
            
            # Demander feedback
            print("\n💬 Que pensez-vous de cette solution ?")
            print("   • Donnez votre feedback pour l'améliorer")
            print("   • Posez une question de suivi")
            print("   • Tapez 'exit' pour terminer")
            
            iteration_count += 1
            
        except KeyboardInterrupt:
            print("\n\n👋 Interruption détectée. Au revoir !")
            break
        except Exception as e:
            print(f"\n❌ Erreur inattendue : {str(e)}")
            print("Veuillez réessayer ou tapez 'exit' pour quitter.")


def run_single_prompt_mode(prompt: str):
    """
    Mode simple avec un seul prompt.
    
    Args:
        prompt (str): Le prompt à traiter
    """
    print("🤖 MosaicMind AgentV2 - Mode Single")
    print("=" * 50)
    print(f"Traitement du prompt : {prompt}")
    print("=" * 50)
    
    try:
        # Créer et exécuter l'équipe
        crew = create_crew_for_prompt(prompt)
        result = crew.kickoff()
        
        # Afficher la solution
        print("\n" + "=" * 50)
        print("💡 SOLUTION")
        print("=" * 50)
        print(result)
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Erreur lors du traitement : {str(e)}")
        sys.exit(1)


def main():
    """
    Point d'entrée principal de l'application.
    """
    parser = argparse.ArgumentParser(
        description="MosaicMind AgentV2 - Assistant IA Multi-Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples d'utilisation :
  python main.py                           # Mode interactif
  python main.py --prompt "Votre question" # Mode single
  python main.py -p "Comment créer un web scraper en Python ?"
        """
    )
    
    parser.add_argument(
        "--prompt", "-p",
        type=str,
        help="Prompt unique à traiter (mode non-interactif)"
    )
    
    parser.add_argument(
        "--version", "-v",
        action="version",
        version="MosaicMind AgentV2 1.0.0"
    )
    
    args = parser.parse_args()
    
    # Vérifier le mode d'exécution
    if args.prompt:
        # Mode single prompt
        run_single_prompt_mode(args.prompt)
    else:
        # Mode interactif
        run_interactive_mode()


if __name__ == "__main__":
    main()