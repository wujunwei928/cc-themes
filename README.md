# cc-themes

> [ccstatusline](https://github.com/sirmalloc/ccstatusline) 主题管理工具 — 10 款内置主题，一键切换/预览/导出/恢复

[ccstatusline](https://github.com/sirmalloc/ccstatusline) 是 Claude Code 社区最流行的状态栏美化工具。cc-themes 为它提供开箱即用的主题方案，让你无需手动配置，一条命令即可切换风格。

## 前置依赖

1. **Claude Code** — 已安装并正常运行
2. **[ccstatusline](https://github.com/sirmalloc/ccstatusline)** — 状态栏渲染引擎，安装方式：

```bash
# 运行 npx -y ccstatusline@latest
# 确保 ~/.claude/settings.json 中有以下配置：
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline@latest",
    "padding": 0
  }
}
```

> 如果已经能正常使用 [ccstatusline](https://github.com/sirmalloc/ccstatusline)，说明前置依赖已就绪，直接看下面的安装步骤。

## 安装

```bash
# 直接运行（推荐）
npx cc-themes list

# 或全局安装
npm i -g cc-themes
cc-themes list
```

## 使用方法

### 查看所有主题

```bash
cc-themes list
```

输出示例：

```
  简约
    clean-cyan           经典四段式，│ 分隔，冷色调
    ocean                蓝/青渐变色调，含上下文进度条

  色块
    nord-block           Nord 北极蓝配色色块风格
    dracula-block        Dracula 暗紫色调色块风格
    tokyo-block          Tokyo Night 蓝紫色调色块风格
    catppuccin-block     Catppuccin 柔和粉彩色块风格

  紧凑
    oneline-rainbow      单行多段彩虹色，│ 分隔
    neon                 霓虹高对比色，紧凑单行

  丰富
    dashboard            双行仪表盘，信息行 + 进度条行
    developer            双行完整开发信息，含 token 明细和速率限制
```

### 切换主题

```bash
cc-themes use nord-block
```

切换后 Claude Code 下次交互时自动生效，无需重启。当前配置会自动备份。

### 预览主题

在终端中预览主题效果，不修改当前配置：

```bash
# 预览单个主题
cc-themes preview neon

# 预览所有主题
cc-themes preview --all
```

预览会读取当前 git 仓库的分支名和变更统计，显示真实的 `⎇ branch(+N,-N)` 效果。

### 查看当前配置

```bash
cc-themes current
```

### 恢复备份

切回了不喜欢的主题？一键恢复：

```bash
cc-themes restore
```

### 随机切换

```bash
cc-themes random
```

### 导出主题

输出纯 JSON 格式，可用于分享或手动编辑：

```bash
cc-themes export dashboard > my-theme.json
cc-themes export neon | jq '.lines[0]'
```

## 内置主题一览

| 主题 | 风格 | 说明 |
|------|------|------|
| `clean-cyan` | 简约 | 模型+上下文+Git分支+变更，`│` 分隔，冷色调 |
| `ocean` | 简约 | 蓝/青渐变色调，Git分支+变更，含上下文进度条 |
| `nord-block` | 色块 | Nord 北极蓝配色，Git分支+变更色块分段 |
| `dracula-block` | 色块 | Dracula 暗紫色调，Git分支+变更色块分段 |
| `tokyo-block` | 色块 | Tokyo Night 蓝紫色调，Git分支+变更色块分段 |
| `catppuccin-block` | 色块 | Catppuccin 柔和粉彩，Git分支+变更色块分段 |
| `oneline-rainbow` | 紧凑 | 单行多段彩虹色，Git分支+变更 |
| `neon` | 紧凑 | 霓虹高对比色，`▸` 分隔，Git分支+变更 |
| `dashboard` | 丰富 | 双行仪表盘：Git分支+变更 + 进度条行 |
| `developer` | 丰富 | 双行完整信息：Git分支+变更 + Token明细 + 速率限制 |

> 色块风格主题通过背景色实现分段效果，**无需安装 Powerline 字体**。

## 工作原理

```
cc-themes use <主题名>
      │
      ▼
备份当前 ~/.config/ccstatusline/settings.json
      │
      ▼
将主题配置写入 ~/.config/ccstatusline/settings.json
      │
      ▼
Claude Code 下次交互时 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 读取新配置 → 渲染状态栏
```

cc-themes 不替代 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 的渲染功能，只负责管理和切换主题配置。

## 常见问题

**Q: 切换主题后没有生效？**

A: 在 Claude Code 中发送任意消息触发状态栏更新即可。

**Q: 怎么回到之前自己手动配置的 ccstatusline？**

A: 运行 `cc-themes restore`，自动恢复上一次的配置备份。

**Q: 色块主题在某些终端显示异常？**

A: 色块主题依赖终端的背景色渲染能力，推荐使用 iTerm2、Kitty、WezTerm、Windows Terminal 等现代终端。

## 开发

```bash
git clone https://github.com/wujunwei928/cc-themes.git
cd cc-themes
npm install
npm run build     # 构建
npm test          # 运行测试
npm run dev       # 监听模式开发
```

## License

MIT
