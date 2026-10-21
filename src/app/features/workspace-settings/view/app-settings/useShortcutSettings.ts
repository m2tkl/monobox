import { computed, ref } from 'vue';

import type { useToast } from '#imports';
import type { AppConfigPayload } from '~/external/tauri/commands/config';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

export function useShortcutSettings(toast: Pick<ReturnType<typeof useToast>, 'add'>) {
  const savedFocusAppShortcut = ref('');
  const savedNewMemoShortcut = ref('');
  const focusAppShortcut = ref('');
  const newMemoShortcut = ref('');
  const isGlobalShortcutSaving = ref(false);

  const isGlobalShortcutDirty = computed(() => (
    focusAppShortcut.value.trim() !== savedFocusAppShortcut.value
    || newMemoShortcut.value.trim() !== savedNewMemoShortcut.value
  ));

  const saveGlobalShortcuts = async () => {
    try {
      isGlobalShortcutSaving.value = true;
      const config = await command.config.setGlobalShortcuts({
        focusAppShortcut: focusAppShortcut.value,
        newMemoShortcut: newMemoShortcut.value,
      });
      savedFocusAppShortcut.value = config.focus_app_shortcut;
      focusAppShortcut.value = config.focus_app_shortcut;
      savedNewMemoShortcut.value = config.new_memo_shortcut;
      newMemoShortcut.value = config.new_memo_shortcut;
      toast.add({
        title: 'Saved global shortcuts.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to save global shortcuts.',
        description: shortcutErrorMessage(error),
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isGlobalShortcutSaving.value = false;
    }
  };

  const shortcutErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const [, detail] = message.split(':', 2);
    return detail || message;
  };

  const initialize = (config: Pick<AppConfigPayload, 'focus_app_shortcut' | 'new_memo_shortcut'>) => {
    savedFocusAppShortcut.value = config.focus_app_shortcut;
    focusAppShortcut.value = config.focus_app_shortcut;
    savedNewMemoShortcut.value = config.new_memo_shortcut;
    newMemoShortcut.value = config.new_memo_shortcut;
  };

  return {
    focusAppShortcut,
    newMemoShortcut,
    isGlobalShortcutSaving,
    isGlobalShortcutDirty,
    saveGlobalShortcuts,
    initialize,
  };
}
