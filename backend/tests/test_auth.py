from starlette.testclient import TestClient
from fastapi_app.core.rate_limit import auth_limiter


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


def test_update_profile(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch(
        "/api/auth/me",
        json={"username": "updatedname", "email": "updated@example.com"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "updatedname"
    assert data["email"] == "updated@example.com"


def test_update_profile_duplicate_conflict(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Register another user
    client.post(
        "/api/auth/register",
        json={
            "username": "otheruser",
            "email": "other@example.com",
            "password": "Password123!",
        },
    )
    # Attempt to take otheruser's username
    response = client.patch(
        "/api/auth/me",
        json={"username": "otheruser"},
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_change_password(client: TestClient, auth_headers: dict[str, str]) -> None:
    # Invalid current password
    bad_res = client.post(
        "/api/auth/change-password",
        json={"current_password": "WrongPassword!", "new_password": "NewPassword123!"},
        headers=auth_headers,
    )
    assert bad_res.status_code == 400

    # Successful change
    good_res = client.post(
        "/api/auth/change-password",
        json={"current_password": "Password123!", "new_password": "NewPassword123!"},
        headers=auth_headers,
    )
    assert good_res.status_code == 200
    assert good_res.json()["status"] == "success"

    # Login with new password
    login_res = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "NewPassword123!"},
    )
    assert login_res.status_code == 200


def test_forgot_and_reset_password_flow(client: TestClient, db_session) -> None:
    from sqlalchemy import select
    from fastapi_app.database.models import PasswordResetToken, User

    # Register user
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": "resetflowuser",
            "email": "resetflow@example.com",
            "password": "InitialPassword123!",
        },
    )
    assert reg_res.status_code == 201

    # Forgot password request
    forgot_res = client.post(
        "/api/auth/forgot-password",
        json={"email": "resetflow@example.com"},
    )
    assert forgot_res.status_code == 200
    assert "If an account exists" in forgot_res.json()["message"]

    # Non-existent email still returns privacy-preserving 200
    forgot_nonexistent = client.post(
        "/api/auth/forgot-password",
        json={"email": "nobody@example.com"},
    )
    assert forgot_nonexistent.status_code == 200

    # Retrieve created token directly for test verification
    user = db_session.scalar(select(User).where(User.email == "resetflow@example.com"))
    token_row = db_session.scalar(
        select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    )
    assert token_row is not None

    # Invalid token reset attempt
    invalid_reset = client.post(
        "/api/auth/reset-password",
        json={"token": "invalid_raw_token", "new_password": "BrandNewPassword123!"},
    )
    assert invalid_reset.status_code == 400


def test_delete_account(client: TestClient) -> None:
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": "deleteuser",
            "email": "delete@example.com",
            "password": "Password123!",
        },
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Wrong password fails
    wrong_res = client.request(
        "DELETE",
        "/api/auth/me",
        json={"password": "WrongPassword!"},
        headers=headers,
    )
    assert wrong_res.status_code == 400

    # Correct password deletes account
    del_res = client.request(
        "DELETE",
        "/api/auth/me",
        json={"password": "Password123!"},
        headers=headers,
    )
    assert del_res.status_code == 200

    # Login fails now
    login_res = client.post(
        "/api/auth/login",
        json={"username": "deleteuser", "password": "Password123!"},
    )
    assert login_res.status_code == 401


def test_rate_limiter_blocks_excessive_requests(client: TestClient) -> None:
    from fastapi_app.core.rate_limit import InMemoryRateLimiter
    from fastapi_app.main import app
    from fastapi_app.api.auth import router
    from fastapi import Depends

    # Create a tiny test limiter that allows max 2 requests
    test_limiter = InMemoryRateLimiter(requests_limit=2, window_seconds=60)
    app.dependency_overrides[auth_limiter] = test_limiter
    try:
        # First request succeeds/fails normally (not 429)
        r1 = client.post("/api/auth/login", json={"username": "testuser", "password": "wrong"})
        assert r1.status_code != 429

        # Second request succeeds/fails normally (not 429)
        r2 = client.post("/api/auth/login", json={"username": "testuser", "password": "wrong"})
        assert r2.status_code != 429

        # Third request is rate limited to 429
        r3 = client.post("/api/auth/login", json={"username": "testuser", "password": "wrong"})
        assert r3.status_code == 429
        assert "Too many requests" in r3.json()["detail"]
    finally:
        app.dependency_overrides.pop(auth_limiter, None)

