"""baseline existing schema

Revision ID: be754650c228
Revises: 
Create Date: 2026-10-04 22:53:30.105623
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = 'be754650c228'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="users_email_key"),
        sa.UniqueConstraint("username", name="users_username_key"),
    )
    op.create_table(
        "posture_analytics",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("good_posture_count", sa.Integer(), nullable=True),
        sa.Column("warning_count", sa.Integer(), nullable=True),
        sa.Column("bad_posture_count", sa.Integer(), nullable=True),
        sa.Column("total_checks", sa.Integer(), nullable=True),
        sa.Column("total_pcs", sa.Float(), nullable=True),
        sa.Column("total_sedentary_time", sa.Integer(), nullable=True),
        sa.Column("session_start", sa.DateTime(), nullable=True),
        sa.Column("last_updated", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_posture_analytics_user_id",
        "posture_analytics",
        ["user_id"],
        unique=False,
    )
    op.create_table(
        "posture_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("pcs", sa.Float(), nullable=False),
        sa.Column("alert", sa.Boolean(), nullable=True),
        sa.Column("sedentary_time", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_posture_history_timestamp",
        "posture_history",
        ["timestamp"],
        unique=False,
    )
    op.create_index(
        "ix_posture_history_user_id",
        "posture_history",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_posture_history_user_id", table_name="posture_history")
    op.drop_index("ix_posture_history_timestamp", table_name="posture_history")
    op.drop_table("posture_history")
    op.drop_index("ix_posture_analytics_user_id", table_name="posture_analytics")
    op.drop_table("posture_analytics")
    op.drop_table("users")
