import { defineTheme } from '../define.js';
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
      [w('context-bar', { color: 'cyan' })],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
