from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
import jwt
from app.core.db import get_db
from app.core.config import settings
from app.models.user import User

def get_current_user(db: Session = Depends(get_db), authorization: str | None = None) -> User:
    # Extract and verify bearer token and fetch user
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
