# Utopia Uptime Page

Languages: [English](README_en.md) | **简体中文** | [繁體中文](README_zh_TW.md) | [日本語](README_ja.md)

一个网站可用性监控面板的展示前端，支持 [Uptime Robot](https://uptimerobot.com/) 与 [Uptime Kuma](https://uptimekuma.org/)，纯静态部署。  
你可以访问 [DEMO](https://status.utopiaxc.cn/)

## 1. 功能
- **多数据源聚合**：支持将多个 Uptime Robot 和 Uptime Kuma 的监控项聚合在同一个面板中展示。
- **可视化配置**：内置独立的配置生成器 (`config-generator.html`)，点点鼠标即可生成配置文件，彻底告别手写代码。
- **Kuma 多功能数据库脚本**：附带了一个可选的 Python FastAPI 后端 (`Utopia Kuma Server`)，直连 Kuma 数据库，彻底解决 Kuma 公开 API 的跨域问题以及仅支持 100 条心跳记录的限制。
- **i18n 支持**：原生提供对英文、简体中文、繁体中文和日语的支持。

![Utopia Uptime Page Dashboard](./assets/demo.png)

## 2. 部署

### 2.1 前端部署
1. 从 [Releases](https://github.com/UtopiaXC/UtopiaUptimePage/releases) 页面下载最新编译好的发行版。
2. 解压后将 `/dist` 目录托管到任何静态服务器（Nginx, Vercel, GitHub Pages 等）。

### 2.2 config 生成与设置
1. 访问你的网址加上 `/config-generator.html`。
2. 按照界面提示生成配置。
3. 保存生成的结果为 `config.js`，并放入网站根目录。

### 2.3 Utopia Kuma Server（可选）
此可选服务端用于作为 Uptime Kuma 实例的桥梁，可解决其公开 API 的跨域 (CORS) 问题。当运行在数据库直连模式下，它能直接读取 Kuma 的数据库，突破默认最多 100 条心跳数据的限制，让前端可以展示更多天数的历史可用性数据。

#### 2.3.1 直接运行
请确保首先复制 `.env.example` 为 `.env` 并自行配置环境变量。
```bash
cd server
pip install -r requirements.txt
python server.py
```

#### 2.3.2 docker 运行
无需本地编译，直接拉取预构建镜像并挂载你的数据目录即可运行：
```bash
docker run -d \
  --name utopia-server \
  -p 55520:55520 \
  -v /你的/uptime-kuma/data/目录:/data \
  utopiaxc1025/utopia-kuma-server
```

## 3. 鸣谢
感谢 [Uptime Robot](https://uptimerobot.com/) 与 [Uptime Kuma](https://uptimekuma.org/) 提供的优秀监控服务。
另外，特别感谢 [Kuma Mieru](https://github.com/alice39s/kuma-mieru) 项目，我们在 UI 与理念上部分借鉴了该项目。

## 4. 免责
本项目遵循 MIT 开源协议。
本项目使用 Antigravity 与 Claude Opus、Gemini Pro 进行 "vibe" 开发。

## 5. 捐赠
请不要在任何渠道以任何方式为本项目付出金钱。
如果您想捐助本项目，您可以向慈善组织或开放源代码促进会（开源组织，OSI）捐款，我们会感激不尽。

---
*本文档由 Gemini 3.1 Pro 生成。*
