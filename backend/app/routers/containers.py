"""Docker container management router."""
from fastapi import APIRouter

from app.schemas.schemas import ContainerInfo
from app.services.docker_service import control_container, get_system_metrics, list_containers

router = APIRouter(prefix="/containers", tags=["containers"])


@router.get("", response_model=list[ContainerInfo])
async def get_containers():
    return await list_containers()


@router.post("/{container_id}/{action}")
async def container_action(container_id: str, action: str):
    """Start, stop, or restart a container."""
    if action not in ("start", "stop", "restart"):
        return {"error": "Action must be start, stop, or restart"}
    return await control_container(container_id, action)


@router.get("/system-metrics")
async def system_metrics():
    """Get host system resource metrics."""
    return await get_system_metrics()
