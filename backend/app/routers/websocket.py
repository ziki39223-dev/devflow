"""WebSocket endpoint for real-time metrics streaming."""
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.ws_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send an initial welcome message
        await websocket.send_text(json.dumps({"type": "connected", "message": "WebSocket connected"}))

        # Listen for client messages (heartbeat / commands)
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat
            msg = json.loads(data) if data.startswith("{") else {"raw": data}
            if msg.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
