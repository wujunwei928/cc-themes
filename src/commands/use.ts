import chalk from 'chalk';
import { getThemeByName } from '../themes/index.js';
import { readSettings, writeSettings, backupSettings } from '../utils/config.js';

export function use(name: string): void {
  const theme = getThemeByName(name);
  if (!theme) {
    console.error(chalk.red(`主题 "${name}" 不存在。运行 cc-themes list 查看可用主题。`));
    process.exit(1);
  }
  const current = readSettings();
  if (current) backupSettings();
  writeSettings(theme.config);
  console.log(chalk.green(`已切换到主题: ${chalk.bold(theme.name)}`));
  console.log(chalk.gray(theme.description));
}
