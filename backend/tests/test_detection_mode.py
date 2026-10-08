from starlette.testclient import TestClient


def test_get_detection_mode_unauthenticated_rejected(client: TestClient) -> None:
    response = client.get("/api/detection-mode")
    assert response.status_code == 401


def test_set_detection_mode_unauthenticated_rejected(client: TestClient) -> None:
    response = client.post("/api/set-mode", json={"mode": "rule"})
    assert response.status_code == 401


def test_get_detection_mode_authenticated(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/detection-mode", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert data["mode"] in {"rule", "ml"}


def test_set_detection_mode_rule(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/set-mode", headers=auth_headers, json={"mode": "rule"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "rule"

    get_response = client.get("/api/detection-mode", headers=auth_headers)
    assert get_response.json()["mode"] == "rule"


def test_set_detection_mode_ml(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/set-mode", headers=auth_headers, json={"mode": "ml"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "ml"

    get_response = client.get("/api/detection-mode", headers=auth_headers)
    assert get_response.json()["mode"] == "ml"

    # Reset back to rule
    client.post("/api/set-mode", headers=auth_headers, json={"mode": "rule"})


def test_set_detection_mode_invalid(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/set-mode", headers=auth_headers, json={"mode": "invalid_mode"})
    assert response.status_code == 400
    assert "Invalid mode" in response.json()["detail"]
