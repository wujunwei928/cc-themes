import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'clean-cyan',
  category: '简约',
  description: '经典四段式，│ 分隔，冷色调',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'cyan', bold: true }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('context-percentage', { color: 'green' }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('git-branch', { color: 'magenta' }),
      w('separator', { character: '│', color: 'brightBlack' }),
      w('git-changes', { color: 'yellow' }),
    ]],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
