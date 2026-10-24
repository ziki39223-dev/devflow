"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Server } from "lucide-react";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { StatCard, StatusBadge } from "@/components/cards";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", port: 80, environment: "production" });

  async function load() {
    setLoading(true);
    try {
      setServices(await api.listServices());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function runHealthCheck(id: number) {
    setChecking(id);
    try {
      await api.healthCheck(id);
      await load();
    } finally {
      setChecking(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createService(form);
      setShowForm(false);
      setForm({ name: "", url: "", port: 80, environment: "production" });
      await load();
    } catch (err) { console.error(err); }
  }

  async function remove(id: number) {
    if (!confirm("确认删除该服务？")) return;
    await api.deleteService(id);
    await load();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">服务管理</h1>
            <p className="text-gray-400 text-sm mt-1">监控服务健康状态与资源使用</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> 新增服务
          </button>
        </header>

        {showForm && (
          <form onSubmit={submit} className="card mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="input bg-df-bg border border-df-border rounded px-3 py-2 text-sm" placeholder="服务名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input bg-df-bg border border-df-border rounded px-3 py-2 text-sm" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            <input type="number" className="input bg-df-bg border border-df-border rounded px-3 py-2 text-sm" placeholder="端口" value={form.port} onChange={(e) => setForm({ ...form, port: +e.target.value })} required />
            <select className="input bg-df-bg border border-df-border rounded px-3 py-2 text-sm" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="dev">dev</option>
            </select>
            <button type="submit" className="btn btn-primary col-span-2 md:col-span-4">提交</button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">加载中…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="card hover:border-df-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={18} className="text-df-primary" />
                    <span className="font-semibold text-white">{s.name}</span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{s.url} :{s.port}</p>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div><p className="text-xs text-gray-500">响应</p><p className="text-sm font-medium text-white">{s.response_time_ms}ms</p></div>
                  <div><p className="text-xs text-gray-500">CPU</p><p className="text-sm font-medium text-df-accent">{s.cpu_usage}%</p></div>
                  <div><p className="text-xs text-gray-500">内存</p><p className="text-sm font-medium text-df-accent">{s.memory_usage}%</p></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="btn btn-ghost flex-1 flex items-center justify-center gap-1" disabled={checking === s.id} onClick={() => runHealthCheck(s.id)}>
                    <RefreshCw size={14} className={checking === s.id ? "animate-spin" : ""} /> 健康检查
                  </button>
                  <button className="btn btn-ghost text-red-400" onClick={() => remove(s.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
