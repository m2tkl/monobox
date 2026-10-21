import { computed, ref } from 'vue';

import type { useToast } from '#imports';
import type { AppConfigPayload } from '~/external/tauri/commands/config';

import { command } from '~/external/tauri/command';
import { iconKey } from '~/utils/icon';

export function useEditorSettings(toast: Pick<ReturnType<typeof useToast>, 'add'>) {
  const savedSelectionCopyFormat = ref('html');
  const selectionCopyFormat = ref('html');
  const isSelectionCopyFormatSaving = ref(false);

  const selectionCopyFormatOptions = [
    { label: 'HTML', value: 'html' },
    { label: 'Markdown', value: 'markdown' },
  ];

  const isSelectionCopyFormatDirty = computed(() => (
    normalizeSelectionCopyFormat(selectionCopyFormat.value) !== savedSelectionCopyFormat.value
  ));

  const normalizeSelectionCopyFormat = (value: string | number | null | undefined) => (
    value === 'markdown' ? 'markdown' : 'html'
  );

  const saveSelectionCopyFormat = async () => {
    try {
      isSelectionCopyFormatSaving.value = true;
      const format = normalizeSelectionCopyFormat(selectionCopyFormat.value);
      const config = await command.config.setSelectionCopyFormat(format);
      savedSelectionCopyFormat.value = normalizeSelectionCopyFormat(config.selection_copy_format);
      selectionCopyFormat.value = savedSelectionCopyFormat.value;
      toast.add({
        title: 'Saved copy format.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to save copy format.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isSelectionCopyFormatSaving.value = false;
    }
  };

  const initialize = (config: Pick<AppConfigPayload, 'selection_copy_format'>) => {
    savedSelectionCopyFormat.value = normalizeSelectionCopyFormat(config.selection_copy_format);
    selectionCopyFormat.value = savedSelectionCopyFormat.value;
  };

  return {
    selectionCopyFormat,
    isSelectionCopyFormatSaving,
    selectionCopyFormatOptions,
    isSelectionCopyFormatDirty,
    saveSelectionCopyFormat,
    initialize,
  };
}
