import { Command } from 'commander';
import { list } from './commands/list.js';
import { use } from './commands/use.js';
import { preview } from './commands/preview.js';
import { current } from './commands/current.js';
import { random } from './commands/random.js';
import { restore } from './commands/restore.js';
import { exportTheme } from './commands/export.js';

const program = new Command();

program
  .name('cc-themes')
  .description('ccstatusline 主题管理工具')
  .version('1.0.0');

program.command('list').description('列出所有内置主题').action(list);
program.command('use <name>').description('切换到指定主题').action(use);
program.command('preview <name>').description('预览主题效果').action(preview);
program.command('current').description('显示当前配置摘要').action(current);
program.command('random').description('随机切换一个主题').action(random);
program.command('restore').description('恢复上一次的配置备份').action(restore);
program.command('export <name>').description('导出主题 JSON 到 stdout').action(exportTheme);

program.parse();
