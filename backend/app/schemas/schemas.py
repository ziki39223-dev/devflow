"""Pydantic schemas for API request/response validation."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Service ──────────────────────────────────────────────
class ServiceBase(BaseModel):
    name: str
    url: str
    port: int
    environment: str = "production"


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    port: int | None = None
    status: str | None = None
    environment: str | None = None


class ServiceResponse(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    response_time_ms: float
    uptime_percent: float
    cpu_usage: float
    memory_usage: float
    last_checked: datetime
    created_at: datetime


# ── Deployment ───────────────────────────────────────────
class DeploymentBase(BaseModel):
    service_id: int
    version: str
    environment: str = "production"
    deployed_by: str = "system"
    commit_hash: str | None = None


class DeploymentCreate(DeploymentBase):
    pass


class DeploymentResponse(DeploymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    duration: int
    log_output: str | None
    created_at: datetime
    completed_at: datetime | None
    service_name: str | None = None


# ── Log ──────────────────────────────────────────────────
class LogEntryBase(BaseModel):
    service_id: int | None = None
    level: str = "INFO"
    message: str
    source: str = "system"


class LogEntryCreate(LogEntryBase):
    pass


class LogEntryResponse(LogEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    service_name: str | None = None


# ── Alert ────────────────────────────────────────────────
class AlertBase(BaseModel):
    service_id: int | None = None
    severity: str = "info"
    title: str
    message: str


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    status: str | None = None
    acknowledged_by: str | None = None


class AlertResponse(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    acknowledged_by: str | None
    created_at: datetime
    resolved_at: datetime | None
    service_name: str | None = None


# ── Dashboard / Metrics ──────────────────────────────────
class DashboardStats(BaseModel):
    total_services: int
    healthy_services: int
    degraded_services: int
    unhealthy_services: int
    total_deployments: int
    successful_deployments: int
    failed_deployments: int
    active_alerts: int
    critical_alerts: int
    avg_response_time: float
    avg_uptime: float


class ServiceMetrics(BaseModel):
    id: int
    name: str
    cpu_usage: float
    memory_usage: float
    response_time_ms: float


class DeploymentTrend(BaseModel):
    date: str
    success: int
    failed: int


# ── Container (Docker) ───────────────────────────────────
class ContainerInfo(BaseModel):
    id: str
    name: str
    image: str
    status: str
    state: str
    ports: str
    cpu_percent: float
    memory_usage: str
    created: str


# ── System Metrics ───────────────────────────────────────
class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_total: int
    memory_used: int
    memory_percent: float
    disk_total: int
    disk_used: int
    disk_percent: float
    network_sent: int
    network_recv: int
