"""create conversations/messages/attachments

Revision ID: be1d7d5318f9
Revises: 5f34d0a0c24f
Create Date: 2025-08-19 11:25:28.754427
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op  # type: ignore

# revision identifiers, used by Alembic.
revision: str = "be1d7d5318f9"
down_revision: str | Sequence[str] | None = "5f34d0a0c24f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "conversations",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_a_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_b_id", UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("user_a_id <> user_b_id", name="ck_conversations_distinct_users"),
        sa.ForeignKeyConstraint(["user_a_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_b_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversations_user_a_id", "conversations", ["user_a_id"])
    op.create_index("ix_conversations_user_b_id", "conversations", ["user_b_id"])

    op.execute(
        """
        CREATE UNIQUE INDEX uq_conversations_pair
        ON conversations (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));
    """
    )

    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])

    op.create_table(
        "attachments",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("message_id", UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("mime", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attachments_message_id", "attachments", ["message_id"])


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index("ix_attachments_message_id", table_name="attachments")
    op.drop_table("attachments")

    op.drop_index("ix_messages_sender_id", table_name="messages")
    op.drop_index("ix_messages_created_at", table_name="messages")
    op.drop_index("ix_messages_conversation_id", table_name="messages")
    op.drop_table("messages")

    op.execute("DROP INDEX IF EXISTS uq_conversations_pair;")
    op.drop_index("ix_conversations_user_b_id", table_name="conversations")
    op.drop_index("ix_conversations_user_a_id", table_name="conversations")
    op.drop_table("conversations")
