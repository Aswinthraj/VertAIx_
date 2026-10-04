from unittest.mock import patch
from starlette.testclient import TestClient


def test_recommendations_endpoint_fallback(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # When LLM raises an error, endpoint falls back safely to rule-based advice
    with patch("services.llm_recommendation_service.get_llm_recommendation", side_effect=RuntimeError("Groq unavailable")):
        response = client.get("/api/llm-advice", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["source"] == "rule-based"
        assert "advice" in data
        assert isinstance(data["advice"], str)
        assert "summary" in data


def test_recommendations_endpoint_llm_success(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # When LLM succeeds, endpoint returns source: "llm"
    mock_advice = "Roll your shoulders back and tuck your chin slightly."
    with patch("services.llm_recommendation_service.get_llm_recommendation", return_value=mock_advice):
        response = client.get("/api/llm-advice", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["source"] == "llm"
        assert data["advice"] == mock_advice
        assert "summary" in data
