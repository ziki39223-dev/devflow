"""Alert management router."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Alert, Service
from app.schemas.schemas import AlertCreate, AlertResponse, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    status: str | None = None,
    severity: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Alert, Service.name.label("service_name"))
        .join(Service, Alert.service_id == Service.id, isouter=True)
        .order_by(Alert.created_at.desc())
    )
    if status:
        query = query.where(Alert.status == status)
    if severity:
        query = query.where(Alert.severity == severity)

    result = await db.execute(query)
    rows = result.all()
    return [
        AlertResponse(
            id=a.id, service_id=a.service_id, severity=a.severity,
            title=a.title, message=a.message, status=a.status,
            acknowledged_by=a.acknowledged_by, created_at=a.created_at,
            resolved_at=a.resolved_at, service_name=sname,
        )
        for a, sname in rows
    ]


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(data: AlertCreate, db: AsyncSession = Depends(get_db)):
    alert = Alert(**data.model_dump())
    db.add(alert)
    await db.flush()
    await db.refresh(alert)

    service_name = None
    if alert.service_id:
        svc = await db.get(Service, alert.service_id)
        if svc:
            service_name = svc.name

    return AlertResponse(
        id=alert.id, service_id=alert.service_id, severity=alert.severity,
        title=alert.title, message=alert.message, status=alert.status,
        acknowledged_by=alert.acknowledged_by, created_at=alert.created_at,
        resolved_at=alert.resolved_at, service_name=service_name,
    )


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(alert_id: int, data: AlertUpdate, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if data.status:
        alert.status = data.status
        if data.status == "resolved":
            alert.resolved_at = datetime.now(timezone.utc)
    if data.acknowledged_by:
        alert.acknowledged_by = data.acknowledged_by
        if alert.status == "active":
            alert.status = "acknowledged"

    await db.flush()
    await db.refresh(alert)

    service_name = None
    if alert.service_id:
        svc = await db.get(Service, alert.service_id)
        if svc:
            service_name = svc.name

    return AlertResponse(
        id=alert.id, service_id=alert.service_id, severity=alert.severity,
        title=alert.title, message=alert.message, status=alert.status,
        acknowledged_by=alert.acknowledged_by, created_at=alert.created_at,
        resolved_at=alert.resolved_at, service_name=service_name,
    )


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.flush()
