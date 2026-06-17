import { invokeCommand } from '../core/invoker';

export const htmlExportCommand = {
  save: async (params: { path: string; html: string }) => {
    await invokeCommand('save_html_export', params);
  },
} as const;
