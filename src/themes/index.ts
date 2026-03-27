// src/themes/index.ts
import type { Theme, ccstatuslineSettings } from '../types.js';
import { defineTheme } from './define.js';

export { defineTheme };

import cleanCyan from './simple/clean-cyan.js';
import ocean from './simple/ocean.js';
import nordBlock from './block/nord-block.js';
import draculaBlock from './block/dracula-block.js';
import tokyoBlock from './block/tokyo-block.js';
import catppuccinBlock from './block/catppuccin-block.js';
import onelineRainbow from './compact/oneline-rainbow.js';
import neon from './compact/neon.js';
import dashboard from './rich/dashboard.js';
import developer from './rich/developer.js';

const ALL_THEMES: Theme[] = [
  cleanCyan, ocean,
  nordBlock, draculaBlock, tokyoBlock, catppuccinBlock,
  onelineRainbow, neon,
  dashboard, developer,
];

export function getAllThemes(): Theme[] {
  return ALL_THEMES;
}

export function getThemeByName(name: string): Theme | undefined {
  return ALL_THEMES.find(t => t.name === name);
}

export function findMatchingTheme(settings: ccstatuslineSettings): Theme | undefined {
  const normalizeLines = (lines: ccstatuslineSettings['lines']) =>
    JSON.stringify(lines.filter(l => l.length > 0));
  const target = normalizeLines(settings.lines);
  return ALL_THEMES.find(t => normalizeLines(t.config.lines) === target);
}
