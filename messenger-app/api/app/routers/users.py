from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.user.UserOut)
def get_me(
    current_user: models.user.User = Depends(get_current_user),
):
    return current_user


@router.get("/search", response_model=list[UserOut])
def search_users(
    q: str = Query(..., min_length=1, max_length=50, description="Username search query"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[UserOut]:
    """
    Search users by username (case-insensitive, partial match).
    """
    stmt = select(User).where(User.username.ilike(f"%{q}%")).limit(20)
    return db.execute(stmt).scalars().all()  # type: ignore[return-value]
