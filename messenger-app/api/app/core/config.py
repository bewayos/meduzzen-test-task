from pydantic import BaseModel
import os

class Settings(BaseModel):
    db_url: str = os.getenv("DATABASE_URL", "postgresql+psycopg://app:app@db:5432/app")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_alg: str = os.getenv("JWT_ALG", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    cors_origins: str = os.getenv("API_CORS_ORIGINS", "http://localhost:5173")

settings = Settings()
