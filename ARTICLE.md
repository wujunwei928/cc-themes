# GLM-5.1 实战评测：设计 -> 开发 -> npm 发布 全流程，看国产大模型的真实工程能力

---



## 项目背景：cc-themes 是什么

Claude Code 是 Anthropic 推出的 CLI 编程工具，它的状态栏（statusline）支持自定义主题配置，但手动编辑 JSON 配置文件既繁琐又容易出错。

**cc-themes** 就是为了解决这个问题而开发的主题管理 CLI 工具，安装后一条命令即可切换风格：

```bash
npm i -g cc-themes

cc-themes list          # 列出所有内置主题
cc-themes use dashboard # 切换到仪表盘风格
cc-themes preview --all # 预览所有主题效果
cc-themes random        # 随机切换一个主题
cc-themes restore       # 不喜欢？一键恢复
```

### 技术选型

整个项目从零搭建，技术栈精简高效：

- **TypeScript + ESM** — 类型安全，现代模块系统
- **Commander.js** — CLI 命令解析，处理 list/use/preview 等子命令
- **Chalk** — 终端彩色输出，让 `list` 和 `preview` 的展示更直观
- **Zod** — 主题配置的 schema 校验，确保用户导出/导入的 JSON 格式正确
- **tsup** — 极速打包，将 TypeScript 编译为单文件 ESM bundle
- **Vitest** — 单元测试

### 项目结构

```
src/
├── cli.ts              # 命令入口
├── commands/           # 7 个子命令（list/use/preview/current/random/restore/export）
├── themes/             # 10 套内置主题
│   ├── simple/         # 简约风格（clean-cyan、ocean）
│   ├── block/          # 色块风格（nord、dracula、tokyo、catppuccin）
│   ├── compact/        # 紧凑风格（oneline-rainbow、neon）
│   └── rich/           # 丰富风格（dashboard、developer）
├── utils/              # 配置读写、预览渲染
└── types.ts            # 类型定义
```

项目虽小，五脏俱全——CLI 解析、配置管理、主题注册表、跨平台预览、多版本备份恢复，一个不少。

### 开发效果

10 套内置主题覆盖 4 种风格，适配不同使用场景：

**简约风格** — 信息精简，适合专注编码

`clean-cyan`：经典四段式布局，`Model → 上下文占比 → Git 分支 → 代码变更`，冷色调分隔符

`ocean`：蓝青渐变色，带上下文进度条，海洋系视觉

**色块风格** — Powerline 风格，背景色填充

`nord-block`：北极蓝配色，白字蓝底，每个信息块都是独立的色块

`dracula-block`：暗紫色调，经典 Dracula 配色

`tokyo-block`：蓝紫色调，Tokyo Night 风格

`catppuccin-block`：柔和粉彩系，视觉温和不刺眼

**紧凑风格** — 单行极致压缩

`oneline-rainbow`：一条线塞进所有信息，彩虹色分隔，信息密度拉满

`neon`：霓虹高对比色，`▸` 箭头分隔，终端里一眼醒目

**丰富风格** — 双行仪表盘，开发者最爱

`dashboard`：第一行显示模型、分支、Token 总量、费用、速度、时间；第二行是上下文使用进度条。像一个迷你的系统监控面板

`developer`：最完整的双行布局。第一行覆盖模型、分支、变更、项目目录、思考模式、Vim 模式、费用、时钟；第二行是 Token 明细（输入/输出/缓存）、上下文占比、速率、阻塞计时器。信息量最大的主题

切换主题只需一条命令，效果立即可见：

```bash
$ cc-themes use neon
✓ 已切换到 neon 主题

$ cc-themes use dashboard
✓ 已切换到 dashboard 主题
```

不满意随时恢复：

```bash
$ cc-themes restore
✓ 已从备份恢复配置
```

---

## 前言

今天决定把 cc-themes 发布到 npm，让社区可以 `npm i -g cc-themes` 直接使用。

**没想到一次简单的发布，踩了七八个坑。**

整个过程中，我全程使用 GLM-5.1 协作——不是 demo，不是精心设计的测试，就是真实的工作流。以下是完整记录。

---

## 第一关：npm 发布，连环炸

### 炸弹 1：注册失败

```
npm adduser
→ Public registration is not allowed
```

GLM-5.1 立刻检查了 npm registry 配置，发现我用了淘宝镜像源 `registry.npmmirror.com`，镜像不支持注册。直接给了解决方案：

```bash
npm adduser --registry https://registry.npmjs.org
```

**一步到位，没有多余分析。**

### 炸弹 2：2FA 拦截

然后发现我之前注册过😂, 开始发布，npm 返回 403：

```
Two-factor authentication or granular access token required
```

GLM-5.1 解释了 OTP 码 和 Granular Access Token 的操作路径，并给出了两种方式的发布命令。

### 炸弹 3：bin 字段被 npm 静默删除

发布成功了，但安装后命令找不到：

```
npm i -g cc-themes
cc-themes
→ zsh: command not found: cc-themes
```

这是最隐蔽的一个坑。npm 发布时给了一个 warning：

```
npm warn publish "bin[cc-themes]" script name dist/cli.js was invalid and removed
```

**关键问题：npm 把 bin 字段删了，但发布流程没有报错。**

GLM-5.1 的排查路径：
1. `npm view cc-themes bin` — 线上包确实有 bin 字段 ✓
2. 检查实际安装目录 — **文件是 `cli.mjs`，但 bin 指向 `cli.js`**
3. 定位根因：去掉 `"type": "module"` 后，tsup 输出从 `.js` 变成了 `.mjs`

修复：恢复 `"type": "module"`，重新构建输出正确的 `.js` 文件。

**这个 bug 的特点是：不是代码写错了，是两个工具（tsup 和 npm）对 ESM 的处理方式不一致。GLM-5.1 不是靠"知道答案"解决的，而是靠系统性排查定位到的。**

### 炸弹 4：Windows PowerShell 预览全部失败

发布到 1.0.2 后，在 Windows 上测试：

```
[clean-cyan] 经典四段式，│ 分隔，冷色调
  (无法渲染预览)
```

10 个主题全部失败。GLM-5.1 读了 `preview.ts` 的源码，指出三个问题：

1. Windows 下 `npx` 实际是 `npx.cmd`，`execFileSync('npx', ...)` 找不到
2. 原代码 `catch` 静默吞掉了错误，没有任何调试信息
3. 需要跨平台检测 npx 可执行文件

给出修复方案：

```typescript
function findNpx(): string {
  const isWin = process.platform === 'win32';
  const candidates = isWin ? ['npx.cmd', 'npx'] : ['npx'];
  for (const cmd of candidates) {
    try {
      execFileSync(cmd, ['--version'], {
        encoding: 'utf-8', timeout: 5000, stdio: 'pipe'
      });
      return cmd;
    } catch { continue; }
  }
  return 'npx';
}
```

同时加了 `CC_THEMES_DEBUG` 环境变量用于调试。

### 炸弹 5：shell: true 触发 Node.js 弃用警告

Windows 预览修好了，但出现警告：

```
(node:73744) [DEP0190] DeprecationWarning: Passing args to a child process
with shell option true can lead to security vulnerabilities
```

GLM-5.1 立刻指出：既然 `findNpx` 已经返回 `npx.cmd`，Node 可以直接执行 `.cmd` 文件，不需要 `shell: true`。

**一行改动解决，干净利落。**

---

## 第二关：误操作恢复

我不小心 `git checkout` 了三个修改过的文件，未提交的改动全部丢失。

GLM-5.1 从对话上下文中完整恢复了所有改动内容，包括：
- `preview.ts` 的跨平台兼容代码
- `package.json` 的版本号
- 构建验证

**这靠的不是 git 历史（改动没提交过），是对话记忆。**

---

## 综合评测

### 实力雷达图

| 能力维度 | 评分 | 点评 |
|----------|------|------|
| **问题诊断** | ⭐⭐⭐⭐⭐ | 每次都从根因出发，不做表面修补 |
| **跨平台经验** | ⭐⭐⭐⭐⭐ | Windows/Node/npm 的边界情况了然于心 |
| **工具链知识** | ⭐⭐⭐⭐⭐ | tsup/ESM/npm 的交互问题有实战经验 |
| **代码质量** | ⭐⭐⭐⭐☆ | 修复方案简洁，不过度设计 |
| **沟通效率** | ⭐⭐⭐⭐⭐ | 直接给命令和代码，零废话 |
| **上下文记忆** | ⭐⭐⭐⭐⭐ | 未提交代码被 checkout 后能完整恢复 |

### 三个高光时刻

**1. 一句话提交**

"提交git" → 两个字触发完整的多步骤 git 工作流，commit message 写得比我自己写的还好。

**2. 连环排障**

从镜像源 → 2FA → token → bin 字段 → .mjs/.js → Windows 兼容 → 弃用警告，七个问题一环扣一环，每次都给对了方向。

**3. 上下文恢复**

未提交的代码被 checkout 丢失后，从对话历史中完整还原。这不是搜索能力，是真正的上下文理解。

### 一个小遗憾

首次发布时没有预见到 `"type": "module"` 和 bin 字段的交互问题，导致走了 `.mjs` 的弯路。如果能提前提醒"去掉 type:module 后 tsup 会改输出扩展名"，就完美了。

---

## 最终评分

> **工程协作能力：9.2 / 10**

GLM-5.1 在这次真实开发任务中展现出的能力，已经不是"辅助工具"的级别，而是一个**你不需要解释太多上下文、就能跟上你思路的协作伙伴**。

它最大的优势不是"什么都知道"，而是：

- **面对未知错误时，能系统性缩小排查范围**
- **给出的每个方案都是最小改动，不引入额外复杂度**
- **沟通风格是工程师对工程师，没有一句客套话**

这在日常开发中，比"一次性给出完美答案"更有价值。

因为真实的开发，从来不是一道有标准答案的题。

---

*本文基于一次完整的 GLM-5.1 协作会话记录整理，未对 AI 的任何输出做挑选或美化。项目地址：https://github.com/wujunwei928/cc-themes*
