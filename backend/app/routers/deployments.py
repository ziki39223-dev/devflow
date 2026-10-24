"""Deployment management router."""
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Deployment, Service
from app.schemas.schemas import DeploymentCreate, DeploymentResponse

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.get("", response_model=list[DeploymentResponse])
async def list_deployments(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Deployment, Service.name.label("service_name"))
        .join(Service, Deployment.service_id == Service.id, isouter=True)
        .order_by(Deployment.created_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        DeploymentResponse(
            id=d.id, service_id=d.service_id, version=d.version, status=d.status,
            environment=d.environment, deployed_by=d.deployed_by, commit_hash=d.commit_hash,
            duration=d.duration, log_output=d.log_output, created_at=d.created_at,
            completed_at=d.completed_at, service_name=sname,
        )
        for d, sname in rows
    ]


@router.post("", response_model=DeploymentResponse, status_code=201)
async def create_deployment(data: DeploymentCreate, db: AsyncSession = Depends(get_db)):
    service = await db.get(Service, data.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    deployment = Deployment(
        **data.model_dump(),
        status="success",
        duration=round(random.uniform(30, 300)),
        completed_at=datetime.now(timezone.utc),
        log_output="> Building image...\n> Pushing to registry...\n> Rolling update...\n> Deployment completed successfully.",
    )
    db.add(deployment)
    await db.flush()
    await db.refresh(deployment)
    return DeploymentResponse(
        id=deployment.id, service_id=deployment.service_id, version=deployment.version,
        status=deployment.status, environment=deployment.environment,
        deployed_by=deployment.deployed_by, commit_hash=deployment.commit_hash,
        duration=deployment.duration, log_output=deployment.log_output,
        created_at=deployment.created_at, completed_at=deployment.completed_at,
        service_name=service.name,
    )


@router.get("/stats")
async def deployment_stats(db: AsyncSession = Depends(get_db)):
    """Get deployment statistics."""
    total = await db.scalar(select(func.count(Deployment.id))) or 0
    success = await db.scalar(select(func.count(Deployment.id)).where(Deployment.status == "success")) or 0
    failed = await db.scalar(select(func.count(Deployment.id)).where(Deployment.status == "failed")) or 0

    # Last 7 days trend
    from sqlalchemy import text

    trend_result = await db.execute(
        text("""
            SELECT date(created_at) as date,
                   sum(case when status='success' then 1 else 0 end) as success,
                   sum(case when status='failed' then 1 else 0 end) as failed
            FROM deployments
            WHERE created_at >= date('now', '-7 days')
            GROUP BY date(created_at)
            ORDER BY date
        """)
    )
    trend = [
        {"date": row[0], "success": row[1], "failed": row[2]}
        for row in trend_result.all()
    ]

    return {
        "total": total,
        "success": success,
        "failed": failed,
        "success_rate": round((success / total * 100) if total else 0, 1),
        "trend": trend,
    }


@router.post("/{deployment_id}/rollback")
async def rollback_deployment(deployment_id: int, db: AsyncSession = Depends(get_db)):
    deployment = await db.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")

    deployment.status = "rolled_back"
    await db.flush()
    return {"id": deployment_id, "status": "rolled_back", "message": "Rollback initiated"}
