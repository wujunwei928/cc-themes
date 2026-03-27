// tests/types.test.ts
import { describe, it, expect } from 'vitest';
import { WidgetItemSchema, SettingsSchema } from '../src/types.js';

describe('WidgetItemSchema', () => {
  it('应接受最小合法 widget', () => {
    const result = WidgetItemSchema.safeParse({ id: '1', type: 'model' });
    expect(result.success).toBe(true);
  });

  it('应接受带所有可选字段的 widget', () => {
    const result = WidgetItemSchema.safeParse({
      id: '1', type: 'model', color: 'cyan', backgroundColor: 'bgBlue',
      bold: true, character: '│', rawValue: true, merge: 'no-padding',
      customText: 'hello', commandPath: '/bin/echo', maxWidth: 20,
      preserveColors: true, timeout: 5000, metadata: { key: 'val' },
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝缺少 id 的 widget', () => {
    const result = WidgetItemSchema.safeParse({ type: 'model' });
    expect(result.success).toBe(false);
  });

  it('应拒绝缺少 type 的 widget', () => {
    const result = WidgetItemSchema.safeParse({ id: '1' });
    expect(result.success).toBe(false);
  });
});

describe('SettingsSchema', () => {
  it('应提供默认值', () => {
    const result = SettingsSchema.parse({});
    expect(result.version).toBe(3);
    expect(result.lines).toHaveLength(3);
    expect(result.powerline.enabled).toBe(false);
  });

  it('应接受完整的主题配置', () => {
    const settings = {
      version: 3,
      lines: [
        [
          { id: '1', type: 'model', color: 'cyan', bold: true },
          { id: '2', type: 'separator', character: '│' },
          { id: '3', type: 'git-branch', color: 'magenta' },
        ],
      ],
      flexMode: 'full-minus-40',
      colorLevel: 2,
    };
    const result = SettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
  });
});
