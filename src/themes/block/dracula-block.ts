import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'dracula-block',
  category: '色块',
  description: 'Dracula 暗紫色调色块风格',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'brightWhite', backgroundColor: 'bgMagenta', bold: true }),
      w('separator', { character: '' }),
      w('git-branch', { color: 'brightWhite', backgroundColor: 'bgRed' }),
      w('separator', { character: '' }),
      w('session-cost', { color: 'brightWhite', backgroundColor: 'bgCyan' }),
      w('separator', { character: '' }),
      w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgBrightBlack' }),
    ]],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
