// src/themes/define.ts
import type { Theme, ccstatuslineSettings } from '../types.js';
import { SettingsSchema } from '../types.js';

export function defineTheme(theme: { name: string; category: string; description: string; config: ccstatuslineSettings }): Theme {
  const parsed = SettingsSchema.safeParse(theme.config);
  if (!parsed.success) {
    throw new Error(`主题 "${theme.name}" 的配置无效: ${parsed.error.message}`);
  }
  return { ...theme, config: parsed.data } as Theme;
}
