import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'neon',
  category: '紧凑',
  description: '霓虹高对比色，紧凑单行',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'brightCyan', bold: true }),
      w('separator', { character: '▸', color: 'brightMagenta' }),
      w('git-branch', { color: 'brightMagenta' }),
      w('separator', { character: '▸', color: 'brightGreen' }),
      w('context-percentage', { color: 'brightGreen' }),
      w('separator', { character: '▸', color: 'brightYellow' }),
      w('session-cost', { color: 'brightYellow' }),
    ]],
    flexMode: 'full',
    colorLevel: 2,
    globalBold: true,
  },
});
