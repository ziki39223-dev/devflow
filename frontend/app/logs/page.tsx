"use client";

import { useEffect, useState } from "react";
import { FileText, Filter } from "lucide-react";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { LevelBadge } from "@/components/cards";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");
  const [limit, setLimit] = useState(100);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listLogs({ level: level || undefined, limit });
      setLogs(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [level, limit]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">日志中心</h1>
            <p className="text-gray-400 text-sm mt-1">集中查看与过滤系统日志</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select className="bg-df-bg border border-df-border rounded px-3 py-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">全部级别</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
            <select className="bg-df-bg border border-df-border rounded px-3 py-2 text-sm" value={limit} onChange={(e) => setLimit(+e.target.value)}>
              <option value={50}>50 条</option>
              <option value={100}>100 条</option>
              <option value={200}>200 条</option>
            </select>
          </div>
        </header>

        <div className="card">
          {loading ? (
            <p className="text-gray-500">加载中…</p>
          ) : (
            <div className="font-mono text-sm space-y-1 max-h-[70vh] overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 py-1 border-b border-df-border/30 hover:bg-white/5 px-2 rounded">
                  <span className="text-gray-500 shrink-0">{new Date(l.created_at).toLocaleTimeString()}</span>
                  <LevelBadge level={l.level} />
                  <span className="text-gray-600 shrink-0 w-28 truncate">{l.source}</span>
                  <span className="text-gray-300 flex-1">{l.message}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-gray-500 py-4 text-center">暂无日志</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
