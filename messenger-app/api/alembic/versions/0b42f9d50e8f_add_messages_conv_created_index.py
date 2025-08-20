"""add messages conv created index

Revision ID: 0b42f9d50e8f
Revises: a58300d40bad
Create Date: 2025-08-19 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op  # type: ignore

# revision identifiers, used by Alembic.
revision: str = "0b42f9d50e8f"
down_revision: str | Sequence[str] | None = "a58300d40bad"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        "ix_messages_conv_created",
        "messages",
        ["conversation_id", "created_at", "id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_messages_conv_created", table_name="messages")
