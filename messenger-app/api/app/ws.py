from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.deps import get_current_user

router = APIRouter(prefix="/ws", tags=["ws"])


class WSManager:
    def __init__(self) -> None:
        self.rooms: dict[UUID, set[WebSocket]] = {}

    async def connect(self, conv_id: UUID, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms.setdefault(conv_id, set()).add(ws)

    def disconnect(self, conv_id: UUID, ws: WebSocket) -> None:
        if conv_id in self.rooms:
            self.rooms[conv_id].discard(ws)
            if not self.rooms[conv_id]:
                self.rooms.pop(conv_id, None)

    async def broadcast_json(self, conv_id: UUID, payload: dict) -> None:
        for ws in list(self.rooms.get(conv_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(conv_id, ws)


manager = WSManager()


@router.websocket("")
async def ws_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    conv_id_str = websocket.query_params.get("conversation_id")
    if not token or not conv_id_str:
        await websocket.close(code=4401)
        return
    conv_id = UUID(conv_id_str)

    websocket.headers.__dict__["_list"].append((b"authorization", f"Bearer {token}".encode()))
    try:
        _user = await get_current_user.__wrapped__(authorization=f"Bearer {token}")  # type: ignore
    except Exception:
        await websocket.close(code=4401)
        return

    await manager.connect(conv_id, websocket)
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(conv_id, websocket)
