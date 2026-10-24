"""SQLAlchemy ORM models."""
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    port: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="unknown")  # healthy / degraded / unhealthy / unknown
    environment: Mapped[str] = mapped_column(String(50), default="production")
    response_time_ms: Mapped[float] = mapped_column(Float, default=0)
    uptime_percent: Mapped[float] = mapped_column(Float, default=99.9)
    cpu_usage: Mapped[float] = mapped_column(Float, default=0)
    memory_usage: Mapped[float] = mapped_column(Float, default=0)
    last_checked: Mapped[datetime] = mapped_column(default=_utcnow)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow)

    deployments: Mapped[list["Deployment"]] = relationship(back_populates="service", cascade="all, delete-orphan")
    logs: Mapped[list["LogEntry"]] = relationship(back_populates="service", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="service", cascade="all, delete-orphan")


class Deployment(Base):
    __tablename__ = "deployments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / running / success / failed / rolled_back
    environment: Mapped[str] = mapped_column(String(50), default="production")
    deployed_by: Mapped[str] = mapped_column(String(100), default="system")
    commit_hash: Mapped[str | None] = mapped_column(String(40), nullable=True)
    duration: Mapped[int] = mapped_column(Integer, default=0)  # seconds
    log_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    service: Mapped["Service"] = relationship(back_populates="deployments")


class LogEntry(Base):
    __tablename__ = "logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_id: Mapped[int | None] = mapped_column(ForeignKey("services.id"), nullable=True)
    level: Mapped[str] = mapped_column(String(20), default="INFO")  # DEBUG / INFO / WARN / ERROR
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(100), default="system")
    created_at: Mapped[datetime] = mapped_column(default=_utcnow)

    service: Mapped["Service | None"] = relationship(back_populates="logs")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_id: Mapped[int | None] = mapped_column(ForeignKey("services.id"), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info / warning / critical
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active / acknowledged / resolved
    acknowledged_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    service: Mapped["Service | None"] = relationship(back_populates="alerts")
