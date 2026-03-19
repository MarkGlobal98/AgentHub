<div align="center">

# AgentHub

### Intelligent Agent Orchestration Platform / AI 智能体编排平台

**Visual dashboard for OpenClaw — manage skills, agents, and projects through a modern web UI.**

**OpenClaw 可视化控制面板 — 通过 Web 界面管理技能、智能体和项目。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-5.0-purple.svg)]()

[English](#english) | [中文](#中文)

</div>

---

<a name="english"></a>

## What is AgentHub?

AgentHub is a web-based dashboard that connects to your local [OpenClaw](https://openclaw.dev) gateway. It provides a visual interface to browse skills, manage agents, create projects, and chat with AI agents — all through your browser.

**Key features:**

- **OpenClaw integration** — Real-time WebSocket connection + HTTP API proxy to your local gateway
- **Skills library** — Browse all OpenClaw skills with status (ready / missing dependencies)
- **Agent management** — View and create agents, assign to projects
- **Project workspace** — Pipeline view (Analyze → Plan → Assign → Build → Review → Deliver) with real-time AI chat
- **AI chat** — Talk to PM-Agent powered by your OpenClaw models (e.g., GPT-5.4)
- **GitHub trending** — Discover trending AI agent repos and add skills to your library
- **Channel monitoring** — View configured channels (Feishu, Slack, Telegram, etc.)
- **Smart routing** — Auto-fallback toggles for rate limits, errors, and cost optimization

## Quick Start

### Prerequisites

| Requirement | Version | Note |
|-------------|---------|------|
| Node.js     | 18+     | Required |
| OpenClaw    | 2026.3+ | `npm install -g openclaw` then `openclaw setup` |

### Install & Run

```bash
# 1. Clone
git clone https://github.com/MarkGlobal98/AgentHub.git
cd AgentHub

# 2. Start (includes API proxy server)
npm start
```

Open **http://localhost:3000** in your browser.

### One-click (Beginners)

**Windows:** Double-click `start.bat`

**macOS / Linux:**
```bash
chmod +x start.sh && ./start.sh
```

### Configure OpenClaw

1. Make sure OpenClaw is running: `openclaw start`
2. In AgentHub Settings, enter your Gateway URL (`ws://127.0.0.1:18789`) and Auth Token
3. Click "Save & connect"

> Your OpenClaw token can be found with: `openclaw config get gateway.auth.token`

## Architecture

```
Browser (localhost:3000)
  ├── WebSocket → OpenClaw Gateway (ws://127.0.0.1:18789)
  │   └── Connection status, health events, channel data
  └── HTTP → server.js proxy
      ├── /api/skills   → openclaw skills list --json (cached 5min)
      ├── /api/agents   → openclaw agents list --json (cached 5min)
      ├── /api/config   → openclaw config get agents/channels
      ├── /api/agent    → openclaw agent --message "..." --agent main
      ├── /api/trending → GitHub Search API (AI agent repos)
      └── /api/*        → proxy to OpenClaw gateway /tools/invoke
```

## Project Structure

```
AgentHub/
├── index.html      # Main application (single-file SPA)
├── server.js       # Node.js server with API proxy + CLI bridge
├── package.json    # npm scripts and metadata
├── start.bat       # Windows one-click launcher
├── start.sh        # macOS/Linux one-click launcher
├── LICENSE         # MIT License
└── README.md       # This file
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero dependencies, zero build step)
- **Server**: Node.js (stdlib only — no npm dependencies)
- **Fonts**: DM Sans + JetBrains Mono (Google Fonts CDN)
- **Design**: Dark theme, purple accent, responsive layout

---

<a name="中文"></a>

## 什么是 AgentHub？

AgentHub 是一个连接本地 [OpenClaw](https://openclaw.dev) 网关的 Web 控制面板。通过浏览器可视化管理技能、智能体、项目，并与 AI 智能体实时对话。

**核心功能：**

- **OpenClaw 集成** — WebSocket 实时连接 + HTTP API 代理
- **技能库** — 浏览所有 OpenClaw 技能，显示状态（就绪 / 缺少依赖）
- **智能体管理** — 查看、创建智能体，分配到项目
- **项目工作台** — 流水线视图（分析 → 规划 → 分配 → 构建 → 审查 → 交付）+ AI 实时对话
- **AI 对话** — 与 PM-Agent 对话，由 OpenClaw 模型（如 GPT-5.4）驱动
- **GitHub 热门** — 发现热门 AI 智能体仓库，一键添加技能
- **频道监控** — 查看已配置的消息频道（飞书、Slack、Telegram 等）

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 必须 |
| OpenClaw | 2026.3+ | `npm install -g openclaw` 然后 `openclaw setup` |

### 安装和运行

```bash
# 1. 克隆仓库
git clone https://github.com/MarkGlobal98/AgentHub.git
cd AgentHub

# 2. 启动（包含 API 代理服务器）
npm start
```

访问 **http://localhost:3000** 即可使用。

### 一键启动

**Windows 用户：** 双击 `start.bat`

**macOS / Linux 用户：**
```bash
chmod +x start.sh && ./start.sh
```

### 配置 OpenClaw

1. 确保 OpenClaw 正在运行：`openclaw start`
2. 在 AgentHub 设置页面输入网关地址（`ws://127.0.0.1:18789`）和 Auth Token
3. 点击「Save & connect」

> Token 可通过命令获取：`openclaw config get gateway.auth.token`

## 开源协议

[MIT](LICENSE) - 自由使用、修改和分发。

作者：Mark Tang

贡献：杭州维舟科技有限公司（WayJoy.Tec.Global@gmail.com）
