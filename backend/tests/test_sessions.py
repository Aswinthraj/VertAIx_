from starlette.testclient import TestClient


def test_session_start(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/session/start", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Session started" in data["message"]


def test_session_end(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Start first
    client.post("/api/session/start", headers=auth_headers)

    # End session
    response = client.post("/api/session/end", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Session ended" in data["message"]
    assert "session_sedentary_time" in data
