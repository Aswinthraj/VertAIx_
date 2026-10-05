from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from fastapi_app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=True
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PostureHistory(Base):
    __tablename__ = "posture_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    pcs: Mapped[float] = mapped_column(Float, nullable=False)
    alert: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    sedentary_time: Mapped[int | None] = mapped_column(
        Integer, default=0, nullable=True
    )
    timestamp: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.utcnow, index=True, nullable=True
    )


class PostureAnalytics(Base):
    __tablename__ = "posture_analytics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    good_posture_count: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    warning_count: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    bad_posture_count: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    total_checks: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    total_pcs: Mapped[float | None] = mapped_column(Float, default=0.0, nullable=True)
    total_sedentary_time: Mapped[int | None] = mapped_column(Integer, default=0, nullable=True)
    session_start: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=True
    )
    last_updated: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )
