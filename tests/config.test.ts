import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readSettings, writeSettings, backupSettings, restoreSettings } from '../src/utils/config.js';

let tmpDir: string;
const origEnv = process.env.CLAUDE_CONFIG_DIR;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-themes-test-'));
  process.env.CLAUDE_CONFIG_DIR = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (origEnv) process.env.CLAUDE_CONFIG_DIR = origEnv;
  else delete process.env.CLAUDE_CONFIG_DIR;
});

describe('readSettings', () => {
  it('配置文件不存在时应返回 null', () => {
    expect(readSettings()).toBeNull();
  });

  it('应正确读取合法配置', () => {
    const configDir = path.join(tmpDir, 'ccstatusline');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, 'settings.json'),
      JSON.stringify({ version: 3, lines: [[{ id: '1', type: 'model', color: 'cyan' }]] })
    );
    const settings = readSettings();
    expect(settings).not.toBeNull();
    expect(settings!.version).toBe(3);
  });

  it('损坏的 JSON 应返回 null', () => {
    const configDir = path.join(tmpDir, 'ccstatusline');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'settings.json'), 'not json');
    expect(readSettings()).toBeNull();
  });
});

describe('writeSettings', () => {
  it('应创建目录并写入配置', () => {
    writeSettings({
      version: 3,
      lines: [[{ id: '1', type: 'model' }]],
    });
    const settings = readSettings();
    expect(settings).not.toBeNull();
  });
});

describe('backupSettings / restoreSettings', () => {
  it('应备份并恢复配置', () => {
    writeSettings({ version: 3, lines: [[{ id: '1', type: 'model', color: 'red' }]] });
    backupSettings();
    writeSettings({ version: 3, lines: [[{ id: '1', type: 'model', color: 'blue' }]] });
    restoreSettings();
    const restored = readSettings();
    expect(restored!.lines[0][0].color).toBe('red');
  });

  it('无备份时恢复应返回 false', () => {
    expect(restoreSettings()).toBe(false);
  });

  it('应最多保留 10 份备份', () => {
    writeSettings({ version: 3, lines: [[{ id: '1', type: 'model' }]] });
    for (let i = 0; i < 12; i++) {
      writeSettings({ version: 3, lines: [[{ id: '1', type: 'model', color: `c${i}` }]] });
      backupSettings();
    }
    const backupsDir = path.join(tmpDir, 'ccstatusline', 'backups');
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json') && f !== 'latest.json');
    expect(files.length).toBeLessThanOrEqual(10);
  });
});
