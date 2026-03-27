import { defineTheme } from '../define.js';
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
        w('git-changes', { color: 'brightMagenta' }),
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
