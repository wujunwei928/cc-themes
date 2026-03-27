# cc-themes 设计文档

## 概述

cc-themes 是一个 Node.js CLI 工具，作为 ccstatusline 的主题管理层。它不替代 ccstatusline 的渲染引擎，只负责维护内置主题库、提供主题切换/预览/管理的 CLI 命令，并将选中的主题写入 ccstatusline 的配置文件。

## 核心定位

- **上游**：ccstatusline 负责 status line 渲染（通过 `npx -y ccstatusline@latest` 运行）
- **本工具**：生成符合 ccstatusline `Settings` schema 的 JSON 配置，写入 `~/.config/ccstatusline/settings.json`
- **下游**：Claude Code 通过 stdin 将状态 JSON 传给 ccstatusline，ccstatusline 读取配置后渲染输出

## 架构

```
cc-themes (Node.js CLI)
├── src/
│   ├── cli.ts                  # CLI 入口，commander 命令路由
│   ├── commands/
│   │   ├── list.ts             # cc-themes list
│   │   ├── use.ts              # cc-themes use <name>
│   │   ├── preview.ts          # cc-themes preview <name>
│   │   ├── current.ts          # cc-themes current
│   │   ├── random.ts           # cc-themes random
│   │   ├── restore.ts          # cc-themes restore
│   │   └── export.ts           # cc-themes export <name>
│   ├── themes/
│   │   ├── index.ts            # 主题注册表 + defineTheme 工厂函数
│   │   ├── simple/
│   │   │   ├── clean-cyan.ts
│   │   │   └── ocean.ts
│   │   ├── block/
│   │   │   ├── nord-block.ts
│   │   │   ├── dracula-block.ts
│   │   │   ├── tokyo-block.ts
│   │   │   └── catppuccin-block.ts
│   │   ├── compact/
│   │   │   ├── oneline-rainbow.ts
│   │   │   └── neon.ts
│   │   └── rich/
│   │       ├── dashboard.ts
│   │       └── developer.ts
│   ├── utils/
│   │   ├── config.ts           # ccstatusline settings.json 读写 + 多版本备份
│   │   └── preview.ts          # 模拟数据生成 + ccstatusline 管道预览
│   └── types.ts                # 类型定义（对齐 ccstatusline Settings schema）
├── package.json
└── tsconfig.json
```

## CLI 命令

```
cc-themes list                列出所有内置主题（按类别分组显示）
cc-themes use <name>          切换到指定主题（写入 ccstatusline 配置，自动备份旧配置）
cc-themes preview <name>      用模拟数据在终端预览主题效果（不修改当前配置）
cc-themes current             显示当前使用的主题名和配置摘要
cc-themes random              随机切换一个主题
cc-themes restore             恢复上一次的配置备份
cc-themes export <name>       导出主题的 config JSON 到 stdout（纯 ccstatusline Settings 格式）
```

## 主题定义规范

每个主题导出一个符合以下接口的对象：

```typescript
interface Theme {
  name: string;           // 唯一标识符（kebab-case）
  category: string;       // 分类：简约 / 色块 / 紧凑 / 丰富
  description: string;    // 一句话描述
  config: ccstatuslineSettings;  // 符合 ccstatusline Settings schema 的配置
}
```

`config` 字段严格对齐 ccstatusline v3 的 `SettingsSchema`（Zod 定义）：

