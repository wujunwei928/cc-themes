import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'oneline-rainbow',
  category: '紧凑',
  description: '单行多段彩虹色，│ 分隔',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'cyan', bold: true }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('git-branch', { color: 'magenta' }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('context-percentage', { color: 'green' }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('session-cost', { color: 'yellow' }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('output-speed', { color: 'brightBlue' }),
    ]],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    globalBold: true,
  },
});
