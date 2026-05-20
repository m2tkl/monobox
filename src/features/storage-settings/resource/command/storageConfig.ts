import { open } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

import { command } from '~/external/tauri/command';

export const storageConfigCommand = {
  get: () => command.config.get(),
  detect: () => command.config.detect(),
  defaults: () => command.config.defaults(),
  save: (params: { databasePath: string; assetDirPath: string; filesStorageRoot: string; setupComplete: boolean; createMissing: boolean }) =>
    command.config.save(params),
  selectDatabasePath: async () => {
    return await open({
      multiple: false,
      directory: false,
    });
  },
  selectAssetDir: async () => {
    return await open({
      multiple: false,
      directory: true,
    });
  },
  selectFilesStorageRoot: async () => {
    return await open({
      multiple: false,
      directory: true,
    });
  },
  restartApp: async () => {
    await relaunch();
  },
};
