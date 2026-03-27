// src/utils/config.ts — 配置读写与多版本备份恢复
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ccstatuslineSettings } from '../types.js';
import { SettingsSchema } from '../types.js';

const MAX_BACKUPS = 10;

/** 获取配置目录路径，支持 CLAUDE_CONFIG_DIR 环境变量覆盖 */
function getConfigDir(): string {
  const base = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.config');
  return path.join(base, 'ccstatusline');
}

/** 获取配置文件路径 */
export function getSettingsPath(): string {
  return path.join(getConfigDir(), 'settings.json');
}

/** 获取备份目录路径 */
function getBackupsDir(): string {
  return path.join(getConfigDir(), 'backups');
}

/**
 * 读取配置文件
 * 文件不存在或格式非法时返回 null
 */
export function readSettings(): ccstatuslineSettings | null {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return SettingsSchema.parse(parsed);
  } catch {
    return null;
  }
}

/**
 * 写入配置文件
 * 自动创建目标目录
 */
export function writeSettings(settings: ccstatuslineSettings): void {
  const configDir = getConfigDir();
  fs.mkdirSync(configDir, { recursive: true });
  const filePath = getSettingsPath();
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * 备份当前配置
 * - 创建带时间戳的备份副本
 * - 同步更新 latest.json
 * - 自动清理超出上限的旧备份（最多保留 MAX_BACKUPS 份）
 */
export function backupSettings(): void {
  const filePath = getSettingsPath();
  if (!fs.existsSync(filePath)) return;

  const backupsDir = getBackupsDir();
  fs.mkdirSync(backupsDir, { recursive: true });

  // 创建带时间戳的备份
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupsDir, `${timestamp}.json`);
  fs.copyFileSync(filePath, backupPath);

  // 同步 latest.json
  const latestPath = path.join(backupsDir, 'latest.json');
  fs.copyFileSync(filePath, latestPath);

  // 清理旧备份，保留最新 MAX_BACKUPS 份
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.json') && f !== 'latest.json')
    .sort();
  while (files.length > MAX_BACKUPS) {
    const old = files.shift()!;
    fs.unlinkSync(path.join(backupsDir, old));
  }
}

/**
 * 从最新备份恢复配置
 * @returns 恢复成功返回 true，无备份时返回 false
 */
export function restoreSettings(): boolean {
  const latestPath = path.join(getBackupsDir(), 'latest.json');
  if (!fs.existsSync(latestPath)) return false;
  fs.copyFileSync(latestPath, getSettingsPath());
  return true;
}
