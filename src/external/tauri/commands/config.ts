import { invokeCommand } from '../core/invoker';

export type AppConfigPayload = {
  database_path: string;
  asset_dir_path: string;
  setup_complete: boolean;
};

export type StorageCandidates = {
  database_paths: string[];
  asset_dir_paths: string[];
};

export type DefaultStoragePaths = {
  database_path: string;
  asset_dir_path: string;
};

export const configCommand = {
  get: async () => {
    return await invokeCommand<AppConfigPayload>('get_app_config');
  },

  detect: async () => {
    return await invokeCommand<StorageCandidates>('detect_storage_candidates');
  },

  defaults: async () => {
    return await invokeCommand<DefaultStoragePaths>('get_default_storage_paths');
  },

  validate: async () => {
    await invokeCommand('validate_app_config');
  },

  save: async (args: {
    databasePath: string;
    assetDirPath: string;
    setupComplete: boolean;
    createMissing: boolean;
  }) => {
    return await invokeCommand<AppConfigPayload>('save_app_config', {
      database_path: args.databasePath,
      asset_dir_path: args.assetDirPath,
      setup_complete: args.setupComplete,
      create_missing: args.createMissing,
    });
  },
} as const;
