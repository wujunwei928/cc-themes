import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ccstatuslineSettings } from '../types.js';

function generateMockStatusJSON(): string {
  // 使用当前工作目录，以便 ccstatusline 能获取真实的 git 分支和 diff 信息
  const cwd = process.cwd();
  return JSON.stringify({
    model: { id: 'claude-sonnet-4-6', display_name: 'Sonnet' },
    cwd,
    workspace: { current_dir: cwd, project_dir: cwd },
    cost: {
      total_cost_usd: 0.42,
      total_duration_ms: 185000,
      total_api_duration_ms: 120000,
      total_lines_added: 150,
      total_lines_removed: 30,
    },
    context_window: {
      total_input_tokens: 45000,
      total_output_tokens: 12000,
      context_window_size: 200000,
      used_percentage: 28,
      remaining_percentage: 72,
      current_usage: {
        input_tokens: 45000,
        output_tokens: 12000,
        cache_creation_input_tokens: 8000,
        cache_read_input_tokens: 20000,
      },
    },
    session_id: 'preview-session-001',
    transcript_path: '',
    version: '1.0.0',
    output_style: { name: 'default' },
  });
}

export function previewTheme(settings: ccstatuslineSettings): string | null {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-themes-preview-'));
  try {
    const configPath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf-8');

    const mockData = generateMockStatusJSON();

    const result = execFileSync('npx', ['-y', 'ccstatusline@latest', '--config', configPath], {
      input: mockData,
      encoding: 'utf-8',
      timeout: 30000,
    });

    return result.trim();
  } catch {
    return null;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// 导出 mock 数据生成器供测试使用
export { generateMockStatusJSON };
