"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes, Play, Square, RotateCw, Cpu, MemoryStick } from "lucide-react";
import { api, API_BASE } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";

interface Metrics {
  cpu_percent: number;
  memory_percent: number;
  memory_used: number;
  memory_total: number;
  disk_percent: number;
  disk_used: number;
  disk_total: number;
  network_sent: number;
  network_recv: number;
}

interface Container {
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

function fmtBytes(b: number) {
  if (b > 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
  if (b > 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${b} B`;
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  async function loadOnce() {
    try {
      const [cs, m] = await Promise.all([api.listContainers(), api.systemMetrics()]);
      setContainers(cs);
      setMetrics(m);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    loadOnce();

    // WebSocket real-time stream（由 API_BASE 推导 ws 地址，跟随环境配置）
    const wsUrl = `${API_BASE.replace(/^http/, "ws")}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "metrics") {
          setMetrics(msg.system);
          setContainers(msg.containers);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => console.warn("WebSocket connection failed, falling back to polling");
    return () => ws.close();
  }, []);

  async function doAction(id: string, action: "start" | "stop" | "restart") {
    setActioning(`${id}-${action}`);
    try {
      await api.containerAction(id, action);
      await loadOnce();
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">容器监控</h1>
            <p className="text-gray-400 text-sm mt-1">Docker 容器实时状态 · WebSocket 推送</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-400">实时连接</span>
          </div>
        </header>

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-2 text-df-primary"><Cpu size={18} /><span className="text-sm text-gray-400">CPU</span></div>
              <p className="text-2xl font-bold text-white mt-2">{metrics.cpu_percent.toFixed(1)}%</p>
              <div className="w-full bg-df-border rounded-full h-1.5 mt-2"><div className="bg-df-primary h-1.5 rounded-full" style={{ width: `${metrics.cpu_percent}%` }} /></div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-df-accent"><MemoryStick size={18} /><span className="text-sm text-gray-400">内存</span></div>
              <p className="text-2xl font-bold text-white mt-2">{metrics.memory_percent.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{fmtBytes(metrics.memory_used)} / {fmtBytes(metrics.memory_total)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-400">磁盘</p>
              <p className="text-2xl font-bold text-white mt-2">{metrics.disk_percent.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{fmtBytes(metrics.disk_used)} / {fmtBytes(metrics.disk_total)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-400">网络</p>
              <p className="text-2xl font-bold text-white mt-2 text-sm">↑{fmtBytes(metrics.network_sent)}</p>
              <p className="text-xs text-gray-500 mt-1">↓{fmtBytes(metrics.network_recv)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {containers.map((c) => {
            const running = c.state === "running";
            return (
              <div key={c.id} className="card hover:border-df-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes size={18} className="text-df-primary" />
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.image}</p>
                    </div>
                  </div>
                  <span className={`badge ${running ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{c.state}</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>ID: {c.id}</p>
                  <p>端口: {c.ports || "—"}</p>
                  <p>内存: {c.memory_usage}</p>
                  <p>CPU: {c.cpu_percent}%</p>
                </div>
                <div className="flex gap-2 mt-4">
                  {running ? (
                    <button className="btn btn-ghost flex-1 flex items-center justify-center gap-1" disabled={actioning === `${c.id}-stop`} onClick={() => doAction(c.id, "stop")}>
                      <Square size={14} /> 停止
                    </button>
                  ) : (
                    <button className="btn btn-primary flex-1 flex items-center justify-center gap-1" disabled={actioning === `${c.id}-start`} onClick={() => doAction(c.id, "start")}>
                      <Play size={14} /> 启动
                    </button>
                  )}
                  <button className="btn btn-ghost flex items-center justify-center gap-1" disabled={actioning === `${c.id}-restart`} onClick={() => doAction(c.id, "restart")}>
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
