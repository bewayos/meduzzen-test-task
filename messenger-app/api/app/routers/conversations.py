from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.db import get_db
from app.deps import get_current_user
from app.models import Conversation, User
from app.schemas.conversation import ConversationCreateIn, ConversationOut

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationOut)
def create_or_get_conversation(
    payload: ConversationCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Conversation)
        .options(joinedload(Conversation.user_a), joinedload(Conversation.user_b))
        .where(
            or_(
                and_(
                    Conversation.user_a_id == current_user.id,
                    Conversation.user_b_id == payload.peer_id,
                ),
                and_(
                    Conversation.user_a_id == payload.peer_id,
                    Conversation.user_b_id == current_user.id,
                ),
            )
        )
    )
    conv = db.scalars(stmt).first()
    if conv:
        return conv
    if payload.peer_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot chat with self")
    peer = db.get(User, payload.peer_id)
    if not peer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peer not found")

    conv = Conversation(user_a_id=current_user.id, user_b_id=payload.peer_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    conv = db.scalars(
        select(Conversation)
        .options(joinedload(Conversation.user_a), joinedload(Conversation.user_b))
        .where(Conversation.id == conv.id)
    ).first()
    assert conv is not None
    return conv


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Conversation)
        .options(joinedload(Conversation.user_a), joinedload(Conversation.user_b))
        .where(
            (Conversation.user_a_id == current_user.id)
            | (Conversation.user_b_id == current_user.id)
        )
        .order_by(Conversation.created_at.desc())
        .limit(50)
    )
    return db.scalars(stmt).all()
