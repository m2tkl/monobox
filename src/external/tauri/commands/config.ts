import { invokeCommand } from '../core/invoker';

export type AppConfigPayload = {
  database_path: string;
  asset_dir_path: string;
  files_storage_root: string;
  setup_complete: boolean;
  theme_preference?: string | null;
  app_window_opacity: number;
  focus_app_shortcut: string;
  new_memo_shortcut: string;
  mcp_server_url: string;
};

export type McpServerInfo = {
  enabled: boolean;
  bind_host: string;
  url_host: string;
  port: number;
  token: string;
  url: string;
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

  mcpServerInfo: async () => {
    return await invokeCommand<McpServerInfo>('get_mcp_server_info');
  },

  regenerateMcpServerToken: async () => {
    return await invokeCommand<McpServerInfo>('regenerate_mcp_server_token');
  },

  setThemePreference: async (mode: string) => {
    return await invokeCommand<AppConfigPayload>('set_theme_preference', { mode });
  },

  setAppWindowOpacity: async (opacity: number) => {
    return await invokeCommand<AppConfigPayload>('set_app_window_opacity', { opacity });
  },

  setGlobalShortcuts: async (args: {
    focusAppShortcut: string;
    newMemoShortcut: string;
  }) => {
    return await invokeCommand<AppConfigPayload>('set_global_shortcuts', {
      focus_app_shortcut: args.focusAppShortcut,
      new_memo_shortcut: args.newMemoShortcut,
    });
  },

  save: async (args: {
    databasePath: string;
    assetDirPath: string;
    filesStorageRoot: string;
    setupComplete: boolean;
    createMissing: boolean;
  }) => {
    return await invokeCommand<AppConfigPayload>('save_app_config', {
      database_path: args.databasePath,
      asset_dir_path: args.assetDirPath,
      files_storage_root: args.filesStorageRoot,
      setup_complete: args.setupComplete,
      create_missing: args.createMissing,
    });
  },
} as const;
