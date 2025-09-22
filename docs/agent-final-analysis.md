# Agent Final – Analyse Fonctionnelle & Technique

## 1. Contexte
Ce dépôt héberge une expérimentation multi‑agents. L'agent final clôt la chaîne en produisant un rapport consolidé prêt à être livré.

## 2. Pipeline Référence (Étapes 1 → 9)
1. Prompt initial utilisateur  
2. Affinement initial (clarifications)  
3. Génération parallèle (plusieurs producteurs)  
4. Récolte / Normalisation  
5. Vérification faisabilité (syntaxe / dépendances)  
6. Affinement secondaire (3 variantes)  
7. Assemblage / Fusion préférentielle  
8. Innovation (optimisation / benchmarks)  
9. Vérification finale & Rapport (Agent Final)

## 3. Rôle de l'Agent Final
Entrée attendue (exemple):
```json
{
  "run_id": "uuid-v4",
  "stage": "INNOVATION",
  "merged_code": "....",
  "variants": [
    {"id":"ia_1","score":0.81},
    {"id":"ia_2","score":0.76}
  ],
  "optimizations": {
    "applied": ["refactor_io","cache_layer"],
    "benchmark": {"baseline_ms":120,"optimized_ms":85}
  }
}
```

Sortie générée:
```json
{
  "run_id": "uuid-v4",
  "stage": "FINAL_REPORT",
  "timestamp": "2025-09-22T18:00:00Z",
  "report": {
    "summary": "Succès",
    "variant_count": 2,
    "improvement_ratio": 0.2917,
    "checks": {
      "structure": "pass",
      "merged_code_present": true,
      "optimizations_present": true
    }
  },
  "delivery": {
    "final_code_excerpt": "...",
    "next_steps": ["sandbox_docker","coverage>85"]
  }
}
```

## 4. Schéma Minimal
- run_id: string UUID
- stage: string (INNOVATION / ASSEMBLAGE → transformé ensuite en FINAL_REPORT)
- merged_code: string non vide
- variants: array >=1
- optimizations.applied: array<string>
- optimizations.benchmark.baseline_ms >0
- optimizations.benchmark.optimized_ms >0

## 5. Critères de Réussite
- Pas d'exception non gérée.
- Rapport stable et prédictible.
- Échec de validation → objet error structuré.

## 6. Sécurité
- Pas d'exécution de code.
- Futur: sandbox Docker (limites CPU/RAM, timeouts).
- Vérification (lint/scan) à ajouter.

## 7. Observabilité (Futurs)
- Logs JSONL
- Métriques: temps traitement, ratio amélioration
- Tracing (OpenTelemetry)

## 8. Roadmap
| Priorité | Élément | Description |
|----------|---------|-------------|
| Haute | Sandbox docker | Isolation exécution |
| Haute | Tests coverage | >85% |
| Moyenne | Benchmarks auto | Comparer baseline/optimized |
| Moyenne | Orchestrateur | Temporal / Celery / BullMQ |
| Basse | Diff AST avancé | Fusion intelligente |
| Basse | Signature cryptographique | Authenticité rapport |

## 9. Limites
- Pas de persistance historique.
- Fusion amont supposée correcte.
- Pas d'analyse sémantique profonde.

## 10. TODO
- [ ] Sandbox
- [ ] Orchestrateur
- [ ] Signature rapport
- [ ] Diff colorisé
- [ ] Métriques & tracing

## 11. Licence
Suivre licence du projet (MIT).