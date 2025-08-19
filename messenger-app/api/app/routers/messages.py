from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.deps import get_current_user
from app.models import Attachment, Conversation, Message, User
from app.schemas.message import MessageCreateOut, MessageOut
from app.services.storage import save_uploads, validate_files

router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["messages"])


@router.get("", response_model=list[MessageOut])
def get_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    cursor: str | None = None,
    limit: int = 50,
):
    conv = db.get(Conversation, conversation_id)
    if not conv or current_user.id not in (conv.user_a_id, conv.user_b_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    q = select(Message).where(Message.conversation_id == conversation_id)
    if cursor:
        try:
            dt = datetime.fromisoformat(cursor)
            q = q.where(Message.created_at < dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Bad cursor format") from None

    q = q.order_by(Message.created_at.desc(), Message.id.desc()).limit(min(limit, 100))
    return db.scalars(q).all()


@router.post("", response_model=MessageCreateOut)
async def create_message(
    background: BackgroundTasks,
    conversation_id: UUID,
    content: Annotated[str | None, Form()] = None,
    files: Annotated[list[UploadFile] | None, File()] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.get(Conversation, conversation_id)
    if not conv or current_user.id not in (conv.user_a_id, conv.user_b_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if not content and not files:
        raise HTTPException(status_code=400, detail="Empty message")

    msg = Message(conversation_id=conversation_id, sender_id=current_user.id, content=content)
    db.add(msg)
    db.flush()

    saved_keys: list[tuple[str, UploadFile, int]] = []
    if files:
        validate_files(files)
        saved_keys = await save_uploads(msg.id, files)

        for storage_key, f, size in saved_keys:
            att = Attachment(
                message_id=msg.id,
                filename=f.filename or "file",
                mime=f.content_type or "application/octet-stream",
                size_bytes=size,
                storage_key=storage_key,
            )
            db.add(att)

    db.commit()
    return MessageCreateOut(id=msg.id)