```typescript
interface ccstatuslineSettings {
  version: 3;
  lines: WidgetItem[][];         // 二维数组，每个子数组为一行
  flexMode: 'full' | 'full-minus-40' | 'full-until-compact';
  compactThreshold?: number;     // 1-99
  colorLevel: 0 | 1 | 2 | 3;    // 颜色深度
  defaultSeparator?: string;
  defaultPadding?: string;
  inheritSeparatorColors?: boolean;
  overrideBackgroundColor?: string;
  overrideForegroundColor?: string;
  globalBold?: boolean;
  powerline?: {
    enabled: boolean;
    separators: string[];
    separatorInvertBackground: boolean[];
    startCaps: string[];
    endCaps: string[];
    theme?: string;
    autoAlign: boolean;
  };
}

interface WidgetItem {
  id: string;
  type: string;                  // ccstatusline 支持的 widget type
  color?: string;                // 前景色名称（如 'cyan', 'brightWhite'）
  backgroundColor?: string;      // 背景色名称（如 'bgBlue', 'bgCyan'）
  bold?: boolean;
  character?: string;            // separator 的自定义字符
  rawValue?: boolean;            // 仅显示原始值，隐藏标签
  customText?: string;           // custom-text widget 的内容
  commandPath?: string;          // custom-command widget 的命令路径
  maxWidth?: number;             // 限制 widget 最大宽度
  preserveColors?: boolean;      // 保留自定义命令的原始颜色
  timeout?: number;              // 自定义命令超时（毫秒）
  merge?: boolean | 'no-padding'; // 与前一个 widget 合并显示
  metadata?: Record<string, string>;
}
```

颜色值支持三种格式：
- **ansi16 名称**：`cyan`, `brightWhite`, `bgBlue`, `bgBrightBlack` 等
- **256 色**：`ansi256:XX`（如 `ansi256:73`）
- **真彩色**：`hex:XXXXXX`（如 `hex:88C0D0`）

## 内置主题详细设计（10 个）

> 以下主题定义使用伪代码简写。实际 JSON 中，前景色写在 `color` 字段，背景色写在 `backgroundColor` 字段。
> 例：`model(color:cyan, bold:true)` 对应 `{ id: "1", type: "model", color: "cyan", bold: true }`
> 例：`model(color:brightWhite, backgroundColor:bgBlue, bold:true)` 对应 `{ id: "1", type: "model", color: "brightWhite", backgroundColor: "bgBlue", bold: true }`

### 简约风

#### `clean-cyan`
描述：经典四段式，`│` 分隔，冷色调
```jsonc
// lines[0]
[
  { "type": "model", "color": "cyan", "bold": true },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "context-percentage", "color": "green" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-branch", "color": "magenta" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-changes", "color": "yellow" }
]
// flexMode: "full-minus-40", colorLevel: 2
```

#### `ocean`
描述：蓝/青渐变色调，含上下文进度条
```jsonc
// lines[0]
[
  { "type": "model", "color": "cyan", "bold": true },
  { "type": "separator", "character": "·", "color": "brightCyan" },
  { "type": "git-branch", "color": "brightBlue" },
  { "type": "separator", "character": "·", "color": "brightCyan" },
  { "type": "tokens-total", "color": "cyan" },
  { "type": "separator", "character": "·", "color": "brightCyan" },
  { "type": "context-percentage", "color": "brightCyan" }
],
// lines[1]
[
  { "type": "context-bar", "color": "cyan" }
]
// flexMode: "full-minus-40", colorLevel: 2
```

### 色块风（背景色块分段，无需 Powerline 字体）

通过为每个 widget 设置 `backgroundColor`，widget 间的 separator 设置 `character: ""`（空字符），形成色块分段效果。这些主题**不启用** ccstatusline 的 `powerline` 功能，完全通过 `backgroundColor` 字段实现。

#### `nord-block`
描述：Nord 北极蓝配色
```jsonc
// lines[0]
[
  { "type": "model", "color": "brightWhite", "backgroundColor": "bgBlue", "bold": true },
  { "type": "separator", "character": "" },
  { "type": "git-branch", "color": "brightWhite", "backgroundColor": "bgCyan" },
  { "type": "separator", "character": "" },
  { "type": "context-percentage", "color": "brightWhite", "backgroundColor": "bgBrightBlack" },
  { "type": "separator", "character": "" },
  { "type": "git-changes", "color": "brightWhite", "backgroundColor": "bgMagenta" }
]
// colorLevel: 2, defaultSeparator: ""
```

