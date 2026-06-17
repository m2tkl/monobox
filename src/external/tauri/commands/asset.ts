import { invokeCommand } from '../core/invoker';

export const assetCommand = {
  readImageAsDataUrl: async (src: string) => {
    return await invokeCommand<string>('read_image_as_data_url', { src });
  },
} as const;
