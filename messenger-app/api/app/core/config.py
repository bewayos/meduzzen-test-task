import json
import os

from pydantic import BaseModel, validator


class Settings(BaseModel):
    db_url: str = os.getenv("DATABASE_URL", "postgresql+psycopg://app:app@db:5432/app")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_alg: str = os.getenv("JWT_ALG", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    cors_origins: str | list[str] = os.getenv("API_CORS_ORIGINS", "http://localhost")

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """
        Accept both comma-separated string and JSON array for CORS origins.
        """
        if isinstance(v, list):
            return v
        v = v.strip()
        if not v:
            return ["http://localhost"]
        if v.startswith("["):
            try:
                return json.loads(v)
            except Exception as err:
                raise ValueError("Invalid JSON for API_CORS_ORIGINS") from err
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    class Config:
        case_sensitive = True


settings = Settings()
