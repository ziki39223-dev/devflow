import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevFlow — DevOps 监控管理平台",
  description: "轻量级 DevOps 监控与管理平台：服务健康、部署流水线、日志中心、告警与容器监控",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
