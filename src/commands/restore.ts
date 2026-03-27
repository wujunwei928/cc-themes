import chalk from 'chalk';
import { restoreSettings } from '../utils/config.js';

export function restore(): void {
  if (restoreSettings()) {
    console.log(chalk.green('已恢复到上一次的配置备份'));
  } else {
    console.error(chalk.red('没有可恢复的备份'));
    process.exit(1);
  }
}
