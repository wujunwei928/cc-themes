import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'catppuccin-block',
  category: '色块',
  description: 'Catppuccin 柔和粉彩色块风格',
  config: {
    version: 3,
    lines: [[
      w('model', { color: 'brightWhite', backgroundColor: 'bgMagenta', bold: true }),
      w('separator', { character: '' }),
      w('git-branch', { color: 'brightWhite', backgroundColor: 'bgGreen' }),
      w('separator', { character: '' }),
      w('tokens-total', { color: 'brightWhite', backgroundColor: 'bgRed' }),
      w('separator', { character: '' }),
      w('context-percentage', { color: 'brightWhite', backgroundColor: 'bgBlue' }),
    ]],
    flexMode: 'full-minus-40',
    colorLevel: 2,
    defaultSeparator: '',
  },
});
