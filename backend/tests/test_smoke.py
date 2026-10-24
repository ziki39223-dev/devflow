"""Smoke tests: verify core API endpoints are reachable and correctly structured.

运行方式: cd backend && python -m pytest tests/ -v
"""
import os
import tempfile
from pathlib import Path

# 必须在导入 app 之前设置：让测试使用独立的临时数据库，不污染本地 devflow.db
_TMP_DB = Path(tempfile.gettempdir()) / "devflow_test.db"
if _TMP_DB.exists():
    _TMP_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMP_DB.as_posix()}"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def test_root_metadata():
    with TestClient(app) as client:
        res = client.get("/")
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == "DevFlow API"
        assert "docs" in body


def test_health():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"


def test_dashboard_stats_shape():
    """验证 dashboard 聚合查询返回完整的统计字段。"""
    with TestClient(app) as client:
        res = client.get("/api/dashboard/stats")
        assert res.status_code == 200
        body = res.json()
        expected_fields = {
            "total_services", "healthy_services", "degraded_services", "unhealthy_services",
            "total_deployments", "successful_deployments", "failed_deployments",
            "active_alerts", "critical_alerts", "avg_response_time", "avg_uptime",
        }
        assert expected_fields.issubset(body.keys())
        assert isinstance(body["total_services"], int)
        assert body["avg_uptime"] >= 0


def test_list_services_seeded():
    """lifespan 的 init_db 会写入种子数据，服务列表不应为空。"""
    with TestClient(app) as client:
        res = client.get("/api/services")
        assert res.status_code == 200
        services = res.json()
        assert isinstance(services, list)
        assert len(services) > 0
        first = services[0]
        assert {"id", "name", "status", "cpu_usage"} <= set(first.keys())


def test_unknown_route_returns_404():
    with TestClient(app) as client:
        res = client.get("/api/no-such-endpoint")
        assert res.status_code == 404
