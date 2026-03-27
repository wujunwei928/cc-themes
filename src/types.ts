// src/types.ts
import { z } from 'zod';

// WidgetItem schema — 对齐 ccstatusline v3 的 WidgetItemSchema
export const WidgetItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  bold: z.boolean().optional(),
  character: z.string().optional(),
  rawValue: z.boolean().optional(),
  customText: z.string().optional(),
  commandPath: z.string().optional(),
  maxWidth: z.number().optional(),
  preserveColors: z.boolean().optional(),
  timeout: z.number().optional(),
  merge: z.union([z.boolean(), z.literal('no-padding')]).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type WidgetItem = z.infer<typeof WidgetItemSchema>;

// ccstatusline Settings schema — 对齐 ccstatusline v3 的 SettingsSchema
export const SettingsSchema = z.object({
  version: z.number().default(3),
  lines: z.array(z.array(WidgetItemSchema))
    .min(1)
    .default([
      [
        { id: '1', type: 'model', color: 'cyan' },
        { id: '2', type: 'separator' },
        { id: '3', type: 'context-length', color: 'brightBlack' },
        { id: '4', type: 'separator' },
        { id: '5', type: 'git-branch', color: 'magenta' },
        { id: '6', type: 'separator' },
        { id: '7', type: 'git-changes', color: 'yellow' },
      ],
      [],
      [],
    ]),
  flexMode: z.enum(['full', 'full-minus-40', 'full-until-compact']).default('full-minus-40'),
  compactThreshold: z.number().min(1).max(99).default(60),
  colorLevel: z.number().min(0).max(3).default(2),
  defaultSeparator: z.string().optional(),
  defaultPadding: z.string().optional(),
  inheritSeparatorColors: z.boolean().default(false),
  overrideBackgroundColor: z.string().optional(),
  overrideForegroundColor: z.string().optional(),
  globalBold: z.boolean().default(false),
  powerline: z.object({
    enabled: z.boolean().default(false),
    separators: z.array(z.string()).default(['\uE0B0']),
    separatorInvertBackground: z.array(z.boolean()).default([false]),
    startCaps: z.array(z.string()).default([]),
    endCaps: z.array(z.string()).default([]),
    theme: z.string().optional(),
    autoAlign: z.boolean().default(false),
  }).default({
    enabled: false,
    separators: ['\uE0B0'],
    separatorInvertBackground: [false],
    startCaps: [],
    endCaps: [],
    autoAlign: false,
  }),
});

export type ccstatuslineSettings = z.infer<typeof SettingsSchema>;

// 主题定义接口
export interface Theme {
  name: string;
  category: string;
  description: string;
  config: ccstatuslineSettings;
}
