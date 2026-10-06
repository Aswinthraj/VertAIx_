from starlette.testclient import TestClient

from posture_runtime import update_posture


def test_get_posture_unauthenticated_rejected(client: TestClient) -> None:
    response = client.get("/api/posture")
    assert response.status_code == 401


def test_get_posture_authenticated_default_state(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/posture", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "pcs" in data
    assert "alert" in data
    assert "sedentary_time" in data
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_get_posture_returns_runtime_state(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Authenticated user id in test fixtures is "1"
    update_posture(
        user_id="1",
        status="Good Posture",
        pcs=88.5,
        alert=False,
        sedentary_time=120,
        recommendations=["Keep back straight"],
    )
    response = client.get("/api/posture", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Good Posture"
    assert data["pcs"] == 88.5
    assert data["alert"] is False
    assert data["sedentary_time"] == 120
    assert data["recommendations"] == ["Keep back straight"]
    assert data["last_updated"] is not None
