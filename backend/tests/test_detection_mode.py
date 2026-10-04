from starlette.testclient import TestClient


def test_get_detection_mode(client: TestClient) -> None:
    response = client.get("/api/detection-mode")
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert data["mode"] in {"rule", "ml"}


def test_set_detection_mode_rule(client: TestClient) -> None:
    response = client.post("/api/set-mode", json={"mode": "rule"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "rule"

    get_response = client.get("/api/detection-mode")
    assert get_response.json()["mode"] == "rule"


def test_set_detection_mode_ml(client: TestClient) -> None:
    response = client.post("/api/set-mode", json={"mode": "ml"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "ml"

    get_response = client.get("/api/detection-mode")
    assert get_response.json()["mode"] == "ml"

    # Reset back to rule
    client.post("/api/set-mode", json={"mode": "rule"})


def test_set_detection_mode_invalid(client: TestClient) -> None:
    response = client.post("/api/set-mode", json={"mode": "invalid_mode"})
    assert response.status_code == 400
    assert "Invalid mode" in response.json()["detail"]
