<div align="center">

# AgentHub

### Intelligent Agent Orchestration Platform / AI 智能体编排平台

**One prompt, multiple agents, fully automated software delivery.**

**一句话需求，多智能体协作，全自动软件交付。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-5.0-purple.svg)]()

[English](#english) | [中文](#中文)

</div>

---

<a name="english"></a>

## What is AgentHub?

AgentHub is an AI agent orchestration platform that decomposes your project requirements into tasks, assigns them to specialized AI agents (Architect, Backend, Frontend, Test, DevOps), and delivers working code — all managed by a PM-Agent.

**Key features:**

- **Multi-model support** — Claude, GPT, Gemini, Deepseek, and more. API key or OAuth login.
- **Smart routing** — Auto-fallback between models on rate limit or error.
- **Agent library** — 180+ pre-built agents with 2,800+ skills.
- **Skill crawler** — Auto-discovers skills from GitHub, ClawHub, and trending repos.
- **Workspace** — Real-time project tracking with agent activity log, issue detection, and chat.
- **Zero config** — Built-in tools (Scrapling, ChromaDB, Redis, PostgreSQL, Nginx) require no setup.

## Quick Start

### Option 1: One-click (Beginners)

**Windows:**
```
Double-click start.bat
```

**macOS / Linux:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: npm

```bash
# 1. Clone the repo
git clone https://github.com/MarkGlobal98/AgentHub.git

# 2. Enter the directory
cd AgentHub

# 3. Start the server
npm start
```

### Option 3: Direct open

Just open `index.html` in your browser. No server needed for basic preview.

> After starting, open **http://localhost:3000** in your browser.

## Prerequisites

| Requirement | Version | Required? |
|-------------|---------|-----------|
| Node.js     | 18+     | For `npm start` and one-click scripts |
| Browser     | Modern (Chrome, Edge, Firefox, Safari) | Yes |

> **Note:** If you just want to preview, you can open `index.html` directly — no Node.js needed.

## Features

### Dashboard
Overview of all skills, agents, projects, and activity feed.

### Multi-Model Settings
- Add models via **API key** or **OAuth account login**
- Supported: Claude (Sonnet/Opus), GPT-4o, Gemini 2.5 Pro, Deepseek V3, Groq, Ollama (local), Azure OpenAI, Mistral, and custom endpoints
- **Smart routing**: auto-fallback on rate limit, error, or cost optimization

### Skill Library
- 2,800+ skills across 8 categories: Code Gen, Testing, DevOps, Data/DB, Security, Docs, AI/ML, Frontend
- Filter by source (GitHub, ClawHub, Trending) and category
- Click any skill for detail view

### Agent Library
- 180+ agents organized by type (Development, DevOps, QA, Security, Data, Docs)
- Create custom agents with skill composition
- Real-time status tracking (Active / Idle)

### Workspace
- **Pipeline view**: Analyze → Plan → Assign → Build → Review → Deliver
- **Agent activity log**: Real-time messages between agents
- **Issue detection**: Auto-detected bugs with one-click fix
- **Chat**: Talk to PM-Agent to reprioritize, add features, or ask for status
- **Modes**: "Plan first" (review before execution) or "Auto execute"

### Skill Crawler
- GitHub repo scanner for SKILL.md files
- GitHub trending daily sync
- ClawHub marketplace integration
- Upload review queue

### Trending
- GitHub daily trending repos with star counts
- One-click "Extract skills" and "Add to library"

## Project Structure

```
AgentHub/
├── index.html      # Main application (single-file SPA)
├── package.json    # npm scripts and metadata
├── start.bat       # Windows one-click launcher
├── start.sh        # macOS/Linux one-click launcher
├── LICENSE         # MIT License
└── README.md       # This file
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (zero dependencies, zero build step)
- **Fonts**: DM Sans + JetBrains Mono (Google Fonts)
- **Architecture**: Single-page application with client-side routing
- **Design**: Dark theme with purple accent, fully responsive

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<a name="中文"></a>

## 什么是 AgentHub？

AgentHub 是一个 AI 智能体编排平台。你只需要用一句话描述项目需求，AgentHub 会自动将需求分解为任务，分配给专业的 AI 智能体（架构师、后端、前端、测试、运维），最终交付可运行的代码 —— 全程由 PM-Agent 统一管理。

**核心功能：**

- **多模型支持** — Claude、GPT、Gemini、Deepseek 等，支持 API Key 和 OAuth 账号登录
- **智能路由** — 遇到限流或错误自动切换备用模型
- **智能体库** — 180+ 预制智能体，2800+ 技能
- **技能爬虫** — 自动从 GitHub、ClawHub、热门仓库发现新技能
- **工作台** — 实时项目追踪、智能体活动日志、问题检测、对话交互
- **零配置** — 内置工具（Scrapling、ChromaDB、Redis、PostgreSQL、Nginx）开箱即用

## 快速开始

### 方式一：一键启动（推荐新手）

**Windows 用户：**
```
双击 start.bat 即可
```

**macOS / Linux 用户：**
```bash
chmod +x start.sh
./start.sh
```

### 方式二：npm 启动

```bash
# 1. 克隆仓库
git clone https://github.com/MarkGlobal98/AgentHub.git

# 2. 进入目录
cd AgentHub

# 3. 启动服务
npm start
```

### 方式三：直接打开

双击 `index.html` 用浏览器打开即可预览，无需任何安装。

> 启动后访问 **http://localhost:3000** 即可使用。

## 环境要求

| 依赖 | 版本 | 是否必须 |
|------|------|----------|
| Node.js | 18+ | 使用 `npm start` 或一键脚本时需要 |
| 浏览器 | 现代浏览器（Chrome、Edge、Firefox、Safari） | 是 |

> **提示：** 如果只是预览，直接打开 `index.html` 即可，不需要安装 Node.js。

## 功能一览

### 仪表盘
总览所有技能、智能体、项目和活动动态。

### 多模型配置
- 支持 **API Key** 和 **OAuth 账号登录** 两种方式添加模型
- 已支持：Claude (Sonnet/Opus)、GPT-4o、Gemini 2.5 Pro、Deepseek V3、Groq、Ollama（本地）、Azure OpenAI、Mistral、自定义端点
- **智能路由**：限流自动切换、错误自动切换、成本优化

### 技能库
- 2800+ 技能，覆盖 8 大分类：代码生成、测试、运维、数据/数据库、安全、文档、AI/ML、前端
- 按来源（GitHub、ClawHub、热门）和分类筛选
- 点击技能卡片查看详情

### 智能体库
- 180+ 智能体，按类型（开发、运维、QA、安全、数据、文档）分类
- 支持创建自定义智能体并组合技能
- 实时状态追踪（活跃 / 空闲）

### 工作台
- **流水线视图**：分析 → 规划 → 分配 → 构建 → 审查 → 交付
- **活动日志**：实时查看智能体之间的协作消息
- **问题检测**：自动发现 Bug，一键修复
- **对话**：与 PM-Agent 对话，调整优先级、添加功能、查询进度
- **模式切换**：「先规划」（执行前审查）或「自动执行」

### 技能爬虫
- GitHub 仓库扫描（查找 SKILL.md 文件）
- GitHub 每日热门仓库同步
- ClawHub 市场对接
- 上传审核队列

### 热门趋势
- GitHub 每日热门仓库，含 Star 数和增长趋势
- 一键「提取技能」和「添加到库」

## 项目结构

```
AgentHub/
├── index.html      # 主应用（单文件 SPA）
├── package.json    # npm 脚本和项目信息
├── start.bat       # Windows 一键启动脚本
├── start.sh        # macOS/Linux 一键启动脚本
├── LICENSE         # MIT 开源协议
└── README.md       # 本文件
```

## 技术栈

- **前端**：原生 HTML/CSS/JS（零依赖，零构建步骤）
- **字体**：DM Sans + JetBrains Mono（Google Fonts）
- **架构**：单页应用，客户端路由
- **设计**：暗色主题 + 紫色强调色，完全响应式

## 参与贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 开源协议

[MIT](LICENSE) - 自由使用、修改和分发。
作者：Mark Tang
贡献：杭州维舟科技有限公司（WayJoy.Tec.Global@gmail.com）
