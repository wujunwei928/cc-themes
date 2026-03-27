import { describe, it, expect } from 'vitest';
import { generateMockStatusJSON } from '../src/utils/preview.js';

describe('generateMockStatusJSON', () => {
  it('应返回合法 JSON', () => {
    const json = generateMockStatusJSON();
    const parsed = JSON.parse(json);
    expect(parsed.model.display_name).toBe('Sonnet');
    expect(parsed.context_window.used_percentage).toBe(28);
    expect(parsed.cost.total_cost_usd).toBe(0.42);
  });
});