#### `dracula-block`
描述：Dracula 暗紫色调
```jsonc
// lines[0]
[
  { "type": "model", "color": "brightWhite", "backgroundColor": "bgMagenta", "bold": true },
  { "type": "separator", "character": "" },
  { "type": "git-branch", "color": "brightWhite", "backgroundColor": "bgRed" },
  { "type": "separator", "character": "" },
  { "type": "session-cost", "color": "brightWhite", "backgroundColor": "bgCyan" },
  { "type": "separator", "character": "" },
  { "type": "context-percentage", "color": "brightWhite", "backgroundColor": "bgBrightBlack" }
]
// colorLevel: 2, defaultSeparator: ""
```

#### `tokyo-block`
描述：Tokyo Night 蓝紫色调
```jsonc
// lines[0]
[
  { "type": "model", "color": "brightWhite", "backgroundColor": "bgBlue", "bold": true },
  { "type": "separator", "character": "" },
  { "type": "git-branch", "color": "brightWhite", "backgroundColor": "bgMagenta" },
  { "type": "separator", "character": "" },
  { "type": "context-percentage", "color": "brightWhite", "backgroundColor": "bgYellow" },
  { "type": "separator", "character": "" },
  { "type": "output-speed", "color": "brightWhite", "backgroundColor": "bgCyan" }
]
// colorLevel: 2, defaultSeparator: ""
```

#### `catppuccin-block`
描述：Catppuccin 柔和粉彩
```jsonc
// lines[0]
[
  { "type": "model", "color": "brightWhite", "backgroundColor": "bgMagenta", "bold": true },
  { "type": "separator", "character": "" },
  { "type": "git-branch", "color": "brightWhite", "backgroundColor": "bgGreen" },
  { "type": "separator", "character": "" },
  { "type": "tokens-total", "color": "brightWhite", "backgroundColor": "bgRed" },
  { "type": "separator", "character": "" },
  { "type": "context-percentage", "color": "brightWhite", "backgroundColor": "bgBlue" }
]
// colorLevel: 2, defaultSeparator: ""
```

### 紧凑风

#### `oneline-rainbow`
描述：单行多段，彩虹色，`│` 分隔
```jsonc
// lines[0]
[
  { "type": "model", "color": "cyan", "bold": true },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-branch", "color": "magenta" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "context-percentage", "color": "green" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "session-cost", "color": "yellow" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "output-speed", "color": "brightBlue" }
]
// flexMode: "full-minus-40", colorLevel: 2, globalBold: true
```

#### `neon`
描述：霓虹高对比色，紧凑单行
```jsonc
// lines[0]
[
  { "type": "model", "color": "brightCyan", "bold": true },
  { "type": "separator", "character": "▸", "color": "brightMagenta" },
  { "type": "git-branch", "color": "brightMagenta" },
  { "type": "separator", "character": "▸", "color": "brightGreen" },
  { "type": "context-percentage", "color": "brightGreen" },
  { "type": "separator", "character": "▸", "color": "brightYellow" },
  { "type": "session-cost", "color": "brightYellow" }
]
// flexMode: "full", colorLevel: 2, globalBold: true
```

### 丰富风

#### `dashboard`
描述：双行仪表盘，信息行 + 进度条行
```jsonc
// lines[0]
[
  { "type": "model", "color": "cyan", "bold": true },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-branch", "color": "magenta" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-changes", "color": "yellow" },
  { "type": "flex-separator" },
  { "type": "tokens-total", "color": "green" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "session-cost", "color": "brightYellow" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "output-speed", "color": "brightBlue" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "session-clock", "color": "brightBlack" }
],
// lines[1]
[
  { "type": "context-bar", "color": "cyan" }
]
// flexMode: "full-minus-40", colorLevel: 2
```

