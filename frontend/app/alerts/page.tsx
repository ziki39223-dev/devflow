"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/cards";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.listAlerts({ status: statusFilter || undefined });
      setAlerts(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function acknowledge(id: number) {
    await api.updateAlert(id, { status: "acknowledged", acknowledged_by: "admin" });
    await load();
  }

  async function resolve(id: number) {
    await api.updateAlert(id, { status: "resolved" });
    await load();
  }

  async function remove(id: number) {
    await api.deleteAlert(id);
    await load();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">告警管理</h1>
            <p className="text-gray-400 text-sm mt-1">确认与处理系统告警</p>
          </div>
          <select className="bg-df-bg border border-df-border rounded px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="acknowledged">已确认</option>
            <option value="resolved">已解决</option>
          </select>
        </header>

        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-500">加载中…</p>
          ) : alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无告警 🎉</p>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="card flex items-start gap-4">
                <div className={`p-2 rounded-lg ${a.severity === "critical" ? "bg-red-500/15 text-red-400" : a.severity === "warning" ? "bg-yellow-500/15 text-yellow-400" : "bg-blue-500/15 text-blue-400"}`}>
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{a.title}</span>
                    <StatusBadge status={a.severity} />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{a.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.service_name ? `服务: ${a.service_name}` : "全局"} · {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.status === "active" && (
                    <>
                      <button className="btn btn-ghost flex items-center gap-1" onClick={() => acknowledge(a.id)}>
                        <Check size={14} /> 确认
                      </button>
                      <button className="btn btn-ghost flex items-center gap-1" onClick={() => resolve(a.id)}>
                        <Bell size={14} /> 解决
                      </button>
                    </>
                  )}
                  <button className="text-gray-500 hover:text-red-400" onClick={() => remove(a.id)}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
