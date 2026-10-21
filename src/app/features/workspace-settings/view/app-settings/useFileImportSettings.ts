import { computed, ref } from 'vue';

import type { useToast } from '#imports';
import type { AppConfigPayload } from '~/external/tauri/commands/config';

import { command } from '~/external/tauri/command';
import { publishResourceChanges } from '~/resource-runtime/query-runtime';
import { changeRefs } from '~/resources/changes';
import { iconKey } from '~/utils/icon';

export function useFileImportSettings(toast: Pick<ReturnType<typeof useToast>, 'add'>) {
  const savedInboxIgnoreFileNames = ref<string[]>([]);
  const inboxIgnoreFileNamesText = ref('');
  const isInboxIgnoreSaving = ref(false);

  const isInboxIgnoreDirty = computed(() => (
    normalizeInboxIgnoreFileNames(inboxIgnoreFileNamesText.value).join('\n')
    !== savedInboxIgnoreFileNames.value.join('\n')
  ));

  const normalizeInboxIgnoreFileNames = (value: string | string[]) => {
    const lines = Array.isArray(value) ? value : value.split('\n');
    const names = lines
      .map(name => name.trim())
      .filter(Boolean);
    return Array.from(new Map(names.map(name => [name.toLowerCase(), name])).values())
      .sort((a, b) => a.localeCompare(b));
  };

  const saveInboxIgnoreFileNames = async () => {
    try {
      isInboxIgnoreSaving.value = true;
      const fileNames = normalizeInboxIgnoreFileNames(inboxIgnoreFileNamesText.value);
      const config = await command.config.setInboxIgnoreFileNames(fileNames);
      savedInboxIgnoreFileNames.value = normalizeInboxIgnoreFileNames(config.inbox_ignore_file_names);
      inboxIgnoreFileNamesText.value = savedInboxIgnoreFileNames.value.join('\n');
      void publishResourceChanges([changeRefs.inboxFileCollectionChanged()]);
      toast.add({
        title: 'Saved file ignore list.',
        duration: 1200,
        icon: iconKey.success,
      });
    }
    catch (error) {
      console.error(error);
      toast.add({
        title: 'Failed to save file ignore list.',
        color: 'error',
        icon: iconKey.failed,
      });
    }
    finally {
      isInboxIgnoreSaving.value = false;
    }
  };

  const initialize = (config: Pick<AppConfigPayload, 'inbox_ignore_file_names'>) => {
    savedInboxIgnoreFileNames.value = normalizeInboxIgnoreFileNames(config.inbox_ignore_file_names);
    inboxIgnoreFileNamesText.value = savedInboxIgnoreFileNames.value.join('\n');
  };

  return {
    inboxIgnoreFileNamesText,
    isInboxIgnoreSaving,
    isInboxIgnoreDirty,
    saveInboxIgnoreFileNames,
    initialize,
  };
}
