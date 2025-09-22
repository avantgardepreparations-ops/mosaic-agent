import uuid
from datetime import datetime
from typing import Any, Dict, List

class FinalAgent:
    """
    Agent Final chargé de:
    - Valider la structure d'entrée
    - Calculer métriques d'amélioration
    - Produire un rapport final livrable
    SANS exécution de code arbitraire.
    """

    REQUIRED_FIELDS = ["run_id", "stage", "merged_code", "variants", "optimizations"]

    def validate(self, data: Dict[str, Any]) -> List[str]:
        errors = []
        for f in self.REQUIRED_FIELDS:
            if f not in data:
                errors.append(f"Champ manquant: {f}")
        if "variants" in data:
            if not isinstance(data["variants"], list) or len(data["variants"]) == 0:
                errors.append("variants doit être une liste non vide")
        if "merged_code" in data and not isinstance(data["merged_code"], str):
            errors.append("merged_code doit être une chaîne")
        bench = data.get("optimizations", {}).get("benchmark", {})
        if bench:
            base = bench.get("baseline_ms")
            opt = bench.get("optimized_ms")
            if not (isinstance(base, (int, float)) and isinstance(opt, (int, float)) and base > 0 and opt > 0):
                errors.append("benchmark baseline_ms/optimized_ms invalides ou manquants")
        return errors

    def compute_improvement(self, baseline: float, optimized: float) -> float:
        if baseline <= 0 or optimized <= 0:
            return 0.0
        ratio = (baseline - optimized) / baseline
        return max(0.0, ratio)

    def run(self, final_input: Dict[str, Any]) -> Dict[str, Any]:
        validation_errors = self.validate(final_input)
        if validation_errors:
            return {
                "error": {
                    "code": "VALIDATION_FAILED",
                    "details": validation_errors
                }
            }

        bench = final_input.get("optimizations", {}).get("benchmark", {})
        improvement_ratio = 0.0
        if bench:
            improvement_ratio = self.compute_improvement(
                bench.get("baseline_ms", 0),
                bench.get("optimized_ms", 0)
            )

        report = {
            "run_id": final_input.get("run_id"),
            "stage": "FINAL_REPORT",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "report": {
                "summary": "Succès",
                "variant_count": len(final_input.get("variants", [])),
                "improvement_ratio": round(improvement_ratio, 4),
                "checks": {
                    "structure": "pass",
                    "merged_code_present": bool(final_input.get("merged_code")),
                    "optimizations_present": "optimizations" in final_input
                }
            },
            "delivery": {
                "final_code_excerpt": final_input.get("merged_code", "")[:280],
                "next_steps": [
                    "sandbox_docker",
                    "coverage>85",
                    "orchestrateur_integration"
                ]
            }
        }
        return report


def simulate_final_agent_payload() -> Dict[str, Any]:
    """Construit une charge utile simulée pour tests."""
    return {
        "run_id": str(uuid.uuid4()),
        "stage": "INNOVATION",
        "merged_code": "def foo():\n    return 'bar'\n",
        "variants": [
            {"id": "ia_1", "score": 0.81},
            {"id": "ia_2", "score": 0.76}
        ],
        "optimizations": {
            "applied": ["refactor_io", "cache_layer"],
            "benchmark": {"baseline_ms": 120, "optimized_ms": 85}
        }
    }