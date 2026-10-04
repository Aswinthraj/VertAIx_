from starlette.testclient import TestClient


def test_register_success(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "newuser"
    assert data["user"]["email"] == "newuser@example.com"


def test_register_duplicate_username(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={
            "username": "dupuser",
            "email": "user1@example.com",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/auth/register",
        json={
            "username": "dupuser",
            "email": "user2@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "User already exists"


def test_register_duplicate_email(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={
            "username": "userone",
            "email": "shared@example.com",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/auth/register",
        json={
            "username": "usertwo",
            "email": "shared@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "User already exists"


def test_login_success(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={
            "username": "logintest",
            "email": "logintest@example.com",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "logintest", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["username"] == "logintest"


def test_login_with_email_success(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={
            "username": "emaillogintest",
            "email": "emaillogin@example.com",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "emaillogin@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "emaillogin@example.com"


def test_login_invalid_password(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={
            "username": "wrongpass",
            "email": "wrongpass@example.com",
            "password": "Password123!",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "wrongpass", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_user_not_found(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"username": "nonexistent", "password": "Password123!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_refresh_token_lifecycle(client: TestClient) -> None:
    reg_response = client.post(
        "/api/auth/register",
        json={
            "username": "refreshtest",
            "email": "refreshtest@example.com",
            "password": "Password123!",
        },
    )
    refresh_token = reg_response.json()["refresh_token"]

    # Refresh successfully
    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 200
    new_data = refresh_response.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["refresh_token"] != refresh_token

    # Reusing the old refresh token fails (revoked)
    replay_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert replay_response.status_code == 401


def test_logout(client: TestClient) -> None:
    reg_response = client.post(
        "/api/auth/register",
        json={
            "username": "logouttest",
            "email": "logouttest@example.com",
            "password": "Password123!",
        },
    )
    refresh_token = reg_response.json()["refresh_token"]

    # Logout
    logout_response = client.post(
        "/api/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert logout_response.status_code == 204

    # Refresh after logout fails
    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 401


def test_get_me(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@example.com"
