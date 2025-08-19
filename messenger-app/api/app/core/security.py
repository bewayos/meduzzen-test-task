from datetime import UTC, datetime, timedelta

import jwt
from passlib.context import CryptContext

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # Hash user password using bcrypt
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    # Verify provided password against stored hash
    return pwd_context.verify(password, hashed)


def create_access_token(sub: str) -> str:
    # Create JWT access token for given subject (user id)
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)
