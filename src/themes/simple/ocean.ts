import { defineTheme } from '../define.js';
import { createWidgetHelper } from '../helpers.js';
const w = createWidgetHelper();

export default defineTheme({
  name: 'ocean',
  category: '简约',
  description: '蓝/青渐变色调，含上下文进度条',
  config: {
    version: 3,
    lines: [
      [
        w('model', { color: 'cyan', bold: true }),
        w('separator', { character: '·', color: 'brightCyan' }),
        w('git-branch', { color: 'brightBlue' }),
        w('git-changes', { color: 'brightCyan' }),
        w('separator', { character: '·', color: 'brightCyan' }),
        w('tokens-total', { color: 'cyan' }),
        w('separator', { character: '·', color: 'brightCyan' }),
        w('context-percentage', { color: 'brightCyan' }),
      ],
      [w('context-bar', { color: 'cyan' })],
    ],
    flexMode: 'full-minus-40',
    colorLevel: 2,
  },
});
