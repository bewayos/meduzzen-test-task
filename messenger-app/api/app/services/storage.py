import os
from collections.abc import Iterable
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = Path(os.getenv("UPLOAD_ROOT", "/data/uploads"))

WHITELIST = {"image/", "application/pdf", "text/plain", "application/zip"}
MAX_BYTES = 10 * 1024 * 1024  # 10MB


def validate_files(files: Iterable[UploadFile]) -> None:
    for f in files:
        mt = (f.content_type or "").lower()
        if not any(mt.startswith(p) for p in WHITELIST):
            raise HTTPException(status_code=400, detail=f"Unsupported MIME: {mt}")


async def save_uploads(message_id: UUID, files: list[UploadFile]):
    saved: list[tuple[str, UploadFile, int]] = []
    base = UPLOAD_ROOT / str(message_id)
    base.mkdir(parents=True, exist_ok=True)
    for f in files:
        dest = base / (f.filename or "file.bin")
        content = await f.read()
        size = len(content)
        if size > MAX_BYTES:
            raise HTTPException(status_code=400, detail=f"File too large: {f.filename}")
        with open(dest, "wb") as out:
            out.write(content)
        saved.append((f"/uploads/{message_id}/{dest.name}", f, size))
    return saved
