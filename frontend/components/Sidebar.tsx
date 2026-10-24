"use client";

import { Activity, Boxes, Bell, FileText, Rocket, Server, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/services", label: "服务管理", icon: Server },
  { href: "/deployments", label: "部署流水线", icon: Rocket },
  { href: "/logs", label: "日志中心", icon: FileText },
  { href: "/alerts", label: "告警管理", icon: Bell },
  { href: "/containers", label: "容器监控", icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-df-surface border-r border-df-border flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-df-border">
        <Activity className="text-df-primary" size={24} />
        <span className="font-bold text-lg text-white">DevFlow</span>
      </div>
      <nav className="flex-1 py-4">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                active
                  ? "bg-df-primary/10 text-df-primary border-r-2 border-df-primary"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-df-border text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          API 在线
        </div>
        <p className="mt-1">DevFlow v1.0.0</p>
      </div>
    </aside>
  );
}
