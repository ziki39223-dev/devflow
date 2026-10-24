# DevFlow — DevOps 监控与管理平台

> 一个轻量级、全栈贯通的 DevOps 监控与管理平台，覆盖服务健康管理、部署流水线、日志中心、告警系统、Docker 容器实时监控，并基于 WebSocket 实现系统指标实时推送。

---

## ✨ 功能特性

| 模块 | 说明 |
|------|------|
| **仪表盘** | 全局指标卡片（服务/部署/告警/响应时间）、服务资源使用率图表、最近日志与部署活动流 |
| **服务管理** | 服务注册、健康检查、CPU/内存/响应时间监控、启停与删除 |
| **部署流水线** | 部署记录、成功率统计、近 7 天趋势图、一键回滚 |
| **日志中心** | 集中式日志、按级别（INFO/WARN/ERROR/DEBUG）与数量过滤 |
| **告警管理** | 告警确认（acknowledge）、解决（resolve）、删除，支持严重/警告/信息分级 |
| **容器监控** | Docker 容器状态、资源占用、**WebSocket 实时推送**主机 CPU/内存/磁盘/网络指标，容器启停/重启 |

---

## 🛠 技术栈

**后端**
- Python 3.12 + FastAPI（异步）
- SQLAlchemy 2.0（Async） + SQLite
- Pydantic v2 数据校验
- WebSocket（实时指标推送）
- Docker SDK（容器监控）
- psutil（主机资源采集）

**前端**
- Next.js 14（App Router）+ TypeScript
- TailwindCSS（暗色主题）
- Recharts（数据可视化）
- lucide-react（图标）

**部署**
- Docker / Docker Compose 一键编排
- Nginx 反向代理（生产可选）

---

## 📁 项目结构

```
devflow/
├── backend/                      # FastAPI 后端
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py         # 配置（pydantic-settings）
│   │   │   └── database.py       # 异步引擎、Session、种子数据
│   │   ├── models/
│   │   │   └── models.py         # ORM 模型（Service/Deployment/Log/Alert）
│   │   ├── schemas/
│   │   │   └── schemas.py        # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── services.py       # 服务管理
│   │   │   ├── deployments.py    # 部署流水线
│   │   │   ├── logs.py           # 日志中心
│   │   │   ├── alerts.py         # 告警管理
│   │   │   ├── containers.py     # Docker 容器
│   │   │   ├── dashboard.py      # 仪表盘聚合统计
│   │   │   └── websocket.py      # WebSocket 实时推送
│   │   ├── services/
│   │   │   ├── docker_service.py # Docker + psutil 采集
│   │   │   └── ws_manager.py     # 连接管理与广播
│   │   └── main.py               # 应用入口、CORS、生命周期
│   ├── requirements.txt
│   ├── Dockerfile
│   └── devflow.db                # SQLite 数据库（运行时生成）
├── frontend/                     # Next.js 前端
│   ├── app/
│   │   ├── page.tsx              # 仪表盘
│   │   ├── services/page.tsx     # 服务管理
│   │   ├── deployments/page.tsx  # 部署流水线
│   │   ├── logs/page.tsx         # 日志中心
│   │   ├── alerts/page.tsx       # 告警管理
│   │   ├── containers/page.tsx   # 容器监控（WebSocket）
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/               # Sidebar, StatCard 等
│   ├── lib/api.ts                # API 客户端
│   ├── package.json
│   ├── next.config.js            # API 反向代理
│   └── tailwind.config.js
├── docker-compose.yml           # 一键编排
├── .env.example                  # 环境变量示例
└── README.md
```

---

## 🚀 快速开始

### 方式一：本地运行（推荐开发）

**1. 启动后端**
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
后端文档： http://localhost:8000/docs

**2. 启动前端**
```bash
cd frontend
npm install
npm run dev
```
访问： http://localhost:3000

### 方式二：Docker Compose 一键部署
```bash
docker compose up --build
```
- 前端： http://localhost:3000
- 后端： http://localhost:8000

> 环境变量模板见根目录 `.env.example`（后端复制到 `backend/.env`，前端复制到 `frontend/.env.local`）。

---

## 🧪 测试

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests/ -v
```

冒烟测试覆盖：根路由元信息、健康检查、dashboard 聚合统计字段完整性、服务列表种子数据、未知路由 404。测试使用独立的临时数据库，不会污染本地 `devflow.db`。

---

## 📡 API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘全局统计 |
| GET | `/api/dashboard/service-metrics` | 服务资源指标 |
| GET | `/api/services` | 服务列表 |
| POST | `/api/services` | 新增服务 |
| POST | `/api/services/{id}/health-check` | 执行健康检查 |
| GET | `/api/deployments` | 部署列表 |
| GET | `/api/deployments/stats` | 部署统计与趋势 |
| POST | `/api/deployments/{id}/rollback` | 回滚部署 |
| GET | `/api/logs` | 日志列表（支持 level 过滤） |
| GET | `/api/alerts` | 告警列表 |
| PATCH | `/api/alerts/{id}` | 更新告警状态 |
| GET | `/api/containers` | 容器列表与资源 |
| GET | `/api/containers/system-metrics` | 主机资源指标 |
| WS | `/ws` | 实时指标推送 |

完整接口与请求示例见 http://localhost:8000/docs（Swagger UI，开箱即用）。

---

## 🎯 项目亮点（简历导向）

- **全栈架构**：FastAPI 异步后端 + Next.js 14 前端，前后端职责清晰
- **实时通信**：基于 WebSocket 的单向指标流，前端无需轮询即可实时刷新
- **数据库设计**：4 张关联表 + 异步 ORM，含种子数据，开箱即用
- **容器化监控**：集成 Docker SDK 与 psutil，展示运维系统真实能力
- **数据可视化**：Recharts 多维图表（柱状图、面积图、趋势图）
- **可观测性**：结构化日志、健康检查、CORS、生命周期管理
- **一键部署**：Docker Compose 编排前后端，贴近生产实践

---

*DevFlow · 简历级 DevOps 平台示例项目*