#### `developer`
描述：双行完整开发信息，含 token 明细和速率限制
```jsonc
// lines[0]
[
  { "type": "model", "color": "brightCyan", "bold": true },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-branch", "color": "magenta" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "git-root-dir", "color": "brightBlue" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "thinking-effort", "color": "brightYellow" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "vim-mode", "color": "brightBlack" },
  { "type": "flex-separator" },
  { "type": "session-cost", "color": "brightGreen" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "session-clock", "color": "brightBlack" }
],
// lines[1]
[
  { "type": "tokens-input", "color": "cyan" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "tokens-output", "color": "green" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "tokens-cached", "color": "brightMagenta" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "context-percentage", "color": "yellow" },
  { "type": "separator", "character": "│", "color": "brightBlack" },
  { "type": "total-speed", "color": "brightBlue" },
  { "type": "flex-separator" },
  { "type": "block-timer", "color": "brightRed" }
]
// flexMode: "full-minus-40", colorLevel: 2
```

## 切换机制

`cc-themes use <name>` 执行流程：

1. 从主题注册表中查找指定主题
2. 读取当前 `~/.config/ccstatusline/settings.json`
3. 将当前配置备份到 `~/.config/ccstatusline/backups/<timestamp>.json`（保留历史，最多 10 份，超出自动清理最旧）
4. 同时更新 `~/.config/ccstatusline/backups/latest.json` 快捷指向
5. 将主题 config 序列化为 JSON 写入 `~/.config/ccstatusline/settings.json`
6. 输出确认信息（主题名 + 简要描述）
7. Claude Code 下次触发 statusline 更新时自动生效（无需重启）

## 恢复机制

`cc-themes restore` 执行流程：

1. 检查 `~/.config/ccstatusline/backups/latest.json` 是否存在
2. 若存在，将其内容覆盖写回 `~/.config/ccstatusline/settings.json`
3. 输出恢复确认信息

## 预览机制

`cc-themes preview <name>` 执行流程：

1. 加载主题配置
2. 将主题 config 写入临时文件 `/tmp/cc-themes-preview-settings.json`
3. 构造模拟的 Claude Code StatusJSON 数据（包含预设的模型名、token 数、cost、duration 等）
4. 通过管道将模拟数据传给 ccstatusline：

```bash
echo '<mock_json>' | npx -y ccstatusline@latest --config /tmp/cc-themes-preview-settings.json
```

5. 捕获 ccstatusline 的 stdout 输出，显示到终端
6. 清理临时文件

**预览限制**：以下 widget 依赖外部数据源，在预览中可能显示为空或占位值：
- `tokens-input/output/cached/total`、`input-speed/output-speed/total-speed`：依赖 `transcript_path` 指向的 JSONL 文件计算 metrics，模拟数据中不提供真实 transcript 文件
- `git-branch/changes/insertions/deletions`：依赖 git 命令执行，预览时使用模拟值
- `session-clock`：依赖 `cost.total_duration_ms`，使用模拟值
- `block-timer/reset-timer`：依赖速率限制数据，使用模拟值

预览是"尽力而为"的近似效果，实际效果以 `use` 切换后的真实运行为准。

## 导出机制

`cc-themes export <name>` 输出纯 ccstatusline Settings JSON 到 stdout（不含 name/category/description 包装），可直接用于：

```bash
cc-themes export dashboard > ~/.config/ccstatusline/settings.json
cc-themes export neon | jq '.lines[0]'
```

## 技术选型

- **运行时**：Node.js >= 18 + TypeScript
- **构建**：tsup（打包为单文件 ESM CLI）
- **依赖**：commander（CLI 框架）、chalk（彩色输出）、zod（配置校验）
- **发布**：npm 包，支持 `npx cc-themes` 或全局安装 `npm i -g cc-themes`
- **零侵入**：不修改 Claude Code 自身配置，只操作 ccstatusline 的配置文件

## 限制与边界

- 不使用 Powerline 字体符号（色块风主题通过 backgroundColor 实现视觉效果）
- 不提供 TUI 交互界面（纯命令行）
- 不支持用户自定义主题文件（未来可扩展）
- 依赖 ccstatusline 已安装并配置（Claude Code `settings.json` 中的 `statusLine` 指向 ccstatusline）
- 预览效果为近似值，部分依赖外部数据的 widget 在预览中显示占位内容
