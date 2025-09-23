from agents.agent_final import FinalAgent, simulate_final_agent_payload

def test_final_agent_ok():
    agent = FinalAgent()
    payload = simulate_final_agent_payload()
    result = agent.run(payload)
    assert "error" not in result
    assert result["report"]["variant_count"] == 2
    assert result["report"]["checks"]["structure"] == "pass"
    assert result["stage"] == "FINAL_REPORT"

def test_final_agent_validation_missing():
    agent = FinalAgent()
    bad = {"run_id": "x"}  # volontairement incomplet
    result = agent.run(bad)
    assert "error" in result
    assert result["error"]["code"] == "VALIDATION_FAILED"
    # Au moins un message de champ manquant
    assert any("Champ manquant" in d for d in result["error"]["details"])