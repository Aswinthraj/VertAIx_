import pytest
from starlette.testclient import TestClient

PROTECTED_ENDPOINTS = [
    ("GET", "/api/auth/me"),
    ("PATCH", "/api/auth/me"),
    ("POST", "/api/auth/change-password"),
    ("DELETE", "/api/auth/me"),
    ("GET", "/api/analytics"),
    ("POST", "/api/analytics/reset"),
    ("GET", "/api/history"),
    ("POST", "/api/history/clear"),
    ("GET", "/api/history/export"),
    ("POST", "/api/history/save-csv"),
    ("POST", "/api/session/start"),
    ("POST", "/api/session/end"),
    ("GET", "/api/llm-advice"),
]


@pytest.mark.parametrize("method,endpoint", PROTECTED_ENDPOINTS)
def test_unauthenticated_requests_return_401(
    client: TestClient, method: str, endpoint: str
) -> None:
    response = client.request(method, endpoint)
    assert response.status_code == 401
    assert response.json()["detail"] in {"Not authenticated", "Invalid access token"}


@pytest.mark.parametrize("method,endpoint", PROTECTED_ENDPOINTS)
def test_invalid_bearer_token_returns_401(
    client: TestClient, method: str, endpoint: str
) -> None:
    headers = {"Authorization": "Bearer invalid.jwt.token"}
    response = client.request(method, endpoint, headers=headers)
    assert response.status_code == 401
    assert response.json()["detail"] in {"Not authenticated", "Invalid access token"}


@pytest.mark.parametrize("method,endpoint", PROTECTED_ENDPOINTS)
def test_x_user_id_alone_does_not_authorize(
    client: TestClient, method: str, endpoint: str
) -> None:
    # Ensuring FastAPI does not trust X-USER-ID header without a valid JWT token
    headers = {"X-USER-ID": "legacy-firebase-uid"}
    response = client.request(method, endpoint, headers=headers)
    assert response.status_code == 401
