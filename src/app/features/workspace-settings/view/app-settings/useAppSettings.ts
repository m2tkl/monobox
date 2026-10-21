import { useAppearanceSettings } from './useAppearanceSettings';
import { useEditorSettings } from './useEditorSettings';
import { useFileImportSettings } from './useFileImportSettings';
import { useMcpSettings } from './useMcpSettings';
import { useShortcutSettings } from './useShortcutSettings';

import type { useToast } from '#imports';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

// Keep drafts alive for the page lifetime and initialize them from one config read.
export function useAppSettings(toast: Pick<ReturnType<typeof useToast>, 'add'>) {
  const appearance = useAppearanceSettings(toast);
  const shortcuts = useShortcutSettings(toast);
  const editor = useEditorSettings(toast);
  const files = useFileImportSettings(toast);
  const mcp = useMcpSettings(toast);

  const loadAppSettings = async () => {
    try {
      const config = await command.config.get();
      appearance.initialize(config);
      shortcuts.initialize(config);
      files.initialize(config);
      editor.initialize(config);
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to load appearance settings.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
  };

  return { appearance, shortcuts, editor, files, mcp, loadAppSettings };
}
