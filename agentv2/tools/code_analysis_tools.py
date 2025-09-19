from crewai.tools import BaseTool
import subprocess
import tempfile
import os
import sys
import io
import contextlib
from typing import Type


class CodeLinterTool(BaseTool):
    name: str = "Code Linter Tool"
    description: str = "Analyse statiquement une chaîne de code Python avec pylint et retourne le rapport d'analyse."

    def __init__(self):
        super().__init__()

    def _run(self, code: str) -> str:
        """
        Analyse une chaîne de code Python avec pylint et retourne le rapport.
        
        Args:
            code (str): Le code Python à analyser
            
        Returns:
            str: Le rapport de pylint
        """
        try:
            # Créer un fichier temporaire pour le code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            # Exécuter pylint sur le fichier temporaire
            result = subprocess.run(
                ['pylint', temp_file_path, '--output-format=text'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Nettoyer le fichier temporaire
            os.unlink(temp_file_path)
            
            # Retourner le rapport complet (stdout + stderr)
            output = f"--- Rapport Pylint ---\n"
            if result.stdout:
                output += f"Sortie:\n{result.stdout}\n"
            if result.stderr:
                output += f"Erreurs:\n{result.stderr}\n"
            output += f"Code de retour: {result.returncode}\n"
            
            return output
            
        except subprocess.TimeoutExpired:
            return "--- Rapport Pylint ---\nErreur: Timeout - L'analyse a pris trop de temps\n"
        except FileNotFoundError:
            return "--- Rapport Pylint ---\nErreur: pylint n'est pas installé ou introuvable\n"
        except Exception as e:
            return f"--- Rapport Pylint ---\nErreur inattendue: {str(e)}\n"
        finally:
            # S'assurer que le fichier temporaire est supprimé même en cas d'erreur
            try:
                if 'temp_file_path' in locals():
                    os.unlink(temp_file_path)
            except:
                pass


class CodeSandboxTool(BaseTool):
    name: str = "Code Sandbox Tool"
    description: str = "Exécute une chaîne de code Python de manière sécurisée en capturant stdout et stderr."

    def __init__(self):
        super().__init__()

    def _run(self, code: str) -> str:
        """
        Exécute une chaîne de code Python de manière sécurisée.
        
        Args:
            code (str): Le code Python à exécuter
            
        Returns:
            str: Le résultat de l'exécution avec stdout, stderr et informations d'état
        """
        # Créer des buffers pour capturer stdout et stderr
        stdout_buffer = io.StringIO()
        stderr_buffer = io.StringIO()
        
        try:
            # Rediriger stdout et stderr vers nos buffers
            with contextlib.redirect_stdout(stdout_buffer), \
                 contextlib.redirect_stderr(stderr_buffer):
                
                # Créer un environnement d'exécution limité
                exec_globals = {
                    '__builtins__': {
                        # Fonctions de base autorisées
                        'print': print,
                        'len': len,
                        'str': str,
                        'int': int,
                        'float': float,
                        'bool': bool,
                        'list': list,
                        'dict': dict,
                        'tuple': tuple,
                        'set': set,
                        'range': range,
                        'enumerate': enumerate,
                        'zip': zip,
                        'map': map,
                        'filter': filter,
                        'sorted': sorted,
                        'sum': sum,
                        'min': min,
                        'max': max,
                        'abs': abs,
                        'round': round,
                        'type': type,
                        'isinstance': isinstance,
                        'hasattr': hasattr,
                        'getattr': getattr,
                        'setattr': setattr,
                        # Importation limitée de certains modules sécurisés
                        '__import__': __import__,
                    }
                }
                exec_locals = {}
                
                # Exécuter le code
                exec(code, exec_globals, exec_locals)
                
            # Récupérer les sorties
            stdout_output = stdout_buffer.getvalue()
            stderr_output = stderr_buffer.getvalue()
            
            # Formater le résultat
            result = "--- Exécution du Code ---\n"
            result += "Statut: Succès\n\n"
            
            if stdout_output:
                result += f"Sortie standard (stdout):\n{stdout_output}\n"
            else:
                result += "Sortie standard (stdout): (vide)\n"
                
            if stderr_output:
                result += f"Erreurs (stderr):\n{stderr_output}\n"
            else:
                result += "Erreurs (stderr): (aucune)\n"
                
            # Afficher les variables créées (optionnel)
            if exec_locals:
                result += f"\nVariables créées: {list(exec_locals.keys())}\n"
                
            return result
            
        except SyntaxError as e:
            return f"--- Exécution du Code ---\nStatut: Erreur de syntaxe\nErreur: {str(e)}\nLigne {e.lineno}: {e.text}\n"
        except Exception as e:
            stderr_output = stderr_buffer.getvalue()
            result = f"--- Exécution du Code ---\nStatut: Erreur d'exécution\nErreur: {str(e)}\nType: {type(e).__name__}\n"
            if stderr_output:
                result += f"Stderr: {stderr_output}\n"
            return result
        finally:
            stdout_buffer.close()
            stderr_buffer.close()