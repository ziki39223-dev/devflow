"""Docker container monitoring service."""
import asyncio
import logging

import psutil

logger = logging.getLogger(__name__)

try:
    import docker as docker_lib

    _docker_client = docker_lib.from_env()
    _docker_available = True
except Exception as e:  # noqa: BLE001
    logger.warning("Docker not available: %s — running in mock mode", e)
    _docker_client = None
    _docker_available = False


# Mock container data for environments without Docker
_MOCK_CONTAINERS = [
    {"id": "a1b2c3d4e5f6", "name": "devflow-api", "image": "devflow-api:latest",
     "status": "Up 2 hours", "state": "running", "ports": "0.0.0.0:8000->8000/tcp",
     "cpu_percent": 2.3, "memory_usage": "128.5MiB / 1GiB", "created": "2026-07-16T10:00:00"},
    {"id": "b2c3d4e5f6a1", "name": "devflow-web", "image": "devflow-web:latest",
     "status": "Up 2 hours", "state": "running", "ports": "0.0.0.0:3000->3000/tcp",
     "cpu_percent": 1.1, "memory_usage": "256.2MiB / 1GiB", "created": "2026-07-16T10:00:00"},
    {"id": "c3d4e5f6a1b2", "name": "postgres", "image": "postgres:16-alpine",
     "status": "Up 5 hours", "state": "running", "ports": "5432/tcp",
     "cpu_percent": 0.5, "memory_usage": "89.1MiB / 512MiB", "created": "2026-07-16T07:00:00"},
    {"id": "d4e5f6a1b2c3", "name": "redis", "image": "redis:7-alpine",
     "status": "Up 5 hours", "state": "running", "ports": "6379/tcp",
     "cpu_percent": 0.2, "memory_usage": "12.8MiB / 256MiB", "created": "2026-07-16T07:00:00"},
    {"id": "e5f6a1b2c3d4", "name": "nginx-proxy", "image": "nginx:1.25",
     "status": "Exited (0) 1 hour ago", "state": "exited", "ports": "",
     "cpu_percent": 0.0, "memory_usage": "0B / 0B", "created": "2026-07-16T08:00:00"},
]


async def list_containers() -> list[dict]:
    """List all Docker containers with resource usage."""
    if not _docker_available:
        await asyncio.sleep(0.05)
        return _MOCK_CONTAINERS

    containers = []
    try:
        for c in _docker_client.containers.list(all=True):
            try:
                stats = c.stats(stream=False)
                cpu_percent = _calc_cpu_percent(stats)
                mem = stats.get("memory_stats", {})
                mem_usage = mem.get("usage", 0)
                mem_limit = mem.get("limit", 0)
                mem_str = f"{mem_usage / 1048576:.1f}MiB / {mem_limit / 1048576:.1f}MiB"
            except Exception:  # noqa: BLE001
                cpu_percent = 0.0
                mem_str = "N/A"

            ports = ", ".join(
                f"{k}: {v[0]['HostPort']}" if v and isinstance(v, list) and v else k
                for k, v in (c.attrs.get("NetworkSettings", {}).get("Ports") or {}).items()
                if v
            ) or "—"

            containers.append({
                "id": c.short_id,
                "name": c.name,
                "image": c.image.tags[0] if c.image.tags else c.short_id,
                "status": c.status,
                "state": c.attrs.get("State", {}).get("Status", "unknown"),
                "ports": ports,
                "cpu_percent": round(cpu_percent, 2),
                "memory_usage": mem_str,
                "created": c.attrs.get("Created", ""),
            })
    except Exception as e:  # noqa: BLE001
        logger.error("Failed to list containers: %s", e)
        return _MOCK_CONTAINERS

    return containers


async def control_container(container_id: str, action: str) -> dict:
    """Start, stop, or restart a container."""
    if not _docker_available:
        return {"id": container_id, "action": action, "result": "mocked (docker not available)"}

    try:
        c = _docker_client.containers.get(container_id)
        if action == "start":
            c.start()
        elif action == "stop":
            c.stop()
        elif action == "restart":
            c.restart()
        else:
            return {"error": f"Unknown action: {action}"}
        return {"id": container_id, "action": action, "result": "success"}
    except Exception as e:  # noqa: BLE001
        return {"id": container_id, "action": action, "error": str(e)}


def _calc_cpu_percent(stats: dict) -> float:
    """Calculate CPU usage percentage from Docker stats."""
    try:
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        num_cpus = stats["cpu_stats"].get("online_cpus", 1)
        if system_delta > 0 and cpu_delta > 0:
            return (cpu_delta / system_delta) * num_cpus * 100
    except (KeyError, TypeError, ZeroDivisionError):
        pass
    return 0.0


async def get_system_metrics() -> dict:
    """Get host system metrics via psutil."""
    cpu_percent = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()
    return {
        "cpu_percent": cpu_percent,
        "memory_total": mem.total,
        "memory_used": mem.used,
        "memory_percent": mem.percent,
        "disk_total": disk.total,
        "disk_used": disk.used,
        "disk_percent": disk.percent,
        "network_sent": net.bytes_sent,
        "network_recv": net.bytes_recv,
    }
