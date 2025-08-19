from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, conversations, messages

app = FastAPI()
app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(messages.router)

app = FastAPI(title="Messenger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok"}
