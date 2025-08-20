from datetime import UTC, datetime
from typing import Annotated, cast
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
from app.schemas.message import MessageCreateOut, MessageOut, MessageUpdate
from app.services.storage import save_uploads, validate_files
from app.ws import manager

router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["messages"])
msg_router = APIRouter(prefix="/messages", tags=["messages"])


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
    background.add_task(
        manager.broadcast_json,
        conversation_id,
        {"type": "message:new", "message_id": str(msg.id)},
    )
    return MessageCreateOut(id=msg.id)


@msg_router.patch("/{message_id}", response_model=MessageOut)
def update_message(
    background: BackgroundTasks,
    message_id: UUID,
    payload: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.get(Message, message_id)
    if not msg or current_user.id not in (msg.conversation.user_a_id, msg.conversation.user_b_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if msg.deleted_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Message deleted")

    msg.content = payload.content
    msg.edited_at = datetime.now(UTC)  # type: ignore[assignment]
    db.add(msg)
    db.commit()
    db.refresh(msg)
    assert msg.edited_at is not None
    edited_at = cast(datetime, msg.edited_at)
    background.add_task(
        manager.broadcast_json,
        msg.conversation_id,
        {
            "type": "message:update",
            "id": str(msg.id),
            "content": msg.content,
            "edited_at": edited_at.isoformat(),
        },
    )
    return msg


@msg_router.delete("/{message_id}", response_model=MessageOut)
def delete_message(
    background: BackgroundTasks,
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.get(Message, message_id)
    if not msg or current_user.id not in (msg.conversation.user_a_id, msg.conversation.user_b_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if not msg.deleted_at:
        msg.deleted_at = datetime.now(UTC)  # type: ignore[assignment]
        db.add(msg)
        db.commit()
        db.refresh(msg)
    assert msg.deleted_at is not None
    deleted_at = cast(datetime, msg.deleted_at)
    background.add_task(
        manager.broadcast_json,
        msg.conversation_id,
        {
            "type": "message:delete",
            "id": str(msg.id),
            "deleted_at": deleted_at.isoformat(),
        },
    )
    return msg
