# dsh-theme-gallery 🎨

> DeepSeek Harness (dsh) Web 界面的随机图片主题皮肤插件 — 用本地图库为界面换肤：图片填满 UI 留白，控件自动取用图片主题色。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform: dsh web](https://img.shields.io/badge/Platform-dsh%20web-4a90d9.svg)](#)

一个集成进 [DeepSeek Harness](https://github.com/deepseek-ai) Web 控制台的背景主题插件：

- 🖼️ **图片填充留白** — 不再只是"主题色背景"：图片本身作为 UI 界面的留白填充
- 🎨 **控件取色** — 控件、面板、文字自动使用图片主色调（动态生成 CSS 变量）
- 🎲 **随机换肤** — 每次加载页面随机应用一张图片作为皮肤
- 🖥️ **横图全屏** — 横向图片铺满整个屏幕，不滚动不漂移
- 📱 **竖图适配** — 纵向图片放大至屏幕 90% 宽，配 100% 宽的高斯模糊底图作背景容器
- 🗂️ **动态分组管理** — 多选文件夹组建分组、自定义分组名；支持更新/改名/删除（内置分组受删除保护）
- ↔️ **方向筛选** — 下拉框选择"横向 / 纵向"，只在当前分组内筛选对应方向的图片
- 🎚️ **透明度 / 切换间隔** — 实时调节皮肤不透明度与随机换肤间隔
- 📦 **面板收起** — 标题行一键收起/展开主题面板，状态持久化
- ♻️ **恢复出厂** — 一键移除皮肤效果，还原 dsh 原始界面

## 效果预览（示意）

```
┌─────────────────────────────────────────────┐
│  🎨 背景主题                    ▾ 收起      │   ← 可收起面板
│  [图片缩略图墙 · 分组切换 · 方向筛选]        │
│  [透明度滑块 · 间隔滑块 · 恢复出厂]          │
├─────────────────────────────────────────────┤
│                                             │
│            （图片填充 UI 留白）              │
│              横图 cover 全屏                 │
│              竖图 90vw + 模糊底             │
│                                             │
└─────────────────────────────────────────────┘
```

## 目录结构

```
dsh-theme-gallery/
├── lib/
│   ├── index.js          # 插件 host 端: /gallery 路由 + 分组管理 API
│   └── client.js         # 插件 client 端: 皮肤面板 + 动态主题 CSS
├── tools/
│   └── analyze-all.mjs   # 图库扫描工具: 提取图片尺寸/主色/调色板 → 元数据 JSON
├── package.json
└── README.md
```

## 架构

```
┌──────────────────────────── 浏览器 (dsh web 界面) ────────────────────────────┐
│  client.js ── /gallery/list?g=1 ──┐   /gallery/<rel>?g=1 ──┐                │
│   (皮肤面板/动态CSS)               ▼                        ▼                │
└──────────────────────────────────────────────────────────────────────────────┘
              ┌───────────────────────────────────────────────┐
              │  dsh host 端 (lib/index.js) 注册 /gallery 前缀 │
              │  groups / list / meta / 图片 / 分组管理 API     │
              └───────────────────────────────────────────────┘
                                ▲
              tools/analyze-all.mjs  (扫描本地图库 → 元数据 JSON)
```

- **host 端** (`lib/index.js`)：注册 `/gallery` 前缀路由，提供分组管理 API（`groups` / `dirscan` / `group-add` / `group-status` / `group-rename` / `group-delete` / `group-update`）、图片元数据（`list` / `meta`）与图片静态服务（支持 `?s=` 缩略图）。
- **client 端** (`lib/client.js`)：皮肤面板 UI + 运行时颜色算法，根据图片主色调动态生成主题 CSS，通过 `body[data-dsh-theme-gallery]` 属性选择器挂载皮肤。
- **扫描工具** (`tools/analyze-all.mjs`)：递归扫描目录下的图片，提取尺寸、主色、调色板与亮度，输出元数据 JSON 供 host 端使用。

## 环境要求

| 依赖 | 说明 |
| --- | --- |
| Node.js | ≥ 18 |
| DeepSeek Harness | 已安装并运行 `dsh web` |
| sharp（可选但推荐） | 生成缩略图与调色板；安装于插件目录或 dsh 进程工作目录的 `node_modules` |

## 安装

### 1. 安装 sharp（可选）

```powershell
# 在 dsh 工作目录或插件目录安装
npm install sharp
```

> 未安装 sharp 时插件仍可运行：仅缩略图与调色板提取功能降级（`?s=` 返回原图、无调色板）。

### 2. 安装插件到 dsh

将 `dsh-theme-gallery` 目录复制到 dsh 的插件目录（profile 的 `node_modules`）：

```powershell
copy D:\path\to\dsh-theme-gallery C:\Users\<你>\.dsh\profiles\node_modules\dsh-theme-gallery -Recurse
```

在 profile 的 `cordis.patch.yml` 中注册插件：

```yaml
plugins:
  - insert:
    - id: theme-gallery
      name: dsh-theme-gallery
```

### 3. 配置图片目录并生成元数据

内置分组（g1/g2）的目录通过环境变量配置（分号分隔多个目录）：

```powershell
# g1: 画集 A 的图片目录（可多个，用 ; 分隔）
setx DSH_THEME_G1_DIRS "D:\图片\画集A;D:\图片\画集A2"
# g2: 画集 B 的图片目录
setx DSH_THEME_G2_DIRS "D:\图片\画集B"
# 可选: 数据目录(分组配置/元数据), 默认插件包内 data/
setx DSH_THEME_DATA_DIR "D:\dsh-theme-data"
```

扫描图库并生成元数据（g1 → `theme-all.json`，g2 → `theme-all-g2.json`）：

```powershell
node tools\analyze-all.mjs "%DSH_THEME_DATA_DIR%\theme-all.json" "D:\图片\画集A;D:\图片\画集A2"
node tools\analyze-all.mjs "%DSH_THEME_DATA_DIR%\theme-all-g2.json" "D:\图片\画集B"
```

> 也可以在界面中通过「添加分组」功能选择文件夹，插件会自动调用 `tools/analyze-all.mjs` 后台分析，无需手动生成。

### 4. 重启并刷新

重启 dsh web 服务，浏览器硬刷新（Ctrl+F5）即可看到「🎨 背景主题」面板。

## 使用说明

| 操作 | 说明 |
| --- | --- |
| 点击「🎨 背景主题」/「▾ 收起」 | 收起/展开主题面板（状态持久化） |
| 分组下拉框 | 切换分组（内置分组 + 自定义分组） |
| 添加分组 | 选择多个文件夹 → 命名 → 后台分析 → 加入分组列表 |
| 分组管理 | 每个分组均有「更新 / 改名 / 删除」（内置分组受删除保护） |
| 方向筛选 | 选择「横向 / 纵向」，仅展示当前分组内对应方向的图片 |
| 透明度滑块 | 调整皮肤不透明度（100% = 图片完全可见） |
| 间隔滑块 | 调整自动换肤间隔（分钟） |
| 恢复出厂 | 一键移除皮肤效果，还原 dsh 原始界面（持久禁用） |

界面偏好通过浏览器 `localStorage` 保存：

| Key | 含义 |
| --- | --- |
| `dsh-theme-gallery:group` | 当前分组 id |
| `dsh-theme-gallery:orient` | 方向筛选（all/landscape/portrait） |
| `dsh-theme-gallery:opacity` | 皮肤不透明度 |
| `dsh-theme-gallery:interval-min` | 自动换肤间隔（分钟） |
| `dsh-theme-gallery:collapsed` | 面板收起状态 |
| `dsh-theme-gallery:disabled` | 恢复出厂（持久禁用皮肤） |

## 配置项（host 端）

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DSH_THEME_G1_DIRS` | 空 | 内置分组 1 的图片目录（`;` 分隔） |
| `DSH_THEME_G2_DIRS` | 空 | 内置分组 2 的图片目录（`;` 分隔） |
| `DSH_THEME_DATA_DIR` | 插件包内 `data/` | 分组配置与元数据存储目录 |
| `DSH_THEME_ANALYZE_SCRIPT` | 插件包内 `tools/analyze-all.mjs` | 图库扫描脚本路径 |
| `DSH_THEME_GROUPS_STORE` | `data/custom-groups.json` | 自定义分组持久化文件 |
| `DSH_THEME_META_DIR` | `data/` | 元数据 JSON 目录 |

> 分组数据（`custom-groups.json`、`theme-*.json`）保存在 `data/` 目录，**不会被提交到仓库**。

## 常见问题

- **面板不出现 / 图片 404**：确认已配置 `DSH_THEME_G1_DIRS`/`DSH_THEME_G2_DIRS` 并生成元数据；硬刷新浏览器。
- **竖图显示为横图**：方向判定规则为宽高比 `>= 1.4` 视为横向，否则纵向。
- **缩略图不显示**：未安装 sharp，`?s=` 回退为原图（仍可正常换肤）。

## 免责声明

本项目仅供个人学习与交流使用。图片版权归原作者所有，请勿用于商业用途；请使用你拥有使用权或已获授权的图片。

## License

[MIT](LICENSE)
