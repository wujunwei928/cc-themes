import chalk from 'chalk';
import { getThemeByName } from '../themes/index.js';
import { previewTheme } from '../utils/preview.js';

export function preview(name: string): void {
  const theme = getThemeByName(name);
  if (!theme) {
    console.error(chalk.red(`主题 "${name}" 不存在。运行 cc-themes list 查看可用主题。`));
    process.exit(1);
  }
  console.log(chalk.gray(`预览主题: ${chalk.bold(theme.name)} (${theme.description})`));
  console.log(chalk.gray('─'.repeat(60)));
  const result = previewTheme(theme.config);
  if (result) {
    console.log(result);
  } else {
    console.log(chalk.yellow('无法渲染预览（ccstatusline 可能未安装或预览数据不完整）'));
    console.log(chalk.gray(`使用 "cc-themes use ${name}" 切换后查看实际效果`));
  }
  console.log(chalk.gray('─'.repeat(60)));
}
