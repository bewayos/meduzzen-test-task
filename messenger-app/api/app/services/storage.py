from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = Path("uploads")
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


async def save_uploads(
    message_id: UUID, files: list[UploadFile]
) -> list[tuple[str, UploadFile, int]]:
    """
    Save uploaded files to disk under /uploads/{message_id}/
    Returns list of (storage_key, original UploadFile, size_bytes).
    """
    saved: list[tuple[str, UploadFile, int]] = []
    base = UPLOAD_ROOT / str(message_id)
    base.mkdir(parents=True, exist_ok=True)

    for f in files:
        content = await f.read()
        size = len(content)
        if size > MAX_BYTES:
            raise HTTPException(status_code=400, detail=f"File too large: {f.filename}")

        fname = f.filename or "file.bin"
        dest = base / fname

        with open(dest, "wb") as out:
            out.write(content)

        storage_key = f"/uploads/{message_id}/{fname}"
        saved.append((storage_key, f, size))

    return saved


def validate_files(files: list[UploadFile]) -> None:
    """
    Placeholder for MIME/extension checks. For MVP just size is validated in save_uploads.
    """
    return None
