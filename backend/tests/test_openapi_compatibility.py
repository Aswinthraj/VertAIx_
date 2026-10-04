from starlette.testclient import TestClient

EXPECTED_ROUTES = [
    ("/api/health", "get"),
    ("/api/auth/register", "post"),
    ("/api/auth/login", "post"),
    ("/api/auth/refresh", "post"),
    ("/api/auth/logout", "post"),
    ("/api/auth/me", "get"),
    ("/api/posture", "get"),
    ("/api/detection-mode", "get"),
    ("/api/set-mode", "post"),
    ("/api/analytics", "get"),
    ("/api/analytics/reset", "post"),
    ("/api/history", "get"),
    ("/api/history/clear", "post"),
    ("/api/history/export", "get"),
    ("/api/history/save-csv", "post"),
    ("/api/session/start", "post"),
    ("/api/session/end", "post"),
    ("/api/llm-advice", "get"),
]


def test_openapi_schema_completeness(client: TestClient) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    paths = schema.get("paths", {})

    for path, method in EXPECTED_ROUTES:
        assert path in paths, f"Route {path} missing from OpenAPI schema"
        assert method in paths[path], f"Method {method.upper()} missing for route {path}"


def test_openapi_tags_present(client: TestClient) -> None:
    response = client.get("/openapi.json")
    schema = response.json()
    expected_tags = {"health", "auth", "analytics", "history", "posture", "recommendations", "sessions"}
    found_tags = set()
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict) and "tags" in operation:
                found_tags.update(operation["tags"])
    assert expected_tags.issubset(found_tags), f"Missing tags: {expected_tags - found_tags}"
