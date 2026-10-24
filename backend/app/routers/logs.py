"""Log management router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import LogEntry, Service
from app.schemas.schemas import LogEntryCreate, LogEntryResponse

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=list[LogEntryResponse])
async def list_logs(
    level: str | None = Query(None, description="Filter by log level"),
    service_id: int | None = Query(None, description="Filter by service"),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(LogEntry, Service.name.label("service_name"))
        .join(Service, LogEntry.service_id == Service.id, isouter=True)
        .order_by(LogEntry.created_at.desc())
        .limit(limit)
    )
    if level:
        query = query.where(LogEntry.level == level.upper())
    if service_id:
        query = query.where(LogEntry.service_id == service_id)

    result = await db.execute(query)
    rows = result.all()
    return [
        LogEntryResponse(
            id=log.id, service_id=log.service_id, level=log.level,
            message=log.message, source=log.source, created_at=log.created_at,
            service_name=sname,
        )
        for log, sname in rows
    ]


@router.post("", response_model=LogEntryResponse, status_code=201)
async def create_log(data: LogEntryCreate, db: AsyncSession = Depends(get_db)):
    log = LogEntry(**data.model_dump())
    db.add(log)
    await db.flush()
    await db.refresh(log)

    service_name = None
    if log.service_id:
        svc = await db.get(Service, log.service_id)
        if svc:
            service_name = svc.name

    return LogEntryResponse(
        id=log.id, service_id=log.service_id, level=log.level,
        message=log.message, source=log.source, created_at=log.created_at,
        service_name=service_name,
    )


@router.delete("/{log_id}", status_code=204)
async def delete_log(log_id: int, db: AsyncSession = Depends(get_db)):
    log = await db.get(LogEntry, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    await db.delete(log)
    await db.flush()
