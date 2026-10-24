"""WebSocket connection manager for real-time updates."""
import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and broadcasts updates."""

    def __init__(self) -> None:
        self._active: list[WebSocket] = []
        self._task: asyncio.Task | None = None

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._active.append(ws)
        logger.info("WebSocket connected, total: %d", len(self._active))

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self._active:
            self._active.remove(ws)
        logger.info("WebSocket disconnected, total: %d", len(self._active))

    async def broadcast(self, data: dict) -> None:
        """Send data to all connected clients."""
        text = json.dumps(data, default=str)
        dead: list[WebSocket] = []
        for ws in self._active:
            try:
                await ws.send_text(text)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def start_periodic_updates(self) -> None:
        """Background task: push system metrics + container status every 5s."""
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._update_loop())

    async def stop_periodic_updates(self) -> None:
        if self._task:
            self._task.cancel()
            self._task = None

    async def _update_loop(self) -> None:
        from app.services.docker_service import get_system_metrics, list_containers

        while True:
            try:
                if not self._active:
                    await asyncio.sleep(2)
                    continue

                metrics = await get_system_metrics()
                containers = await list_containers()

                payload = {
                    "type": "metrics",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "system": metrics,
                    "containers": containers,
                    "container_count": len(containers),
                    "running_count": sum(1 for c in containers if c.get("state") == "running"),
                }
                await self.broadcast(payload)
            except asyncio.CancelledError:
                break
            except Exception as e:  # noqa: BLE001
                logger.error("Update loop error: %s", e)

            await asyncio.sleep(5)


ws_manager = ConnectionManager()
