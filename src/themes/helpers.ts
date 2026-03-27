// src/themes/helpers.ts
import type { WidgetItem } from '../types.js';

export function createWidgetHelper() {
  let id = 0;
  return function w(type: string, opts?: Partial<Omit<WidgetItem, 'id' | 'type'>>): WidgetItem {
    return { id: String(++id), type, ...opts };
  };
}
