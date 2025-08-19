from fastapi import APIRouter, Depends

from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.user.UserOut)
def get_me(
    current_user: models.user.User = Depends(get_current_user),
):
    return current_user
