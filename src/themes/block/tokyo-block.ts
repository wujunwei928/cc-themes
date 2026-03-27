import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'tokyo-block',
  category: '色块',
  description: 'Tokyo Night 蓝紫色调色块风格',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'brightWhite', backgroundColor: 'bgBlue', bold: true }),
      w('separator', { character: '' }),
      w('git-branch', { color: 'brightWhite', backgroundColor: 'bgMagenta' }),
      w('separator', { character: '' }),
      w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgYellow' }),
      w('separator', { character: '' }),
      w('output-speed', { color: 'brightWhite', backgroundColor: 'bgCyan' }),
    ]],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
