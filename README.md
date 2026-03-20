<div align="center">

# AgentHub

### Intelligent Agent Orchestration Platform / AI 智能体编排平台

**Visual dashboard for OpenClaw — manage skills, agents, and projects through a modern web UI.**

**OpenClaw 可视化控制面板 — 通过 Web 界面管理技能、智能体和项目。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-5.0-purple.svg)]()
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-teal.svg)](https://openclaw.dev)
[![Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)]()

[English](#english) | [中文](#中文)

</div>

---

<a name="english"></a>

## What is AgentHub?

AgentHub is a web-based dashboard that connects to your local [OpenClaw](https://openclaw.dev) gateway. It provides a visual interface to browse skills, manage agents, create projects, and chat with AI agents — all through your browser.

### Key Features

| Feature | Description |
|---------|-------------|
| **OpenClaw Integration** | Real-time WebSocket connection + HTTP API proxy to your local gateway |
| **Skills Library** | Browse all OpenClaw skills with ready/missing status, 9 category filters |
| **Agent Management** | View, create, and assign agents to projects |
| **Project Workspace** | 6-stage pipeline with real-time AI chat powered by your models |
| **AI Chat** | Talk to PM-Agent via OpenClaw (e.g. GPT-5.4, Claude, Gemini) |
| **GitHub Trending** | Discover trending AI repos, extract skills, add to library |
| **Channel Monitoring** | Live status of Feishu, Slack, Telegram, Discord, WhatsApp channels |
| **Smart Routing** | Auto-fallback on rate limit, error, and cost optimization |
| **Zero Dependencies** | No npm install needed — stdlib-only Node.js server |
| **Bilingual UI** | Full English / 中文 interface switching |

---

## Quick Start

### Prerequisites

| Requirement | Version | Note |
|-------------|---------|------|
| Node.js     | 18+     | Required for the API proxy server |
| OpenClaw    | 2026.3+ | `npm install -g openclaw` then `openclaw setup` |

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/MarkGlobal98/AgentHub.git
cd AgentHub

# 2. Start the server (includes API proxy)
npm start
```

Open **http://localhost:3000** in your browser.

### One-Click Launch (Beginners)

**Windows:** Double-click `start.bat`

**macOS / Linux:**
```bash
chmod +x start.sh && ./start.sh
```

### Connect to OpenClaw

1. Start OpenClaw gateway: `openclaw start`
2. Open AgentHub → Settings → OpenClaw Gateway section
3. Enter Gateway URL: `ws://127.0.0.1:18789`
4. Enter Auth Token (find it with: `openclaw config get gateway.auth.token`)
5. Click **Save & connect**

The status indicator in the top bar turns green when connected.

---

## Features

### Dashboard

The main overview page showing real-time data from OpenClaw.

- **4 Stat Cards** — Total skills, Active agents, Projects, Success rate
- **Activity Log** — Real-time events: skill syncs, agent connections, health ticks
- **Projects Sidebar** — Quick access to all projects with progress bars and delete buttons
- **Onboarding Wizard** — 4-step guide that auto-completes as you set up:
  1. Installed (auto-detected)
  2. Connect OpenClaw (checks WebSocket)
  3. Create project (checks project count)
  4. Skills synced (checks skill count)

### Skills Library

Browse and manage all available skills from OpenClaw and external sources.

- **Source Filters** — All / GitHub / ClawHub / Trending
- **Category Filters** — Code Gen / Testing / DevOps / Data & DB / Security / Docs / AI & ML / Frontend
- **Skill Cards** — Name, source, description, tags, rating
- **Detail Modal** — Click any skill for full details with rating, source, and category breakdown
- **Real-time Counts** — Filter counters update dynamically

### Agents Library

View and create AI agents with skill composition.

- **Type Filters** — Development / DevOps / QA / Security / Data / Docs
- **Status Filters** — All / Active / Idle
- **Create Agent** — Custom name, description, type, and comma-separated skill list
- **Detail Modal** — View agent skills (clickable to jump to skill details), status, description
- **OpenClaw Sync** — Real agents loaded from `openclaw agents list`

### Trending

Discover popular AI agent repositories from GitHub.

- **GitHub API** — Fetches repos with `stars:>5000 + topic:ai-agents`, sorted by stars
- **Repository Cards** — Name, description, language (with color dot), star count
- **Extract Skills** — One-click skill extraction from any repo
- **Add to Library** — Add repo as a skill; button shows "In library" if already added
- **Auto-refresh** — Loads fresh data each time you visit the page

### Channels

Monitor message channels configured in OpenClaw.

- **Channel Cards** — Shows each configured channel (Feishu, Slack, Telegram, etc.) with status
- **Live Status** — Active / Configured / Disabled indicators from WebSocket health events
- **Event Log** — Real-time WebSocket event stream (health ticks, session messages)
- **Channel Details** — App ID, endpoint info, probe status

### My Projects

Create, manage, and delete projects.

- **Project Cards** — Name, description, phase, progress bar, percentage
- **Create Project** — Modal with name, description, priority (Normal / High / Critical)
- **Delete Project** — Confirmation dialog, cleans up workspace state
- **OpenClaw Sessions** — Real sessions auto-imported as projects

### Active Project (Workspace)

The main workspace for working on a selected project.

- **6-Stage Pipeline** — Analyze → Plan → Assign → Build → Review → Deliver
  - Stages auto-highlight based on project phase
  - Progress bar and percentage in header
- **AI Chat** — Send messages to PM-Agent, receive real AI responses from OpenClaw
- **Chat Modes**:
  - **Plan first** — Review agent plans before execution
  - **Auto execute** — Agents execute immediately
- **Right Panel**:
  - **Progress Ring** — Circular SVG visualization
  - **Agent Team** — Shows assigned agents with status badges
  - **Issues** — Project issues tracker
  - **Deliverables** — Generated deliverables list
- **Chat History** — Preserved per project; switching projects restores chat

### Settings

Configure models, routing, gateway, and preferences.

- **AI Models** — Synced from OpenClaw config (read-only). Shows model name, provider, primary/configured status. Click "Sync models" to refresh.
- **Smart Routing** (4 toggles):
  - Auto-fallback on rate limit
  - Auto-fallback on error
  - Cost optimization (cheap for simple, powerful for complex)
  - Session persistence (keep OAuth alive)
- **OpenClaw Gateway** — URL and token inputs, Test connection, Save & connect buttons
- **Skills Status** — Shows total/ready/missing counts, max concurrent tasks, compaction mode
- **Channels** — Shows configured channels with enabled/disabled status
- **System** — Max concurrent tasks, task timeout, language selector (English/中文)
- **Save Feedback** — Button turns green with "Saved!" confirmation for 1.5 seconds

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Focus global search |
| `Enter` (in chat) | Send message to PM-Agent |

---

## Architecture

```
Browser (localhost:3000)
  │
  ├── WebSocket ──→ OpenClaw Gateway (ws://127.0.0.1:18789)
  │                  └── Connection status, health events, channel data
  │
  └── HTTP ──→ server.js (Node.js proxy + CLI bridge)
               │
               ├── /api/skills    → openclaw skills list --json  (cached 5min)
               ├── /api/agents    → openclaw agents list --json  (cached 5min)
               ├── /api/config    → openclaw config get agents + channels
               ├── /api/agent     → openclaw agent --message "..." --agent main
               ├── /api/trending  → GitHub Search API (AI agent repos)
               └── /api/*         → proxy → OpenClaw /tools/invoke
```

### API Reference

| Endpoint | Method | Description | Cache |
|----------|--------|-------------|-------|
| `/api/skills` | GET | List all OpenClaw skills with status | 5 min |
| `/api/agents` | GET | List all OpenClaw agents | 5 min |
| `/api/config` | GET | Get agent defaults + channel configuration | No |
| `/api/agent` | POST | Send message to AI agent, returns response | No |
| `/api/trending` | GET | GitHub trending AI agent repositories | No |
| `/api/*` | * | Proxy to OpenClaw gateway `/tools/invoke` | No |

**POST `/api/agent`** request body:
```json
{
  "message": "Your message here",
  "agent": "main"
}
```

---

## Configuration

### OpenClaw Gateway

| Setting | Default | Description |
|---------|---------|-------------|
| Gateway URL | `ws://127.0.0.1:18789` | WebSocket URL for your local OpenClaw |
| Auth Token | — | Token from `openclaw config get gateway.auth.token` |

### Smart Routing

| Toggle | Default | Description |
|--------|---------|-------------|
| Auto-fallback on rate limit | ON | Switch to next model when rate limited |
| Auto-fallback on error | ON | Switch if API returns error or timeout |
| Cost optimization | ON | Use cheaper models for simple tasks |
| Session persistence | ON | Keep OAuth sessions alive, auto-refresh tokens |

### Language

| Option | Code |
|--------|------|
| English | `en` |
| 中文 | `zh` |

Language preference is persisted in localStorage and applies to all UI text.

---

## FAQ

**Q: Skills show 0 on first load, then appear after a few seconds?**
A: The OpenClaw CLI takes ~30 seconds on first cold start to load plugins. The server pre-warms the cache on startup and retries automatically. After the first load, skills are served from cache instantly.

**Q: Chat shows "No response" or "(fallback)"?**
A: Make sure OpenClaw gateway is running (`openclaw start`). The AI chat routes through `openclaw agent --agent main`, which requires an active gateway with a configured model.

**Q: How do I add or change AI models?**
A: Models are managed by OpenClaw. Run `openclaw configure` in your terminal to add/change models, then click "Sync models" in AgentHub Settings.

**Q: Can I use AgentHub without OpenClaw?**
A: Yes, in limited mode. You can browse the UI, create projects locally, and use the trending page. Skills, agents, AI chat, and channel monitoring require an OpenClaw connection.

**Q: Where is my data stored?**
A: Custom projects, user-added skills, and settings are stored in your browser's localStorage (`agenthub_state`). OpenClaw data (real skills, agents, models) is fetched fresh on each load.

---

## Project Structure

```
AgentHub/
├── index.html      # Main application (single-file SPA, ~1600 lines)
├── server.js       # Node.js server: static files + API proxy + CLI bridge
├── package.json    # npm scripts (start, dev)
├── start.bat       # Windows one-click launcher
├── start.sh        # macOS/Linux one-click launcher
├── .gitignore      # Ignores node_modules, .env, .claude, logs
├── LICENSE         # MIT License
└── README.md       # This file
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML / CSS / JS — zero dependencies, zero build step |
| Server | Node.js stdlib only — no npm packages required |
| Fonts | DM Sans + JetBrains Mono via Google Fonts CDN |
| Design | Dark theme with purple accent, fully responsive |
| Data | OpenClaw CLI + Gateway API + GitHub API |
| Storage | Browser localStorage for user preferences |

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<a name="中文"></a>

## 什么是 AgentHub？

AgentHub 是一个连接本地 [OpenClaw](https://openclaw.dev) 网关的 Web 控制面板。通过浏览器可视化管理技能、智能体、项目，并与 AI 智能体实时对话。

### 核心功能

| 功能 | 说明 |
|------|------|
| **OpenClaw 集成** | WebSocket 实时连接 + HTTP API 代理到本地网关 |
| **技能库** | 浏览所有 OpenClaw 技能，显示就绪/缺少依赖状态，9 大分类筛选 |
| **智能体管理** | 查看、创建智能体，分配到项目 |
| **项目工作台** | 6 阶段流水线 + AI 实时对话，由你的模型驱动 |
| **AI 对话** | 与 PM-Agent 对话（支持 GPT-5.4、Claude、Gemini 等） |
| **GitHub 热门** | 发现热门 AI 仓库，提取技能，一键添加 |
| **频道监控** | 飞书、Slack、Telegram、Discord、WhatsApp 实时状态 |
| **智能路由** | 限流/错误自动切换，成本优化 |
| **零依赖** | 无需 npm install — 纯 Node.js 标准库 |
| **双语界面** | 完整的 English / 中文 界面切换 |

---

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | API 代理服务器必须 |
| OpenClaw | 2026.3+ | `npm install -g openclaw` 然后 `openclaw setup` |

### 安装和运行

```bash
# 1. 克隆仓库
git clone https://github.com/MarkGlobal98/AgentHub.git
cd AgentHub

# 2. 启动服务器（包含 API 代理）
npm start
```

访问 **http://localhost:3000** 即可使用。

### 一键启动（新手推荐）

**Windows 用户：** 双击 `start.bat`

**macOS / Linux 用户：**
```bash
chmod +x start.sh && ./start.sh
```

### 连接 OpenClaw

1. 启动 OpenClaw 网关：`openclaw start`
2. 打开 AgentHub → 设置 → OpenClaw Gateway 区域
3. 输入网关地址：`ws://127.0.0.1:18789`
4. 输入 Auth Token（获取方式：`openclaw config get gateway.auth.token`）
5. 点击 **Save & connect**

顶栏状态指示器变绿表示连接成功。

---

## 功能详情

### 仪表盘（Dashboard）

主页概览，展示来自 OpenClaw 的实时数据。

- **4 张统计卡片** — 总技能数、活跃智能体、项目数、成功率
- **活动日志** — 实时事件：技能同步、智能体连接、健康心跳
- **项目侧栏** — 快速访问所有项目，含进度条和删除按钮
- **引导向导** — 4 步设置指南，完成后自动隐藏：
  1. 已安装（自动检测）
  2. 连接 OpenClaw（检查 WebSocket）
  3. 创建项目（检查项目数量）
  4. 技能已同步（检查技能数量）

### 技能库（Skills Library）

浏览和管理所有可用技能。

- **来源筛选** — 全部 / GitHub / ClawHub / 热门
- **分类筛选** — 代码生成 / 测试 / 运维 / 数据库 / 安全 / 文档 / AI与ML / 前端
- **技能卡片** — 名称、来源、描述、标签、评分
- **详情弹窗** — 点击查看完整信息：评分、来源、分类
- **实时计数** — 筛选计数器动态更新

### 智能体库（Agents Library）

查看和创建 AI 智能体。

- **类型筛选** — 开发 / 运维 / QA / 安全 / 数据 / 文档
- **状态筛选** — 全部 / 活跃 / 空闲
- **创建智能体** — 自定义名称、描述、类型、技能列表
- **详情弹窗** — 查看技能（可点击跳转）、状态、描述
- **OpenClaw 同步** — 自动加载 `openclaw agents list` 的真实数据

### 热门趋势（Trending）

发现 GitHub 上热门的 AI 智能体项目。

- **GitHub API** — 获取 stars >5000 的 AI 智能体仓库
- **仓库卡片** — 名称、描述、语言（带颜色标记）、Star 数
- **提取技能** — 一键从仓库提取技能
- **添加到库** — 添加后按钮变为「已在库中」，刷新不重置
- **自动加载** — 每次访问页面自动获取最新数据

### 频道（Channels）

监控 OpenClaw 中配置的消息频道。

- **频道卡片** — 显示每个已配置频道（飞书、Slack、Telegram 等）及状态
- **实时状态** — 活跃 / 已配置 / 已禁用，来自 WebSocket 健康事件
- **事件日志** — WebSocket 实时事件流（健康心跳、会话消息）
- **频道详情** — App ID、端点信息、探针状态

### 我的项目（My Projects）

创建、管理和删除项目。

- **项目卡片** — 名称、描述、阶段、进度条、百分比
- **创建项目** — 弹窗设置名称、描述、优先级（普通 / 高 / 紧急）
- **删除项目** — 确认对话框，自动清理工作台状态
- **OpenClaw 会话** — 真实会话自动导入为项目

### 活跃项目（Workspace）

选中项目后的工作台。

- **6 阶段流水线** — 分析 → 规划 → 分配 → 构建 → 审查 → 交付
  - 阶段根据项目进度自动高亮
  - 头部显示进度条和百分比
- **AI 对话** — 向 PM-Agent 发送消息，接收 OpenClaw 真实 AI 回复
- **对话模式**：
  - **先规划** — 执行前审查智能体计划
  - **自动执行** — 智能体立即执行
- **右侧面板**：
  - **进度环** — 圆形 SVG 可视化
  - **智能体团队** — 显示已分配智能体及状态
  - **问题** — 项目问题追踪
  - **交付物** — 生成的交付物列表
- **聊天记录** — 按项目保存，切换项目恢复聊天

### 设置（Settings）

配置模型、路由、网关和偏好。

- **AI 模型** — 从 OpenClaw 同步（只读）。显示模型名、提供商、主模型标识。点击「Sync models」刷新。
- **智能路由**（4 个开关）：
  - 限流自动切换
  - 错误自动切换
  - 成本优化（简单用便宜模型，复杂用强模型）
  - 会话持久化（OAuth 保活，自动刷新 Token）
- **OpenClaw 网关** — URL 和 Token 输入框，测试连接，保存并连接
- **技能状态** — 总数/就绪/缺失、最大并发任务数、压缩模式
- **频道** — 已配置频道及启用/禁用状态
- **系统** — 最大并发任务、超时时间、语言选择（English/中文）
- **保存反馈** — 按钮变绿显示「Saved!」确认 1.5 秒

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` / `Cmd+K` | 聚焦全局搜索 |
| `Enter`（聊天框中） | 发送消息给 PM-Agent |

---

## 系统架构

```
浏览器 (localhost:3000)
  │
  ├── WebSocket ──→ OpenClaw 网关 (ws://127.0.0.1:18789)
  │                  └── 连接状态、健康事件、频道数据
  │
  └── HTTP ──→ server.js (Node.js 代理 + CLI 桥接)
               │
               ├── /api/skills    → openclaw skills list --json  (缓存 5 分钟)
               ├── /api/agents    → openclaw agents list --json  (缓存 5 分钟)
               ├── /api/config    → openclaw config get agents + channels
               ├── /api/agent     → openclaw agent --message "..." --agent main
               ├── /api/trending  → GitHub Search API (AI 智能体仓库)
               └── /api/*         → 代理到 OpenClaw /tools/invoke
```

### API 参考

| 端点 | 方法 | 说明 | 缓存 |
|------|------|------|------|
| `/api/skills` | GET | 列出所有 OpenClaw 技能及状态 | 5 分钟 |
| `/api/agents` | GET | 列出所有 OpenClaw 智能体 | 5 分钟 |
| `/api/config` | GET | 获取智能体默认配置 + 频道配置 | 无 |
| `/api/agent` | POST | 发送消息给 AI 智能体，返回回复 | 无 |
| `/api/trending` | GET | GitHub 热门 AI 智能体仓库 | 无 |
| `/api/*` | * | 代理到 OpenClaw 网关 `/tools/invoke` | 无 |

**POST `/api/agent`** 请求体：
```json
{
  "message": "你的消息",
  "agent": "main"
}
```

---

## 配置参考

### OpenClaw 网关

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| 网关地址 | `ws://127.0.0.1:18789` | 本地 OpenClaw WebSocket 地址 |
| Auth Token | — | 通过 `openclaw config get gateway.auth.token` 获取 |

### 智能路由

| 开关 | 默认 | 说明 |
|------|------|------|
| 限流自动切换 | 开启 | 遇到限流时自动切换到下一个模型 |
| 错误自动切换 | 开启 | API 返回错误或超时时自动切换 |
| 成本优化 | 开启 | 简单任务用便宜模型，复杂任务用强模型 |
| 会话持久化 | 开启 | 保持 OAuth 会话，自动刷新 Token |

### 语言

| 选项 | 代码 |
|------|------|
| English | `en` |
| 中文 | `zh` |

语言偏好保存在 localStorage 中，切换后所有界面文本即时更新。

---

## 常见问题

**Q：首次加载技能显示 0，过几秒才出现？**
A：OpenClaw CLI 首次冷启动需要约 30 秒加载插件。服务器启动时会预热缓存并自动重试。首次加载后，技能数据从缓存秒级返回。

**Q：聊天显示「No response」或「(fallback)」？**
A：确保 OpenClaw 网关正在运行（`openclaw start`）。AI 对话通过 `openclaw agent --agent main` 路由，需要网关启动且已配置模型。

**Q：如何添加或更换 AI 模型？**
A：模型由 OpenClaw 管理。在终端运行 `openclaw configure` 添加/更换模型，然后在 AgentHub 设置中点击「Sync models」。

**Q：可以不连接 OpenClaw 使用吗？**
A：可以，但功能有限。你可以浏览界面、本地创建项目、使用热门趋势页面。技能、智能体、AI 对话、频道监控需要 OpenClaw 连接。

**Q：数据存储在哪里？**
A：自定义项目、用户添加的技能和设置保存在浏览器 localStorage（`agenthub_state`）。OpenClaw 数据（真实技能、智能体、模型）每次加载时从 API 获取。

---

## 项目结构

```
AgentHub/
├── index.html      # 主应用（单文件 SPA，约 1600 行）
├── server.js       # Node.js 服务器：静态文件 + API 代理 + CLI 桥接
├── package.json    # npm 脚本（start, dev）
├── start.bat       # Windows 一键启动脚本
├── start.sh        # macOS/Linux 一键启动脚本
├── .gitignore      # 忽略 node_modules、.env、.claude、日志
├── LICENSE         # MIT 开源协议
└── README.md       # 本文件
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML / CSS / JS — 零依赖，零构建 |
| 服务器 | Node.js 标准库 — 无需 npm 包 |
| 字体 | DM Sans + JetBrains Mono（Google Fonts CDN） |
| 设计 | 暗色主题 + 紫色强调色，完全响应式 |
| 数据 | OpenClaw CLI + Gateway API + GitHub API |
| 存储 | 浏览器 localStorage 保存用户偏好 |

## 参与贡献

1. Fork 本仓库
2. 创建特性分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送分支（`git push origin feature/amazing-feature`）
5. 发起 Pull Request

## 开源协议

[MIT](LICENSE) — 自由使用、修改和分发。

作者：Mark Tang

贡献：杭州维舟科技有限公司（WayJoy.Tec.Global@gmail.com）
