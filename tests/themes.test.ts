import { describe, it, expect } from 'vitest';
import { getAllThemes, getThemeByName, findMatchingTheme } from '../src/themes/index.js';

describe('主题注册表', () => {
  it('应返回所有 10 个内置主题', () => {
    const themes = getAllThemes();
    expect(themes).toHaveLength(10);
  });

  it('每个主题都应有合法的 name/category/description/config', () => {
    const themes = getAllThemes();
    for (const theme of themes) {
      expect(theme.name).toBeTruthy();
      expect(theme.category).toBeTruthy();
      expect(theme.description).toBeTruthy();
      expect(theme.config.version).toBe(3);
      expect(theme.config.lines.length).toBeGreaterThanOrEqual(1);
      const contentWidgets = theme.config.lines.flat()
        .filter(w => w.type !== 'separator' && w.type !== 'flex-separator');
      expect(contentWidgets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('应按名称查找主题', () => {
    const theme = getThemeByName('clean-cyan');
    expect(theme).toBeDefined();
    expect(theme!.name).toBe('clean-cyan');
  });

  it('不存在的主题应返回 undefined', () => {
    const theme = getThemeByName('nonexistent');
    expect(theme).toBeUndefined();
  });

  it('主题名称应唯一', () => {
    const themes = getAllThemes();
    const names = themes.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('每个主题的 widget ID 在行内应唯一', () => {
    const themes = getAllThemes();
    for (const theme of themes) {
      for (const line of theme.config.lines) {
        const ids = line.map(w => w.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

describe('findMatchingTheme', () => {
  it('应匹配 clean-cyan 主题', () => {
    const theme = getThemeByName('clean-cyan')!;
    const matched = findMatchingTheme(theme.config);
    expect(matched?.name).toBe('clean-cyan');
  });

  it('不匹配的配置应返回 undefined', () => {
    const matched = findMatchingTheme({
      version: 3,
      lines: [[{ id: 'x', type: 'custom-text', customText: 'unique' }]],
    });
    expect(matched).toBeUndefined();
  });
});
