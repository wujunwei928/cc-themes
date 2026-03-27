import { getThemeByName } from '../themes/index.js';

export function exportTheme(name: string): void {
  const theme = getThemeByName(name);
  if (!theme) {
    console.error(`主题 "${name}" 不存在。运行 cc-themes list 查看可用主题。`);
    process.exit(1);
  }
  console.log(JSON.stringify(theme.config, null, 2));
}
