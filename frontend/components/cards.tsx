"use client";

import clsx from "clsx";

export function StatCard({
  label,
  value,
  sub,
  accent = "primary",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "green" | "yellow" | "red" | "cyan";
  icon?: React.ReactNode;
}) {
  const accents: Record<string, string> = {
    primary: "text-df-primary",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    cyan: "text-df-accent",
  };
  return (
    <div className="card hover:border-df-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={clsx("stat-value mt-1", accents[accent])}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {icon && <div className={clsx("p-2 rounded-lg bg-white/5", accents[accent])}>{icon}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy: "bg-green-500/15 text-green-400",
    degraded: "bg-yellow-500/15 text-yellow-400",
    unhealthy: "bg-red-500/15 text-red-400",
    unknown: "bg-gray-500/15 text-gray-400",
    success: "bg-green-500/15 text-green-400",
    failed: "bg-red-500/15 text-red-400",
    running: "bg-green-500/15 text-green-400",
    exited: "bg-red-500/15 text-red-400",
    active: "bg-red-500/15 text-red-400",
    resolved: "bg-green-500/15 text-green-400",
    acknowledged: "bg-yellow-500/15 text-yellow-400",
    critical: "bg-red-500/15 text-red-400",
    warning: "bg-yellow-500/15 text-yellow-400",
    info: "bg-blue-500/15 text-blue-400",
    pending: "bg-gray-500/15 text-gray-400",
  };
  const cls = map[status] || "bg-gray-500/15 text-gray-400";
  return <span className={clsx("badge", cls)}>{status}</span>;
}

export function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    INFO: "bg-blue-500/15 text-blue-400",
    WARN: "bg-yellow-500/15 text-yellow-400",
    ERROR: "bg-red-500/15 text-red-400",
    DEBUG: "bg-gray-500/15 text-gray-400",
  };
  return (
    <span className={clsx("badge", map[level] || "bg-gray-500/15 text-gray-400")}>{level}</span>
  );
}
