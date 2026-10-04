from starlette.testclient import TestClient


def test_health_check_returns_200(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Backend running"
    assert data["service"] == "VertAIx FastAPI migration"
    assert "version" in data
