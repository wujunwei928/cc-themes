# cc-themes 实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Node.js CLI 工具，提供 10 个内置 ccstatusline 主题，支持列表/切换/预览/恢复/导出操作。

**Architecture:** 纯 TypeScript CLI 工具，主题定义为静态配置对象，通过文件读写与 ccstatusline 的 `settings.json` 交互。预览通过 stdin 管道调用 ccstatusline 实现。

**Tech Stack:** Node.js 20+, TypeScript, tsup (构建), commander (CLI), chalk@5 (彩色输出), zod (校验)

---

## 文件结构

```
cc-styles/
├── src/
│   ├── cli.ts                  # CLI 入口，注册 commander 命令
│   ├── types.ts                # Theme / ccstatuslineSettings / WidgetItem 类型定义 + zod schema
│   ├── themes/
│   │   ├── index.ts            # defineTheme() + getAllThemes() + getThemeByName()
│   │   ├── helpers.ts          # w() widget 构造辅助（每主题局部 ID）
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
│   │   ├── config.ts           # 读写 ccstatusline settings.json + 备份/恢复
│   │   └── preview.ts          # 构造模拟数据 + 管道调用 ccstatusline 预览
│   └── commands/
│       ├── list.ts             # cc-themes list
│       ├── use.ts              # cc-themes use <name>
│       ├── preview.ts          # cc-themes preview <name>
│       ├── current.ts          # cc-themes current
│       ├── random.ts           # cc-themes random
│       ├── restore.ts          # cc-themes restore
│       └── export.ts           # cc-themes export <name>
├── tests/
│   ├── themes.test.ts          # 主题注册表 + defineTheme 测试
│   ├── config.test.ts          # 配置读写 + 备份/恢复 测试
│   └── commands.test.ts        # CLI 命令集成测试
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── docs/
    └── superpowers/
        ├── specs/2026-03-27-cc-themes-design.md
        └── plans/2026-03-27-cc-themes-impl.md
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: 初始化 npm 项目并安装依赖**

```bash
cd /code/ai/cc-styles
npm init -y
npm install commander chalk@5 zod
npm install -D typescript tsup @types/node vitest tsx
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: 创建 tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
  clean: true,
  bundle: true,
});
```

- [ ] **Step 4: 更新 package.json 的 scripts 和 bin 字段**

在 package.json 中设置：

```json
{
  "type": "module",
  "bin": {
    "cc-themes": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "files": ["dist"]
}
```

- [ ] **Step 5: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: 提交**

```bash
git init
git add package.json package-lock.json tsconfig.json tsup.config.ts vitest.config.ts
git commit -m "chore: 初始化 cc-themes 项目结构"
```

---

## Task 2: 类型定义与 Zod Schema

**Files:**
- Create: `src/types.ts`
- Create: `tests/types.test.ts`

- [ ] **Step 1: 编写类型校验测试**

```typescript
// tests/types.test.ts
import { describe, it, expect } from 'vitest';
import { WidgetItemSchema, SettingsSchema } from '../src/types.js';

describe('WidgetItemSchema', () => {
  it('应接受最小合法 widget', () => {
    const result = WidgetItemSchema.safeParse({ id: '1', type: 'model' });
    expect(result.success).toBe(true);
  });

  it('应接受带所有可选字段的 widget', () => {
    const result = WidgetItemSchema.safeParse({
      id: '1', type: 'model', color: 'cyan', backgroundColor: 'bgBlue',
      bold: true, character: '│', rawValue: true, merge: 'no-padding',
      customText: 'hello', commandPath: '/bin/echo', maxWidth: 20,
      preserveColors: true, timeout: 5000, metadata: { key: 'val' },
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝缺少 id 的 widget', () => {
    const result = WidgetItemSchema.safeParse({ type: 'model' });
    expect(result.success).toBe(false);
  });

  it('应拒绝缺少 type 的 widget', () => {
    const result = WidgetItemSchema.safeParse({ id: '1' });
    expect(result.success).toBe(false);
  });
});

describe('SettingsSchema', () => {
  it('应提供默认值', () => {
    const result = SettingsSchema.parse({});
    expect(result.version).toBe(3);
    expect(result.lines).toHaveLength(3);
    expect(result.powerline.enabled).toBe(false);
  });

  it('应接受完整的主题配置', () => {
    const settings = {
      version: 3,
      lines: [
        [
          { id: '1', type: 'model', color: 'cyan', bold: true },
          { id: '2', type: 'separator', character: '│' },
          { id: '3', type: 'git-branch', color: 'magenta' },
        ],
      ],
      flexMode: 'full-minus-40',
      colorLevel: 2,
    };
    const result = SettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/types.test.ts
```

预期：FAIL — `src/types.ts` 不存在

- [ ] **Step 3: 编写 src/types.ts**

```typescript
// src/types.ts
import { z } from 'zod';

// WidgetItem schema — 对齐 ccstatusline v3 的 WidgetItemSchema
export const WidgetItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  bold: z.boolean().optional(),
  character: z.string().optional(),
  rawValue: z.boolean().optional(),
  customText: z.string().optional(),
  commandPath: z.string().optional(),
  maxWidth: z.number().optional(),
  preserveColors: z.boolean().optional(),
  timeout: z.number().optional(),
  merge: z.union([z.boolean(), z.literal('no-padding')]).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type WidgetItem = z.infer<typeof WidgetItemSchema>;

// ccstatusline Settings schema — 对齐 ccstatusline v3 的 SettingsSchema
export const SettingsSchema = z.object({
  version: z.number().default(3),
  lines: z.array(z.array(WidgetItemSchema))
    .min(1)
    .default([
      [
        { id: '1', type: 'model', color: 'cyan' },
        { id: '2', type: 'separator' },
        { id: '3', type: 'context-length', color: 'brightBlack' },
        { id: '4', type: 'separator' },
        { id: '5', type: 'git-branch', color: 'magenta' },
        { id: '6', type: 'separator' },
        { id: '7', type: 'git-changes', color: 'yellow' },
      ],
      [],
      [],
    ]),
  flexMode: z.enum(['full', 'full-minus-40', 'full-until-compact']).default('full-minus-40'),
  compactThreshold: z.number().min(1).max(99).default(60),
  colorLevel: z.number().min(0).max(3).default(2),
  defaultSeparator: z.string().optional(),
  defaultPadding: z.string().optional(),
  inheritSeparatorColors: z.boolean().default(false),
  overrideBackgroundColor: z.string().optional(),
  overrideForegroundColor: z.string().optional(),
  globalBold: z.boolean().default(false),
  powerline: z.object({
    enabled: z.boolean().default(false),
    separators: z.array(z.string()).default(['\uE0B0']),
    separatorInvertBackground: z.array(z.boolean()).default([false]),
    startCaps: z.array(z.string()).default([]),
    endCaps: z.array(z.string()).default([]),
    theme: z.string().optional(),
    autoAlign: z.boolean().default(false),
  }).default({}),
});

export type ccstatuslineSettings = z.infer<typeof SettingsSchema>;

// 主题定义接口
export interface Theme {
  name: string;
  category: string;
  description: string;
  config: ccstatuslineSettings;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/types.test.ts
```

预期：全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/types.ts tests/types.test.ts
git commit -m "feat: 添加类型定义和 zod schema"
```

---

## Task 3: 主题注册表 + 辅助函数 + 全部主题定义

**Files:**
- Create: `src/themes/helpers.ts`
- Create: `src/themes/index.ts`
- Create: `src/themes/simple/clean-cyan.ts`
- Create: `src/themes/simple/ocean.ts`
- Create: `src/themes/block/nord-block.ts`
- Create: `src/themes/block/dracula-block.ts`
- Create: `src/themes/block/tokyo-block.ts`
- Create: `src/themes/block/catppuccin-block.ts`
- Create: `src/themes/compact/oneline-rainbow.ts`
- Create: `src/themes/compact/neon.ts`
- Create: `src/themes/rich/dashboard.ts`
- Create: `src/themes/rich/developer.ts`
- Create: `tests/themes.test.ts`

> Task 3 和 Task 4 合并，避免提交无法编译的中间状态。

- [ ] **Step 1: 创建 src/themes/helpers.ts**

每个主题独立调用 `createWidgetHelper()` 获取自己的 ID 计数器，避免全局共享状态。

```typescript
// src/themes/helpers.ts
import type { WidgetItem } from '../types.js';

// 每个主题调用一次，获得独立的 ID 计数器
export function createWidgetHelper() {
  let id = 0;
  return function w(type: string, opts?: Partial<Omit<WidgetItem, 'id' | 'type'>>): WidgetItem {
    return { id: String(++id), type, ...opts };
  };
}
```

- [ ] **Step 2: 创建 src/themes/simple/clean-cyan.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'clean-cyan',
  category: '简约',
  description: '经典四段式，│ 分隔，冷色调',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'cyan', bold: true }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('context-percentage', { color: 'green' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-branch', { color: 'magenta' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-changes', { color: 'yellow' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
```

- [ ] **Step 3: 创建 src/themes/simple/ocean.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'ocean',
  category: '简约',
  description: '蓝/青渐变色调，含上下文进度条',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'cyan', bold: true }),
        w('separator', { character: '·', color: 'brightCyan' }),
        w('git-branch', { color: 'brightBlue' }),
        w('separator', { character: '·', color: 'brightCyan' }),
        w('tokens-total', { color: 'cyan' }),
        w('separator', { character: '·', color: 'brightCyan' }),
        w('context-percentage', { color: 'brightCyan' }),
      ],
      [
        w('context-bar', { color: 'cyan' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
```

- [ ] **Step 4: 创建 src/themes/block/nord-block.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'nord-block',
  category: '色块',
  description: 'Nord 北极蓝配色色块风格',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'brightWhite', backgroundColor: 'bgBlue', bold: true }),
        w('separator', { character: '' }),
        w('git-branch', { color: 'brightWhite', backgroundColor: 'bgCyan' }),
        w('separator', { character: '' }),
        w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgBrightBlack' }),
        w('separator', { character: '' }),
        w('git-changes', { color: 'brightWhite', backgroundColor: 'bgMagenta' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
```

- [ ] **Step 5: 创建 src/themes/block/dracula-block.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'dracula-block',
  category: '色块',
  description: 'Dracula 暗紫色调色块风格',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'brightWhite', backgroundColor: 'bgMagenta', bold: true }),
        w('separator', { character: '' }),
        w('git-branch', { color: 'brightWhite', backgroundColor: 'bgRed' }),
        w('separator', { character: '' }),
        w('session-cost', { color: 'brightWhite', backgroundColor: 'bgCyan' }),
        w('separator', { character: '' }),
        w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgBrightBlack' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
```

- [ ] **Step 6: 创建 src/themes/block/tokyo-block.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'tokyo-block',
  category: '色块',
  description: 'Tokyo Night 蓝紫色调色块风格',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'brightWhite', backgroundColor: 'bgBlue', bold: true }),
        w('separator', { character: '' }),
        w('git-branch', { color: 'brightWhite', backgroundColor: 'bgMagenta' }),
        w('separator', { character: '' }),
        w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgYellow' }),
        w('separator', { character: '' }),
        w('output-speed', { color: 'brightWhite', backgroundColor: 'bgCyan' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
```

- [ ] **Step 7: 创建 src/themes/block/catppuccin-block.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'catppuccin-block',
  category: '色块',
  description: 'Catppuccin 柔和粉彩色块风格',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'brightWhite', backgroundColor: 'bgMagenta', bold: true }),
        w('separator', { character: '' }),
        w('git-branch', { color: 'brightWhite', backgroundColor: 'bgGreen' }),
        w('separator', { character: '' }),
        w('tokens-total', { color: 'brightWhite', backgroundColor: 'bgRed' }),
        w('separator', { character: '' }),
        w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgBlue' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
```

- [ ] **Step 8: 创建 src/themes/compact/oneline-rainbow.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'oneline-rainbow',
  category: '紧凑',
  description: '单行多段彩虹色，│ 分隔',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'cyan', bold: true }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-branch', { color: 'magenta' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('context-percentage', { color: 'green' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('session-cost', { color: 'yellow' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('output-speed', { color: 'brightBlue' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    globalBold: true,
  },
});
```

- [ ] **Step 9: 创建 src/themes/compact/neon.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'neon',
  category: '紧凑',
  description: '霓虹高对比色，紧凑单行',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'brightCyan', bold: true }),
        w('separator', { character: '▸', color: 'brightMagenta' }),
        w('git-branch', { color: 'brightMagenta' }),
        w('separator', { character: '▸', color: 'brightGreen' }),
        w('context-percentage', { color: 'brightGreen' }),
        w('separator', { character: '▸', color: 'brightYellow' }),
        w('session-cost', { color: 'brightYellow' }),
      ],
    ],
    flexMode: 'full',
    colorLevel: 2,
    globalBold: true,
  },
});
```

- [ ] **Step 10: 创建 src/themes/rich/dashboard.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'dashboard',
  category: '丰富',
  description: '双行仪表盘，信息行 + 进度条行',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'cyan', bold: true }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-branch', { color: 'magenta' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-changes', { color: 'yellow' }),
        w('flex-separator'),
        w('tokens-total', { color: 'green' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('session-cost', { color: 'brightYellow' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('output-speed', { color: 'brightBlue' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('session-clock', { color: 'brightBlack' }),
      ],
      [
        w('context-bar', { color: 'cyan' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
```

- [ ] **Step 11: 创建 src/themes/rich/developer.ts**

```typescript
import { defineTheme } from '../index.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'developer',
  category: '丰富',
  description: '双行完整开发信息，含 token 明细和速率限制',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'brightCyan', bold: true }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-branch', { color: 'magenta' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('git-root-dir', { color: 'brightBlue' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('thinking-effort', { color: 'brightYellow' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('vim-mode', { color: 'brightBlack' }),
        w('flex-separator'),
        w('session-cost', { color: 'brightGreen' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('session-clock', { color: 'brightBlack' }),
      ],
      [
        w('tokens-input', { color: 'cyan' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('tokens-output', { color: 'green' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('tokens-cached', { color: 'brightMagenta' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('context-percentage', { color: 'yellow' }),
        w('separator', { character: '│', color: 'brightBlack' }),
        w('total-speed', { color: 'brightBlue' }),
        w('flex-separator'),
        w('block-timer', { color: 'brightRed' }),
      ],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
```

- [ ] **Step 12: 创建 src/themes/index.ts**

```typescript
// src/themes/index.ts
import type { Theme, ccstatuslineSettings } from '../types.js';
import { SettingsSchema } from '../types.js';

// 工厂函数：校验 config 并包装为主题对象
export function defineTheme(theme: Omit<Theme, 'config'> & { config: ccstatuslineSettings }): Theme {
  const parsed = SettingsSchema.safeParse(theme.config);
  if (!parsed.success) {
    throw new Error(`主题 "${theme.name}" 的配置无效: ${parsed.error.message}`);
  }
  return { ...theme, config: parsed.data } as Theme;
}

// 内置主题导入
import cleanCyan from './simple/clean-cyan.js';
import ocean from './simple/ocean.js';
import nordBlock from './block/nord-block.js';
import draculaBlock from './block/dracula-block.js';
import tokyoBlock from './block/tokyo-block.js';
import catppuccinBlock from './block/catppuccin-block.js';
import onelineRainbow from './compact/oneline-rainbow.js';
import neon from './compact/neon.js';
import dashboard from './rich/dashboard.js';
import developer from './rich/developer.js';

const ALL_THEMES: Theme[] = [
  cleanCyan, ocean,
  nordBlock, draculaBlock, tokyoBlock, catppuccinBlock,
  onelineRainbow, neon,
  dashboard, developer,
];

export function getAllThemes(): Theme[] {
  return ALL_THEMES;
}

export function getThemeByName(name: string): Theme | undefined {
  return ALL_THEMES.find(t => t.name === name);
}

// 反向匹配：检查当前配置对应哪个内置主题
export function findMatchingTheme(settings: ccstatuslineSettings): Theme | undefined {
  // 比较时忽略默认填充的空行，只比较有内容的行
  const normalizeLines = (lines: ccstatuslineSettings['lines']) =>
    JSON.stringify(lines.filter(l => l.length > 0));
  const target = normalizeLines(settings.lines);
  return ALL_THEMES.find(t => normalizeLines(t.config.lines) === target);
}
```

- [ ] **Step 13: 编写主题测试**

```typescript
// tests/themes.test.ts
import { describe, it, expect } from 'vitest';
import { getAllThemes, getThemeByName, findMatchingTheme } from '../src/themes/index.js';

describe('主题注册表', () => {
  it('应返回所有 10 个内置主题', () => {
    const themes = getAllThemes();
    expect(themes).toHaveLength(10);
  });

  it('每个主题都应有合法的 name/category/description/config', () => {
    const themes = getAllThemes();
    for (const theme of themes) {
      expect(theme.name).toBeTruthy();
      expect(theme.category).toBeTruthy();
      expect(theme.description).toBeTruthy();
      expect(theme.config.version).toBe(3);
      expect(theme.config.lines.length).toBeGreaterThanOrEqual(1);
      // 每个主题至少有 1 个非布局 widget
      const contentWidgets = theme.config.lines.flat()
        .filter(w => w.type !== 'separator' && w.type !== 'flex-separator');
      expect(contentWidgets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('应按名称查找主题', () => {
    const theme = getThemeByName('clean-cyan');
    expect(theme).toBeDefined();
    expect(theme!.name).toBe('clean-cyan');
  });

  it('不存在的主题应返回 undefined', () => {
    const theme = getThemeByName('nonexistent');
    expect(theme).toBeUndefined();
  });

  it('主题名称应唯一', () => {
    const themes = getAllThemes();
    const names = themes.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('每个主题的 widget ID 在行内应唯一', () => {
    const themes = getAllThemes();
    for (const theme of themes) {
      for (const line of theme.config.lines) {
        const ids = line.map(w => w.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

describe('findMatchingTheme', () => {
  it('应匹配 clean-cyan 主题', () => {
    const theme = getThemeByName('clean-cyan')!;
    const matched = findMatchingTheme(theme.config);
    expect(matched?.name).toBe('clean-cyan');
  });

  it('不匹配的配置应返回 undefined', () => {
    const matched = findMatchingTheme({
      version: 3,
      lines: [[{ id: 'x', type: 'custom-text', customText: 'unique' }]],
    });
    expect(matched).toBeUndefined();
  });
});
```

- [ ] **Step 14: 运行测试确认通过**

```bash
npx vitest run tests/themes.test.ts
```

预期：全部 PASS

- [ ] **Step 15: 提交**

```bash
git add src/themes/ tests/themes.test.ts
git commit -m "feat: 添加主题注册表和 10 个内置主题"
```

---

## Task 4: 配置读写与备份恢复

**Files:**
- Create: `src/utils/config.ts`
- Create: `tests/config.test.ts`

- [ ] **Step 1: 编写配置工具测试**

```typescript
// tests/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readSettings, writeSettings, backupSettings, restoreSettings } from '../src/utils/config.js';

let tmpDir: string;
const origEnv = process.env.CLAUDE_CONFIG_DIR;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-themes-test-'));
  process.env.CLAUDE_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (origEnv) process.env.CLAUDE_CONFIG_DIR = origEnv;
  else delete process.env.CLAUDE_CONFIG_DIR;
});

describe('readSettings', () => {
  it('配置文件不存在时应返回 null', () => {
    expect(readSettings()).toBeNull();
  });

  it('应正确读取合法配置', () => {
    const configDir = path.join(tmpDir, 'ccstatusline');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, 'settings.json'),
      JSON.stringify({ version: 3, lines: [[{ id: '1', type: 'model', color: 'cyan' }]] })
    );
    const settings = readSettings();
    expect(settings).not.toBeNull();
    expect(settings!.version).toBe(3);
  });

  it('损坏的 JSON 应返回 null', () => {
    const configDir = path.join(tmpDir, 'ccstatusline');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'settings.json'), 'not json');
    expect(readSettings()).toBeNull();
  });
});

describe('writeSettings', () => {
  it('应创建目录并写入配置', () => {
    writeSettings({
      version: 3,
      lines: [[{ id: '1', type: 'model' }]],
    });
    const settings = readSettings();
    expect(settings).not.toBeNull();
  });
});

describe('backupSettings / restoreSettings', () => {
  it('应备份并恢复配置', () => {
    writeSettings({ version: 3, lines: [[{ id: '1', type: 'model', color: 'red' }]] });
    backupSettings();
    writeSettings({ version: 3, lines: [[{ id: '1', type: 'model', color: 'blue' }]] });
    restoreSettings();
    const restored = readSettings();
    expect(restored!.lines[0][0].color).toBe('red');
  });

  it('无备份时恢复应返回 false', () => {
    expect(restoreSettings()).toBe(false);
  });

  it('应最多保留 10 份备份', () => {
    const configDir = path.join(tmpDir, 'ccstatusline');
    writeSettings({ version: 3, lines: [[{ id: '1', type: 'model' }]] });

    // 连续创建 12 次备份
    for (let i = 0; i < 12; i++) {
      writeSettings({ version: 3, lines: [[{ id: '1', type: 'model', color: `c${i}` }]] });
      backupSettings();
    }

    const backupsDir = path.join(configDir, 'backups');
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json') && f !== 'latest.json');
    expect(files.length).toBeLessThanOrEqual(10);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/config.test.ts
```

- [ ] **Step 3: 编写 src/utils/config.ts**

```typescript
// src/utils/config.ts
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ccstatuslineSettings } from '../types.js';
import { SettingsSchema } from '../types.js';

const MAX_BACKUPS = 10;

function getConfigDir(): string {
  const base = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.config');
  return path.join(base, 'ccstatusline');
}

export function getSettingsPath(): string {
  return path.join(getConfigDir(), 'settings.json');
}

function getBackupsDir(): string {
  return path.join(getConfigDir(), 'backups');
}

export function readSettings(): ccstatuslineSettings | null {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return SettingsSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function writeSettings(settings: ccstatuslineSettings): void {
  const configDir = getConfigDir();
  fs.mkdirSync(configDir, { recursive: true });
  const filePath = getSettingsPath();
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
}

export function backupSettings(): void {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) return;

  const backupsDir = getBackupsDir();
  fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupsDir, `${timestamp}.json`);
  fs.copyFileSync(filePath, backupPath);

  const latestPath = path.join(backupsDir, 'latest.json');
  fs.copyFileSync(filePath, latestPath);

  // 清理旧备份（保留最新 MAX_BACKUPS 份，不含 latest.json）
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.json') && f !== 'latest.json')
    .sort();
  while (files.length > MAX_BACKUPS) {
    const old = files.shift()!;
    fs.unlinkSync(path.join(backupsDir, old));
  }
}

export function restoreSettings(): boolean {
  const latestPath = path.join(getBackupsDir(), 'latest.json');
  if (!fs.existsSync(latestPath)) return false;
  fs.copyFileSync(latestPath, getSettingsPath());
  return true;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/config.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/utils/config.ts tests/config.test.ts
git commit -m "feat: 添加配置读写与多版本备份恢复"
```

---

## Task 5: 预览工具

**Files:**
- Create: `src/utils/preview.ts`

- [ ] **Step 1: 编写 src/utils/preview.ts**

```typescript
// src/utils/preview.ts
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ccstatuslineSettings } from '../types.js';

function generateMockStatusJSON(): string {
  return JSON.stringify({
    model: { id: 'claude-sonnet-4-6', display_name: 'Sonnet' },
    cwd: '/home/user/project',
    workspace: { current_dir: '/home/user/project', project_dir: '/home/user/project' },
    cost: {
      total_cost_usd: 0.42,
      total_duration_ms: 185000,
      total_api_duration_ms: 120000,
      total_lines_added: 150,
      total_lines_removed: 30,
    },
    context_window: {
      total_input_tokens: 45000,
      total_output_tokens: 12000,
      context_window_size: 200000,
      used_percentage: 28,
      remaining_percentage: 72,
      current_usage: {
        input_tokens: 45000,
        output_tokens: 12000,
        cache_creation_input_tokens: 8000,
        cache_read_input_tokens: 20000,
      },
    },
    session_id: 'preview-session-001',
    transcript_path: '',
    version: '1.0.0',
    output_style: { name: 'default' },
  });
}

export function previewTheme(settings: ccstatuslineSettings): string | null {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-themes-preview-'));
  try {
    const configPath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf-8');

    const mockData = generateMockStatusJSON();

    const result = execFileSync('npx', ['-y', 'ccstatusline@latest', '--config', configPath], {
      input: mockData,
      encoding: 'utf-8',
      timeout: 30000,
    });

    return result.trim();
  } catch {
    return null;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/preview.ts
git commit -m "feat: 添加主题预览工具（stdin 管道调用 ccstatusline）"
```

---

## Task 6: CLI 命令实现

**Files:**
- Create: `src/commands/list.ts`
- Create: `src/commands/use.ts`
- Create: `src/commands/preview.ts`
- Create: `src/commands/current.ts`
- Create: `src/commands/random.ts`
- Create: `src/commands/restore.ts`
- Create: `src/commands/export.ts`
- Create: `src/cli.ts`
- Create: `tests/commands.test.ts`

- [ ] **Step 1: 创建 src/commands/list.ts**

```typescript
import chalk from 'chalk';
import { getAllThemes } from '../themes/index.js';

export function list(): void {
  const themes = getAllThemes();
  const categories = new Map<string, typeof themes>();
  for (const t of themes) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }

  for (const [cat, items] of categories) {
    console.log(chalk.bold(`\n  ${cat}`));
    for (const t of items) {
      console.log(`    ${chalk.cyan(t.name.padEnd(20))} ${chalk.gray(t.description)}`);
    }
  }
  console.log();
}
```

- [ ] **Step 2: 创建 src/commands/use.ts**

```typescript
import chalk from 'chalk';
import { getThemeByName } from '../themes/index.js';
import { readSettings, writeSettings, backupSettings } from '../utils/config.js';

export function use(name: string): void {
  const theme = getThemeByName(name);
  if (!theme) {
    console.error(chalk.red(`主题 "${name}" 不存在。运行 cc-themes list 查看可用主题。`));
    process.exit(1);
  }

  // 备份当前配置（即使解析失败也尝试备份原文件）
  const current = readSettings();
  if (current) backupSettings();

  writeSettings(theme.config);
  console.log(chalk.green(`已切换到主题: ${chalk.bold(theme.name)}`));
  console.log(chalk.gray(theme.description));
}
```

- [ ] **Step 3: 创建 src/commands/preview.ts**

```typescript
import chalk from 'chalk';
import { getThemeByName } from '../themes/index.js';
import { previewTheme } from '../utils/preview.js';

export function preview(name: string): void {
  const theme = getThemeByName(name);
  if (!theme) {
    console.error(chalk.red(`主题 "${name}" 不存在。运行 cc-themes list 查看可用主题。`));
    process.exit(1);
  }

  console.log(chalk.gray(`预览主题: ${chalk.bold(theme.name)} (${theme.description})`));
  console.log(chalk.gray('─'.repeat(60)));

  const result = previewTheme(theme.config);
  if (result) {
    console.log(result);
  } else {
    console.log(chalk.yellow('无法渲染预览（ccstatusline 可能未安装或预览数据不完整）'));
    console.log(chalk.gray(`使用 "cc-themes use ${name}" 切换后查看实际效果`));
  }
  console.log(chalk.gray('─'.repeat(60)));
}
```

- [ ] **Step 4: 创建 src/commands/current.ts**

```typescript
import chalk from 'chalk';
import { readSettings } from '../utils/config.js';
import { findMatchingTheme } from '../themes/index.js';

export function current(): void {
  const settings = readSettings();
  if (!settings) {
    console.log(chalk.yellow('未检测到 ccstatusline 配置'));
    return;
  }

  const matched = findMatchingTheme(settings);
  console.log(chalk.bold('当前 ccstatusline 配置:'));
  if (matched) {
    console.log(`  主题: ${chalk.cyan(matched.name)} (${matched.description})`);
  } else {
    console.log(`  主题: ${chalk.gray('自定义配置（非内置主题）')}`);
  }
  console.log(`  行数: ${settings.lines.filter(l => l.length > 0).length}`);
  console.log(`  Widget 数: ${settings.lines.flat().filter(w => w.type !== 'separator' && w.type !== 'flex-separator').length}`);
  console.log(`  Powerline: ${settings.powerline.enabled ? '启用' : '禁用'}`);
}
```

- [ ] **Step 5: 创建 src/commands/random.ts**

```typescript
import { getAllThemes } from '../themes/index.js';
import { use } from './use.js';

export function random(): void {
  const themes = getAllThemes();
  const pick = themes[Math.floor(Math.random() * themes.length)];
  use(pick.name);
}
```

- [ ] **Step 6: 创建 src/commands/restore.ts**

```typescript
import chalk from 'chalk';
import { restoreSettings } from '../utils/config.js';

export function restore(): void {
  if (restoreSettings()) {
    console.log(chalk.green('已恢复到上一次的配置备份'));
  } else {
    console.error(chalk.red('没有可恢复的备份'));
    process.exit(1);
  }
}
```

- [ ] **Step 7: 创建 src/commands/export.ts**

```typescript
import { getThemeByName } from '../themes/index.js';

export function exportTheme(name: string): void {
  const theme = getThemeByName(name);
  if (!theme) {
    console.error(`主题 "${name}" 不存在。运行 cc-themes list 查看可用主题。`);
    process.exit(1);
  }
  console.log(JSON.stringify(theme.config, null, 2));
}
```

- [ ] **Step 8: 创建 src/cli.ts**

```typescript
import { Command } from 'commander';
import { list } from './commands/list.js';
import { use } from './commands/use.js';
import { preview } from './commands/preview.js';
import { current } from './commands/current.js';
import { random } from './commands/random.js';
import { restore } from './commands/restore.js';
import { exportTheme } from './commands/export.js';

const program = new Command();

program
  .name('cc-themes')
  .description('ccstatusline 主题管理工具')
  .version('1.0.0');

program.command('list').description('列出所有内置主题').action(list);
program.command('use <name>').description('切换到指定主题').action(use);
program.command('preview <name>').description('预览主题效果').action(preview);
program.command('current').description('显示当前配置摘要').action(current);
program.command('random').description('随机切换一个主题').action(random);
program.command('restore').description('恢复上一次的配置备份').action(restore);
program.command('export <name>').description('导出主题 JSON 到 stdout').action(exportTheme);

program.parse();
```

- [ ] **Step 9: 编写 CLI 集成测试**

```typescript
// tests/commands.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const cli = 'node';
const cliArgs = ['--import', 'tsx', 'src/cli.ts'];

describe('CLI 命令', () => {
  it('list 应输出主题列表', () => {
    const result = execFileSync(cli, [...cliArgs, 'list'], { encoding: 'utf-8' });
    expect(result).toContain('clean-cyan');
    expect(result).toContain('dracula-block');
    expect(result).toContain('dashboard');
  });

  it('export 应输出合法 JSON', () => {
    const result = execFileSync(cli, [...cliArgs, 'export', 'clean-cyan'], { encoding: 'utf-8' });
    const parsed = JSON.parse(result);
    expect(parsed.version).toBe(3);
    expect(parsed.lines).toBeDefined();
  });

  it('export 输出不应包含 ANSI 转义码', () => {
    const result = execFileSync(cli, [...cliArgs, 'export', 'neon'], { encoding: 'utf-8' });
    expect(result).not.toMatch(/\x1b\[/);
  });

  it('不存在的主题 export 应报错', () => {
    expect(() => {
      execFileSync(cli, [...cliArgs, 'export', 'nonexistent'], { encoding: 'utf-8' });
    }).toThrow();
  });
});

describe('use + restore 端到端', () => {
  let tmpDir: string;
  const origEnv = process.env.CLAUDE_CONFIG_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-themes-e2e-'));
    process.env.CLAUDE_CONFIG_DIR = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (origEnv) process.env.CLAUDE_CONFIG_DIR = origEnv;
    else delete process.env.CLAUDE_CONFIG_DIR;
  });

  it('use 应写入配置文件，restore 应恢复', () => {
    // 先写入一个原始配置
    const configDir = path.join(tmpDir, 'ccstatusline');
    fs.mkdirSync(configDir, { recursive: true });
    const originalConfig = { version: 3, lines: [[{ id: '1', type: 'model', color: 'red' }]] };
    fs.writeFileSync(path.join(configDir, 'settings.json'), JSON.stringify(originalConfig));

    // use 切换主题
    execFileSync(cli, [...cliArgs, 'use', 'neon'], {
      encoding: 'utf-8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: tmpDir },
    });

    // 确认配置已变更
    const afterUse = JSON.parse(fs.readFileSync(path.join(configDir, 'settings.json'), 'utf-8'));
    expect(afterUse.lines[0][0].color).not.toBe('red');

    // restore 恢复
    execFileSync(cli, [...cliArgs, 'restore'], {
      encoding: 'utf-8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: tmpDir },
    });

    const afterRestore = JSON.parse(fs.readFileSync(path.join(configDir, 'settings.json'), 'utf-8'));
    expect(afterRestore.lines[0][0].color).toBe('red');
  });
});
```

- [ ] **Step 10: 运行构建确认 CLI 可用**

```bash
npx tsup
node dist/cli.js list
```

预期：输出包含 10 个主题的分组列表

- [ ] **Step 11: 运行 CLI 集成测试**

```bash
npx vitest run tests/commands.test.ts
```

- [ ] **Step 12: 提交**

```bash
git add src/commands/ src/cli.ts tests/commands.test.ts
git commit -m "feat: 实现 CLI 命令（list/use/preview/current/random/restore/export）"
```

---

## Task 7: 最终验证与清理

**Files:**
- Modify: `package.json`（确认版本号和入口）

- [ ] **Step 1: 运行完整测试套件**

```bash
npx vitest run
```

预期：全部 PASS

- [ ] **Step 2: 构建并手动验证每个命令**

```bash
npx tsup
node dist/cli.js list
node dist/cli.js export clean-cyan | head -5
node dist/cli.js current
node dist/cli.js preview nord-block
```

- [ ] **Step 3: 创建 .gitignore**

```
node_modules/
dist/
*.tgz
```

- [ ] **Step 4: 全量提交**

```bash
git add -A
git commit -m "chore: 最终验证和清理"
```
