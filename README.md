# GitHub 图床

> 基于 GitHub 的高效、稳定图片托管服务

![GitHub Stars](https://img.shields.io/github/stars/kobayashi-007/github-image-host?style=flat-square)
![GitHub License](https://img.shields.io/github/license/kobayashi-007/github-image-host?style=flat-square)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green?style=flat-square)

---

## 📖 项目简介

GitHub 图床是一个基于 React + Express/Cloudflare 的图片托管服务，利用 GitHub 作为图片存储后端，提供高效、稳定的图片上传和管理功能。

**核心优势**：
- ✅ 利用 GitHub 无限免费存储
- ✅ 支持 CDN 加速（jsDelivr）
- ✅ 大厂风格 UI 设计
- ✅ 支持自定义域名
- ✅ 支持多种部署方式

---

## ✨ 功能特点

### 🎯 核心功能
- [x] 图片上传到 GitHub
- [x] 文件管理器（支持文件夹浏览）
- [x] 图片预览和管理
- [x] 复制图片链接
- [x] 下载图片
- [x] 删除图片
- [x] 登录认证

### 🎨 UI 特性
- [x] 大厂风格设计
- [x] 亚克力透明效果
- [x] 视频/图片背景支持
- [x] 响应式布局
- [x] 优雅的动画效果

### ⚙️ 配置管理
- [x] 用户名/密码设置
- [x] GitHub Token 管理
- [x] 仓库配置
- [x] 个性化设置（标题、背景、透明度等）
- [x] 自定义域名支持

---

## 🛠️ 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.x |
| 构建工具 | Vite | 5.x |
| 路由 | React Router | 6.x |
| 后端框架 | Express | 4.x |
| 部署平台 | Cloudflare Pages | - |
| 数据存储 | Cloudflare KV / JSON 文件 | - |
| CDN | jsDelivr | - |

---

## 🚀 快速开始

### 方式一：本地开发

```bash
# 克隆仓库
git clone https://github.com/kobayashi-007/github-image-host.git
cd github-image-host

# 安装依赖
npm install

# 启动前端（端口 3000）
npm run dev

# 启动后端（端口 3001）- 新开终端
npm run server
```

访问 http://localhost:3000

### 方式二：一键启动（Windows）

```bash
# 使用批处理脚本
start.bat

# 或 PowerShell
start.ps1
```

### 方式三：Cloudflare 部署

详见 [Cloudflare 部署指南](./01-Cloudflare部署指南.md)

---

## 📁 项目结构

```
github-image-host/
├── src/                    # 前端代码
│   ├── pages/              # 页面组件
│   │   ├── Login.jsx       # 登录页面
│   │   ├── Upload.jsx      # 上传/文件管理页面
│   │   └── Settings.jsx    # 设置页面
│   ├── styles/             # 样式文件
│   │   ├── Login.css       # 登录页面样式
│   │   ├── Upload.css      # 上传页面样式
│   │   └── Settings.css    # 设置页面样式
│   ├── config.js           # API 配置
│   ├── App.jsx             # 应用入口
│   └── main.jsx            # React 渲染入口
├── server/                 # 后端代码（纯后端部署用）
│   ├── index.js            # Express 服务器
│   ├── data.json           # 用户数据存储
│   └── package.json        # 后端依赖
├── functions/              # Cloudflare Pages Functions
│   └── api/                # API 路由
│       ├── login.js        # 登录接口
│       └── settings/       # 设置接口
├── public/                 # 静态资源
│   ├── logo.png            # 网站 Logo
│   ├── video.mp4           # 默认登录背景视频
│   └── index.png           # 默认登录背景图片
├── wrangler.toml           # Cloudflare 配置
├── vite.config.js          # Vite 配置
├── package.json            # 项目依赖
└── DEPLOY.md               # 部署指南
```

---

## 🔌 API 接口

### 登录接口

**POST** `/api/login`

请求体：
```json
{
  "username": "string",
  "password": "string"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "username": "string",
    "githubToken": "string",
    "repo": "string",
    "branch": "string",
    "siteTitle": "string",
    "loginTransparent": false,
    "loginOpacity": 0.8,
    "loginBackground": "string",
    "customDomain": "string",
    "useCustomDomain": false
  }
}
```

### 设置接口

**POST** `/api/settings`

请求体：
```json
{
  "defaultUsername": "string",
  "defaultPassword": "string",
  "githubToken": "string",
  "repo": "string",
  "branch": "string",
  "siteTitle": "string",
  "loginTransparent": false,
  "loginOpacity": 0.8,
  "loginBackground": "string",
  "customDomain": "string",
  "useCustomDomain": false
}
```

### 获取用户设置

**GET** `/api/settings/{username}`

响应同上。

### 检查配置状态

**GET** `/api/settings/test`

响应：
```json
{
  "success": true,
  "defaultSettings": {
    "siteTitle": "string",
    "loginTransparent": false,
    "loginOpacity": 0.8,
    "loginBackground": "string"
  }
}
```

---

## 🎯 使用说明

### 1. 获取 GitHub Token

1. 登录 GitHub → Settings → Developer settings
2. 点击 Personal access tokens → Tokens (classic)
3. Generate new token → 勾选 `repo` 权限
4. 复制生成的 Token

**【截图位置】** GitHub Token 生成页面

### 2. 首次配置

1. 访问网站，点击「配置设置」
2. 填写以下信息：
   - 默认用户名：登录账号
   - 默认密码：登录密码  
   - GitHub Token：步骤1获取的 Token
   - 仓库名称：`用户名/仓库名`，如 `kobayashi-007/imgs`
   - 分支名称：默认 `main`
3. 点击「保存设置」

**【截图位置】** 设置页面

### 3. 上传图片

1. 登录网站
2. 点击「上传」按钮或拖拽图片到上传区域
3. 点击「确认上传」

**【截图位置】** 上传页面

### 4. 管理图片

- **查看图片**：点击图片缩略图
- **复制链接**：点击复制按钮
- **下载图片**：点击下载按钮
- **删除图片**：点击删除按钮

**【截图位置】** 文件管理器页面

---

## 🎨 个性化配置

### 登录背景

支持图片和视频背景：
- 图片格式：PNG, JPG, GIF, WebP
- 视频格式：MP4, WebM, OGG

### 亚克力效果

可调整透明程度（0%-100%）

### 自定义域名

如果在 GitHub Pages 设置了自定义域名，可以配置使用自定义域名访问图片。

---

## 🌐 部署方案

| 方案 | 优点 | 缺点 | 适合人群 |
|------|------|------|----------|
| Cloudflare Pages | 零成本、自动 SSL、CDN | KV 需要手动绑定 | 个人用户、小型项目 |
| 纯后端部署 | 更高性能、更多控制 | 需要服务器、维护成本 | 企业用户、高流量项目 |

详细部署指南：
- [Cloudflare 部署指南](./01-Cloudflare部署指南.md)
- [纯后端部署指南](./02-纯后端部署指南.md)

---

## 🔧 常见问题

### Q: 图片上传失败？

检查以下几点：
1. GitHub Token 是否有 `repo` 权限
2. 仓库名称格式是否正确（`用户名/仓库名`）
3. 网络连接是否正常
4. Token 是否过期

### Q: 登录页面显示默认背景？

配置保存后需要重新登录，或清除浏览器缓存。

### Q: KV 绑定不生效？

确保 Variable name 为 `IMAGE_HOST_KV`（大小写敏感），绑定后需要重新部署。

### Q: 如何恢复首次登录状态？

清除浏览器 localStorage 中的 `imageHostConfig`，或删除服务器上的 `data.json` 文件。

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m 'Add xxx feature'`
4. 推送到分支：`git push origin feature/xxx`
5. 创建 Pull Request

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [React](https://react.dev/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Cloudflare](https://www.cloudflare.com/) - 部署平台
- [jsDelivr](https://www.jsdelivr.com/) - CDN 服务
- [GitHub](https://github.com/) - 代码托管和图片存储

---

Made with ❤️ by [kobayashi-007](https://github.com/kobayashi-007)
