from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import ws
from app.core.config import settings
from app.routers import auth, conversations, messages, users
from app.services.storage import UPLOAD_ROOT

app = FastAPI(title="Messenger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(messages.msg_router)
app.include_router(ws.router)
app.include_router(users.router)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")


@app.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok"}
