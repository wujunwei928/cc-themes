import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const cli = 'node';
const cliArgs = ['--import', 'tsx', 'src/cli.ts'];

describe('CLI 命令', () => {
  it('list 应输出主题列表', () => {
    const result = execFileSync(cli, [...cliArgs, 'list'], { encoding: 'utf-8' });
    expect(result).toContain('clean-cyan');
    expect(result).toContain('dracula-block');
    expect(result).toContain('dashboard');
  });

  it('export 应输出合法 JSON', () => {
    const result = execFileSync(cli, [...cliArgs, 'export', 'clean-cyan'], { encoding: 'utf-8' });
    const parsed = JSON.parse(result);
    expect(parsed.version).toBe(3);
    expect(parsed.lines).toBeDefined();
  });

  it('export 输出不应包含 ANSI 转义码', () => {
    const result = execFileSync(cli, [...cliArgs, 'export', 'neon'], { encoding: 'utf-8' });
    expect(result).not.toMatch(/\x1b\[/);
  });

  it('不存在的主题 export 应报错', () => {
    expect(() => {
      execFileSync(cli, [...cliArgs, 'export', 'nonexistent'], { encoding: 'utf-8' });
    }).toThrow();
  });
});

describe('use + restore 端到端', () => {
  let tmpDir: string;
  const origEnv = process.env.CLAUDE_CONFIG_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-themes-e2e-'));
    process.env.CLAUDE_CONFIG_DIR = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (origEnv) process.env.CLAUDE_CONFIG_DIR = origEnv;
    else delete process.env.CLAUDE_CONFIG_DIR;
  });

  it('use 应写入配置文件，restore 应恢复', () => {
    const configDir = path.join(tmpDir, 'ccstatusline');
    fs.mkdirSync(configDir, { recursive: true });
    const originalConfig = { version: 3, lines: [[{ id: '1', type: 'model', color: 'red' }]] };
    fs.writeFileSync(path.join(configDir, 'settings.json'), JSON.stringify(originalConfig));

    execFileSync(cli, [...cliArgs, 'use', 'neon'], {
      encoding: 'utf-8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: tmpDir },
    });

    const afterUse = JSON.parse(fs.readFileSync(path.join(configDir, 'settings.json'), 'utf-8'));
    expect(afterUse.lines[0][0].color).not.toBe('red');

    execFileSync(cli, [...cliArgs, 'restore'], {
      encoding: 'utf-8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: tmpDir },
    });

    const afterRestore = JSON.parse(fs.readFileSync(path.join(configDir, 'settings.json'), 'utf-8'));
    expect(afterRestore.lines[0][0].color).toBe('red');
  });
});
