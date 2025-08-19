import asyncio
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["ws"])

PING_EVERY = 25


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


async def _keepalive(ws: WebSocket):
    try:
        while True:
            await asyncio.sleep(PING_EVERY)
            await ws.send_json({"type": "ping"})
    except Exception:
        pass


@router.websocket("")
async def ws_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    conv_id_str = websocket.query_params.get("conversation_id")
    if not token or not conv_id_str:
        await websocket.close(code=4401)
        return
    conv_id = UUID(conv_id_str)

    await manager.connect(conv_id, websocket)
    keep_task = asyncio.create_task(_keepalive(websocket))
    try:
        while True:
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        keep_task.cancel()
        manager.disconnect(conv_id, websocket)
