/**
 * 与后端 app/schemas/schemas.py 中的 Pydantic 模型一一对应的前端类型定义。
 * 修改后端 schema 时请同步更新此文件。
 */

export interface Service {
  id: number;
  name: string;
  url: string;
  port: number;
  environment: string;
  status: string;
  response_time_ms: number;
  uptime_percent: number;
  cpu_usage: number;
  memory_usage: number;
  last_checked: string;
  created_at: string;
}

export interface ServiceCreateInput {
  name: string;
  url: string;
  port: number;
  environment?: string;
}

export interface ServiceUpdateInput {
  name?: string;
  url?: string;
  port?: number;
  status?: string;
  environment?: string;
}

export interface Deployment {
  id: number;
  service_id: number;
  version: string;
  environment: string;
  deployed_by: string;
  commit_hash: string | null;
  status: string;
  duration: number;
  log_output: string | null;
  created_at: string;
  completed_at: string | null;
  service_name: string | null;
}

export interface DeploymentCreateInput {
  service_id: number;
  version: string;
  environment?: string;
  deployed_by?: string;
  commit_hash?: string | null;
}

export interface LogEntry {
  id: number;
  service_id: number | null;
  level: string;
  message: string;
  source: string;
  created_at: string;
  service_name: string | null;
}

export interface Alert {
  id: number;
  service_id: number | null;
  severity: string;
  title: string;
  message: string;
  status: string;
  acknowledged_by: string | null;
  created_at: string;
  resolved_at: string | null;
  service_name: string | null;
}

export interface DashboardStats {
  total_services: number;
  healthy_services: number;
  degraded_services: number;
  unhealthy_services: number;
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  active_alerts: number;
  critical_alerts: number;
  avg_response_time: number;
  avg_uptime: number;
}

export interface ServiceMetric {
  id: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
  response_time_ms: number;
}

export interface RecentActivity {
  logs: Pick<LogEntry, "id" | "level" | "message" | "created_at">[];
  deployments: Pick<Deployment, "id" | "version" | "status" | "created_at">[];
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  cpu_percent: number;
  memory_usage: string;
  created: string;
}

export interface SystemMetrics {
  cpu_percent: number;
  memory_total: number;
  memory_used: number;
  memory_percent: number;
  disk_total: number;
  disk_used: number;
  disk_percent: number;
  network_sent: number;
  network_recv: number;
}
