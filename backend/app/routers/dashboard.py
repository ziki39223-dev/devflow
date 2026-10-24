"""Dashboard aggregation router — provides overview statistics."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Alert, Deployment, LogEntry, Service
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    # 三条聚合查询分别覆盖 services / deployments / alerts，
    # 替代此前 10 次串行 db.scalar() 调用（N+1 查询问题）
    svc = (
        await db.execute(
            select(
                func.count(Service.id),
                func.count(Service.id).filter(Service.status == "healthy"),
                func.count(Service.id).filter(Service.status == "degraded"),
                func.count(Service.id).filter(Service.status == "unhealthy"),
                func.avg(Service.response_time_ms),
                func.avg(Service.uptime_percent),
            )
        )
    ).one()

    dep = (
        await db.execute(
            select(
                func.count(Deployment.id),
                func.count(Deployment.id).filter(Deployment.status == "success"),
                func.count(Deployment.id).filter(Deployment.status == "failed"),
            )
        )
    ).one()

    alerts_row = (
        await db.execute(
            select(
                func.count(Alert.id).filter(Alert.status == "active"),
                func.count(Alert.id).filter(Alert.status == "active", Alert.severity == "critical"),
            )
        )
    ).one()

    return DashboardStats(
        total_services=svc[0] or 0,
        healthy_services=svc[1] or 0,
        degraded_services=svc[2] or 0,
        unhealthy_services=svc[3] or 0,
        avg_response_time=round(float(svc[4] or 0.0), 1),
        avg_uptime=round(float(svc[5] or 99.9), 2),
        total_deployments=dep[0] or 0,
        successful_deployments=dep[1] or 0,
        failed_deployments=dep[2] or 0,
        active_alerts=alerts_row[0] or 0,
        critical_alerts=alerts_row[1] or 0,
    )


@router.get("/service-metrics")
async def service_metrics(db: AsyncSession = Depends(get_db)):
    """Get CPU/Memory metrics for all services (for charts)."""
    result = await db.execute(
        select(Service.id, Service.name, Service.cpu_usage, Service.memory_usage, Service.response_time_ms)
        .order_by(Service.id)
    )
    rows = result.all()
    return [
        {"id": r[0], "name": r[1], "cpu_usage": r[2], "memory_usage": r[3], "response_time_ms": r[4]}
        for r in rows
    ]


@router.get("/recent-activity")
async def recent_activity(db: AsyncSession = Depends(get_db)):
    """Get recent logs and deployments for activity feed."""
    recent_logs = await db.execute(
        select(LogEntry).order_by(LogEntry.created_at.desc()).limit(5)
    )
    recent_deps = await db.execute(
        select(Deployment).order_by(Deployment.created_at.desc()).limit(5)
    )

    return {
        "logs": [
            {"id": l.id, "level": l.level, "message": l.message, "created_at": l.created_at.isoformat()}
            for l in recent_logs.scalars().all()
        ],
        "deployments": [
            {"id": d.id, "version": d.version, "status": d.status, "created_at": d.created_at.isoformat()}
            for d in recent_deps.scalars().all()
        ],
    }
