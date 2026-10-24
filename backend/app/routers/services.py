"""Service management router."""
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Service
from app.schemas.schemas import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceResponse])
async def list_services(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).order_by(Service.id))
    return result.scalars().all()


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(data: ServiceCreate, db: AsyncSession = Depends(get_db)):
    service = Service(**data.model_dump())
    db.add(service)
    await db.flush()
    await db.refresh(service)
    return service


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: int, data: ServiceUpdate, db: AsyncSession = Depends(get_db)):
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(service, key, val)
    await db.flush()
    await db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=204)
async def delete_service(service_id: int, db: AsyncSession = Depends(get_db)):
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(service)
    await db.flush()


@router.post("/{service_id}/health-check")
async def health_check(service_id: int, db: AsyncSession = Depends(get_db)):
    """Simulate a health check on a service."""
    service = await db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Simulate health check — in production, make an HTTP request
    from datetime import datetime, timezone

    response_time = round(random.uniform(15, 250), 1)
    cpu = round(random.uniform(5, 75), 1)
    memory = round(random.uniform(20, 85), 1)

    # Determine status based on metrics
    if cpu > 70 or memory > 80:
        service.status = "degraded"
    elif response_time > 200:
        service.status = "degraded"
    else:
        service.status = "healthy"

    service.response_time_ms = response_time
    service.cpu_usage = cpu
    service.memory_usage = memory
    service.last_checked = datetime.now(timezone.utc)
    await db.flush()

    return {
        "service_id": service_id,
        "status": service.status,
        "response_time_ms": response_time,
        "cpu_usage": cpu,
        "memory_usage": memory,
    }
