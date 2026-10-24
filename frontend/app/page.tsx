"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, Cpu, Rocket, Server } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { StatCard, StatusBadge } from "@/components/cards";
import { Sidebar } from "@/components/Sidebar";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#ef4444", "#10b981"];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [activity, setActivity] = useState<any>(null);

  useEffect(() => {
    api.dashboardStats().then(setStats).catch(console.error);
    api.serviceMetrics().then(setMetrics).catch(console.error);
    api.recentActivity().then(setActivity).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">仪表盘</h1>
          <p className="text-gray-400 text-sm mt-1">DevOps 平台全局概览与实时监控</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="服务总数"
            value={stats?.total_services ?? "—"}
            sub={`${stats?.healthy_services ?? 0} 健康 · ${stats?.unhealthy_services ?? 0} 异常`}
            accent="primary"
            icon={<Server size={20} />}
          />
          <StatCard
            label="部署总数"
            value={stats?.total_deployments ?? "—"}
            sub={`成功率 ${stats?.total_deployments ? Math.round((stats.successful_deployments / stats.total_deployments) * 100) : 0}%`}
            accent="cyan"
            icon={<Rocket size={20} />}
          />
          <StatCard
            label="活跃告警"
            value={stats?.active_alerts ?? "—"}
            sub={`${stats?.critical_alerts ?? 0} 严重`}
            accent={(stats?.critical_alerts ?? 0) > 0 ? "red" : "yellow"}
            icon={<AlertTriangle size={20} />}
          />
          <StatCard
            label="平均响应"
            value={`${stats?.avg_response_time ?? "—"}ms`}
            sub={`平均可用性 ${stats?.avg_uptime ?? "—"}%`}
            accent="green"
            icon={<Activity size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-white mb-4">服务资源使用率 (%)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#272a33" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#171a21", border: "1px solid #272a33", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="cpu_usage" name="CPU" fill="#6366f1" />
                <Bar dataKey="memory_usage" name="内存" fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-4">服务健康状态</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#272a33" />
                <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{ background: "#171a21", border: "1px solid #272a33", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="response_time_ms" name="响应时间(ms)" radius={[0, 6, 6, 0]}>
                  {metrics.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="card">
            <h2 className="font-semibold text-white mb-4">最近日志</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity?.logs?.map((l: any) => (
                <div key={l.id} className="flex items-start gap-2 text-sm">
                  <span className={`badge ${l.level === "ERROR" ? "bg-red-500/15 text-red-400" : l.level === "WARN" ? "bg-yellow-500/15 text-yellow-400" : "bg-blue-500/15 text-blue-400"}`}>{l.level}</span>
                  <span className="text-gray-300 flex-1">{l.message}</span>
                </div>
              )) ?? <p className="text-gray-500 text-sm">加载中…</p>}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-4">最近部署</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity?.deployments?.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Rocket size={14} className="text-df-primary" />
                    {d.version}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
              )) ?? <p className="text-gray-500 text-sm">加载中…</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
