import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'nord-block',
  category: '色块',
  description: 'Nord 北极蓝配色色块风格',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'brightWhite', backgroundColor: 'bgBlue', bold: true }),
      w('separator', { character: '' }),
      w('git-branch', { color: 'brightWhite', backgroundColor: 'bgCyan' }),
      w('separator', { character: '' }),
      w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgBrightBlack' }),
      w('separator', { character: '' }),
      w('git-changes', { color: 'brightWhite', backgroundColor: 'bgMagenta' }),
    ]],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
