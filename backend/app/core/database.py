"""Database engine and session management."""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base for all models."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables and seed initial data."""
    from app.models.models import Service, Deployment, LogEntry, Alert  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed initial data if empty
    async with async_session() as session:
        from sqlalchemy import select

        result = await session.execute(select(Service).limit(1))
        if result.scalars().first() is None:
            await _seed_data(session)
            await session.commit()


async def _seed_data(session: AsyncSession) -> None:
    """Insert sample data for demonstration."""
    from datetime import datetime, timezone

    from app.models.models import Alert, Deployment, LogEntry, Service

    services = [
        Service(name="API Gateway", url="http://localhost:8000/health", port=8000,
                status="healthy", environment="production"),
        Service(name="Frontend App", url="http://localhost:3000", port=3000,
                status="healthy", environment="production"),
        Service(name="PostgreSQL", url="localhost:5432", port=5432,
                status="healthy", environment="production"),
        Service(name="Redis Cache", url="localhost:6379", port=6379,
                status="degraded", environment="production"),
        Service(name="Worker Queue", url="localhost:9090", port=9090,
                status="unhealthy", environment="staging"),
    ]
    session.add_all(services)
    await session.flush()

    deployments = [
        Deployment(service_id=1, version="v2.4.1", status="success",
                   environment="production", deployed_by="zhang_san",
                   duration=127, created_at=datetime(2026, 7, 16, 14, 30, tzinfo=timezone.utc)),
        Deployment(service_id=1, version="v2.4.0", status="success",
                   environment="production", deployed_by="li_si",
                   duration=98, created_at=datetime(2026, 7, 16, 10, 15, tzinfo=timezone.utc)),
        Deployment(service_id=2, version="v1.8.3", status="success",
                   environment="production", deployed_by="zhang_san",
                   duration=156, created_at=datetime(2026, 7, 16, 9, 0, tzinfo=timezone.utc)),
        Deployment(service_id=1, version="v2.3.9", status="failed",
                   environment="staging", deployed_by="wang_wu",
                   duration=45, created_at=datetime(2026, 7, 15, 22, 30, tzinfo=timezone.utc)),
        Deployment(service_id=3, version="v15.2", status="success",
                   environment="production", deployed_by="li_si",
                   duration=210, created_at=datetime(2026, 7, 15, 18, 0, tzinfo=timezone.utc)),
    ]
    session.add_all(deployments)

    logs = [
        LogEntry(service_id=1, level="INFO", message="Server started on port 8000"),
        LogEntry(service_id=1, level="INFO", message="Health check passed"),
        LogEntry(service_id=2, level="INFO", message="Compiled successfully in 3.2s"),
        LogEntry(service_id=4, level="WARN", message="Memory usage above 80% threshold"),
        LogEntry(service_id=5, level="ERROR", message="Connection refused to upstream service"),
        LogEntry(service_id=3, level="INFO", message="Checkpoint complete at WAL segment 42"),
        LogEntry(service_id=1, level="ERROR", message="Rate limit exceeded for IP 10.0.0.5"),
    ]
    session.add_all(logs)

    alerts = [
        Alert(service_id=4, severity="warning", title="High Memory Usage",
              message="Redis memory usage at 82%, approaching threshold",
              status="active"),
        Alert(service_id=5, severity="critical", title="Service Unreachable",
              message="Worker Queue health check failed 3 consecutive times",
              status="active"),
        Alert(service_id=1, severity="info", title="Rate Limit Warning",
              message="API rate limit triggered for client 10.0.0.5",
              status="resolved"),
    ]
    session.add_all(alerts)
