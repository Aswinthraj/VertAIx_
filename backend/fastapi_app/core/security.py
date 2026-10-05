from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import uuid4

import bcrypt
from jose import JWTError, jwt

from fastapi_app.config import get_settings


ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


import secrets


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> tuple[str, str, datetime]:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta
    token_id = str(uuid4())
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": token_id,
        "iat": now,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm), token_id, expires_at


def create_access_token(subject: str) -> str:
    settings = get_settings()
    token, _, _ = _create_token(
        subject,
        ACCESS_TOKEN_TYPE,
        timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )
    return token


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    settings = get_settings()
    return _create_token(
        subject,
        REFRESH_TOKEN_TYPE,
        timedelta(days=settings.jwt_refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: str) -> dict:
    settings = get_settings()
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != expected_type or not payload.get("sub"):
        raise JWTError("Invalid token type or subject")
    return payload
