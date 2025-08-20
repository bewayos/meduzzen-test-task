from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.user import UserOut


class ConversationCreateIn(BaseModel):
    peer_id: UUID


class ConversationOut(BaseModel):
    id: UUID
    user_a_id: UUID
    user_b_id: UUID
    user_a: UserOut
    user_b: UserOut
    created_at: datetime

    class Config:
        orm_mode = True
