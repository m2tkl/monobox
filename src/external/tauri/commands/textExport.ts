import { invokeCommand } from '../core/invoker';

export const textExportCommand = {
  save: async (params: { path: string; content: string }) => {
    await invokeCommand('save_text_export', params);
  },

  saveMarkdown: async (params: { directoryPath: string; content: string }) => {
    await invokeCommand('save_markdown_export', {
      directory_path: params.directoryPath,
      content: params.content,
    });
  },

  saveMarkdownAsset: async (params: { directoryPath: string; src: string }) => {
    return await invokeCommand<string>('save_markdown_asset', {
      directory_path: params.directoryPath,
      src: params.src,
    });
  },
} as const;
