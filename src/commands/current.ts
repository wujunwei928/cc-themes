import chalk from 'chalk';
import { readSettings } from '../utils/config.js';
import { findMatchingTheme } from '../themes/index.js';

export function current(): void {
  const settings = readSettings();
  if (!settings) {
    console.log(chalk.yellow('未检测到 ccstatusline 配置'));
    return;
  }
  const matched = findMatchingTheme(settings);
  console.log(chalk.bold('当前 ccstatusline 配置:'));
  if (matched) {
    console.log(`  主题: ${chalk.cyan(matched.name)} (${matched.description})`);
  } else {
    console.log(`  主题: ${chalk.gray('自定义配置（非内置主题）')}`);
  }
  console.log(`  行数: ${settings.lines.filter(l => l.length > 0).length}`);
  console.log(`  Widget 数: ${settings.lines.flat().filter(w => w.type !== 'separator' && w.type !== 'flex-separator').length}`);
  console.log(`  Powerline: ${settings.powerline.enabled ? '启用' : '禁用'}`);
}
