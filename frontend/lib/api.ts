"use client";

import type {
  Alert,
  ContainerInfo,
  DashboardStats,
  Deployment,
  DeploymentCreateInput,
  LogEntry,
  RecentActivity,
  Service,
  ServiceCreateInput,
  ServiceMetric,
  ServiceUpdateInput,
  SystemMetrics,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  dashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),
  serviceMetrics: () => request<ServiceMetric[]>("/api/dashboard/service-metrics"),
  recentActivity: () => request<RecentActivity>("/api/dashboard/recent-activity"),

  // Services
  listServices: () => request<Service[]>("/api/services"),
  getService: (id: number) => request<Service>(`/api/services/${id}`),
  createService: (data: ServiceCreateInput) =>
    request<Service>("/api/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: ServiceUpdateInput) =>
    request<Service>(`/api/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteService: (id: number) =>
    request<void>(`/api/services/${id}`, { method: "DELETE" }),
  healthCheck: (id: number) =>
    request<Service>(`/api/services/${id}/health-check`, { method: "POST" }),

  // Deployments
  listDeployments: (limit = 50) => request<Deployment[]>(`/api/deployments?limit=${limit}`),
  deploymentStats: () => request<Record<string, number>>("/api/deployments/stats"),
  createDeployment: (data: DeploymentCreateInput) =>
    request<Deployment>("/api/deployments", { method: "POST", body: JSON.stringify(data) }),
  rollbackDeployment: (id: number) =>
    request<Deployment>(`/api/deployments/${id}/rollback`, { method: "POST" }),

  // Logs
  listLogs: (params?: { level?: string; service_id?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.level) qs.set("level", params.level);
    if (params?.service_id) qs.set("service_id", String(params.service_id));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<LogEntry[]>(`/api/logs${q ? `?${q}` : ""}`);
  },
  createLog: (data: Omit<LogEntry, "id" | "created_at" | "service_name">) =>
    request<LogEntry>("/api/logs", { method: "POST", body: JSON.stringify(data) }),

  // Alerts
  listAlerts: (params?: { status?: string; severity?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.severity) qs.set("severity", params.severity);
    const q = qs.toString();
    return request<Alert[]>(`/api/alerts${q ? `?${q}` : ""}`);
  },
  createAlert: (data: Omit<Alert, "id" | "status" | "acknowledged_by" | "created_at" | "resolved_at" | "service_name">) =>
    request<Alert>("/api/alerts", { method: "POST", body: JSON.stringify(data) }),
  updateAlert: (id: number, data: { status?: string; acknowledged_by?: string }) =>
    request<Alert>(`/api/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAlert: (id: number) =>
    request<void>(`/api/alerts/${id}`, { method: "DELETE" }),

  // Containers
  listContainers: () => request<ContainerInfo[]>("/api/containers"),
  containerAction: (id: string, action: string) =>
    request<{ id: string; action: string; result?: string; error?: string }>(
      `/api/containers/${id}/${action}`,
      { method: "POST" }
    ),
  systemMetrics: () => request<SystemMetrics>("/api/containers/system-metrics"),
};

export { API_BASE };
