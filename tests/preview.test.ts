import { describe, it, expect } from 'vitest';
import { generateMockStatusJSON } from '../src/utils/preview.js';
import { createWidgetHelper } from '../src/themes/helpers.js';

describe('generateMockStatusJSON', () => {
  it('应返回合法 JSON', () => {
    const json = generateMockStatusJSON();
    const parsed = JSON.parse(json);
    expect(parsed.model.display_name).toBe('Sonnet');
    expect(parsed.context_window.used_percentage).toBe(28);
    expect(parsed.cost.total_cost_usd).toBe(0.42);
  });

  it('应包含必要字段', () => {
    const json = generateMockStatusJSON();
    const parsed = JSON.parse(json);
    expect(parsed.cwd).toBe(process.cwd());
    expect(parsed.workspace.current_dir).toBe(process.cwd());
    expect(parsed.session_id).toBe('preview-session-001');
  });
});

describe('createWidgetHelper', () => {
  it('应生成递增 ID', () => {
    const w = createWidgetHelper();
    const w1 = w('model');
    const w2 = w('git-branch');
    const w3 = w('directory');
    expect(w1.id).toBe('1');
    expect(w2.id).toBe('2');
    expect(w3.id).toBe('3');
  });

  it('应正确设置 type', () => {
    const w = createWidgetHelper();
    const widget = w('model');
    expect(widget.type).toBe('model');
  });

  it('应合并可选参数', () => {
    const w = createWidgetHelper();
    const widget = w('model', { color: 'cyan', bold: true });
    expect(widget.id).toBe('1');
    expect(widget.type).toBe('model');
    expect(widget.color).toBe('cyan');
    expect(widget.bold).toBe(true);
  });

  it('每次调用应独立计数', () => {
    const w1 = createWidgetHelper();
    const w2 = createWidgetHelper();
    expect(w1('model').id).toBe('1');
    expect(w2('model').id).toBe('1');
  });
});
