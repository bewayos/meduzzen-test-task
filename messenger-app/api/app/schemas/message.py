from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str | None
    created_at: datetime
    edited_at: datetime | None
    deleted_at: datetime | None


class MessageCreateOut(BaseModel):
    id: UUID
