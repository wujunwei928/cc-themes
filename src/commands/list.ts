import chalk from 'chalk';
import { getAllThemes } from '../themes/index.js';

export function list(): void {
  const themes = getAllThemes();
  const categories = new Map<string, typeof themes>();
  for (const t of themes) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }
  for (const [cat, items] of categories) {
    console.log(chalk.bold(`\n  ${cat}`));
    for (const t of items) {
      console.log(`    ${chalk.cyan(t.name.padEnd(20))} ${chalk.gray(t.description)}`);
    }
  }
  console.log();
}
