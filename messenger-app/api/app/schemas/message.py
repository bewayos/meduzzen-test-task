from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.schemas.user import UserOut


class AttachmentOut(BaseModel):
    id: UUID
    filename: str
    mime: str
    size_bytes: int
    storage_key: str
    created_at: datetime

    class Config:
        orm_mode = True


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    sender: UserOut
    content: str | None
    created_at: datetime
    edited_at: datetime | None
    deleted_at: datetime | None
    attachments: list[AttachmentOut] = []

    class Config:
        orm_mode = True


class MessageCreateOut(BaseModel):
    id: UUID


class MessageUpdate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Content must not be empty")
        return v
