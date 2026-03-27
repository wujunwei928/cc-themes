import { getAllThemes } from '../themes/index.js';
import { use } from './use.js';

export function random(): void {
  const themes = getAllThemes();
  const pick = themes[Math.floor(Math.random() * themes.length)];
  use(pick.name);
}
