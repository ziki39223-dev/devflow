"use client";

import { useEffect, useState } from "react";
import { Rocket, RotateCcw } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { StatCard, StatusBadge } from "@/components/cards";

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [deps, st] = await Promise.all([api.listDeployments(50), api.deploymentStats()]);
      setDeployments(deps);
      setStats(st);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function rollback(id: number) {
    if (!confirm("确认回滚该部署？")) return;
    await api.rollbackDeployment(id);
    await load();
  }

  const trendData = stats?.trend?.map((t: any) => ({
    date: t.date?.slice(5),
    success: t.success,
    failed: t.failed,
  })) || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">部署流水线</h1>
          <p className="text-gray-400 text-sm mt-1">追踪部署历史与成功率</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="总部署数" value={stats?.total ?? "—"} accent="primary" icon={<Rocket size={20} />} />
          <StatCard label="成功率" value={`${stats?.success_rate ?? "—"}%`} accent="green" />
          <StatCard label="失败数" value={stats?.failed ?? "—"} accent={(stats?.failed ?? 0) > 0 ? "red" : "green"} />
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-4">近 7 天部署趋势</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#272a33" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #272a33", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Area type="monotone" dataKey="success" name="成功" stackId="1" stroke="#10b981" fill="#10b98133" />
              <Area type="monotone" dataKey="failed" name="失败" stackId="1" stroke="#ef4444" fill="#ef444433" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">部署记录</h2>
          {loading ? (
            <p className="text-gray-500">加载中…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-df-border">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">服务</th>
                    <th className="text-left py-3 px-2">版本</th>
                    <th className="text-left py-3 px-2">环境</th>
                    <th className="text-left py-3 px-2">部署人</th>
                    <th className="text-left py-3 px-2">状态</th>
                    <th className="text-left py-3 px-2">耗时</th>
                    <th className="text-left py-3 px-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d) => (
                    <tr key={d.id} className="border-b border-df-border/50 hover:bg-white/5">
                      <td className="py-3 px-2 text-gray-400">#{d.id}</td>
                      <td className="py-3 px-2 text-white">{d.service_name}</td>
                      <td className="py-3 px-2 text-df-accent">{d.version}</td>
                      <td className="py-3 px-2 text-gray-300">{d.environment}</td>
                      <td className="py-3 px-2 text-gray-300">{d.deployed_by}</td>
                      <td className="py-3 px-2"><StatusBadge status={d.status} /></td>
                      <td className="py-3 px-2 text-gray-300">{d.duration}s</td>
                      <td className="py-3 px-2">
                        <button className="text-gray-400 hover:text-df-primary flex items-center gap-1" onClick={() => rollback(d.id)}>
                          <RotateCcw size={14} /> 回滚
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
