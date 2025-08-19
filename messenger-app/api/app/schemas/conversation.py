from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationCreateIn(BaseModel):
    peer_id: UUID


class ConversationOut(BaseModel):
    id: UUID
    user_a_id: UUID
    user_b_id: UUID
    created_at: datetime
